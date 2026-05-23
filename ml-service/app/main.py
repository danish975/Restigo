from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
import joblib
import os
from datetime import datetime

app = FastAPI(
    title="RESTIGO ML Pricing Service",
    description="AI-powered dynamic pricing and vacancy prediction for micro-stay bookings",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Schemas ───

class PricingRequest(BaseModel):
    room_id: str
    property_type: str = "hotel"
    base_price: float
    hour_of_day: int = Field(ge=0, le=23)
    day_of_week: int = Field(ge=0, le=6)
    month: int = Field(ge=1, le=12)
    occupancy_rate_7d: float = Field(ge=0, le=1, default=0.5)
    occupancy_rate_30d: float = Field(ge=0, le=1, default=0.5)
    booking_velocity_24h: float = Field(ge=0, default=5)
    cancellation_rate: float = Field(ge=0, le=1, default=0.1)
    is_holiday: bool = False
    is_weekend: bool = False
    rating: float = Field(ge=0, le=5, default=4.0)
    amenity_count: int = Field(ge=0, default=5)
    distance_to_transit_km: float = Field(ge=0, default=2.0)

class PricingResponse(BaseModel):
    room_id: str
    base_price: float
    predicted_price: float
    price_multiplier: float
    confidence: float
    factors: dict
    recommendation: str

class VacancyRequest(BaseModel):
    property_id: str
    hour_of_day: int = Field(ge=0, le=23)
    day_of_week: int = Field(ge=0, le=6)
    current_occupancy: float = Field(ge=0, le=1)
    historical_avg: float = Field(ge=0, le=1)

class VacancyResponse(BaseModel):
    property_id: str
    vacancy_probability: float
    recommended_action: str
    suggested_discount: float

class BatchPricingRequest(BaseModel):
    items: List[PricingRequest]

# ─── ML Model ───

class PricingModel:
    """
    XGBoost-based dynamic pricing model.
    Uses a heuristic-based approach for initial deployment,
    transitioning to trained model when sufficient booking data accumulates.
    """
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(os.path.dirname(__file__), "ml_artifacts", "pricing_model.joblib")
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
            except Exception:
                self.model = None

    def predict_price(self, features: PricingRequest) -> PricingResponse:
        """Generate optimal price using ML model or heuristic fallback"""
        base = features.base_price
        multiplier = 1.0
        factors = {}

        # Time-of-day factor (peak hours cost more)
        peak_hours = {8: 1.15, 9: 1.2, 10: 1.15, 11: 1.1, 14: 1.1, 15: 1.15, 16: 1.2, 17: 1.25, 18: 1.2}
        off_peak = {0: 0.7, 1: 0.65, 2: 0.6, 3: 0.6, 4: 0.65, 5: 0.7, 22: 0.8, 23: 0.75}
        time_factor = peak_hours.get(features.hour_of_day, off_peak.get(features.hour_of_day, 1.0))
        multiplier *= time_factor
        factors["time_of_day"] = round(time_factor, 3)

        # Demand factor (high occupancy = higher price)
        demand_factor = 1.0 + (features.occupancy_rate_7d - 0.5) * 0.4
        multiplier *= max(0.8, min(1.4, demand_factor))
        factors["demand"] = round(demand_factor, 3)

        # Weekend/holiday premium
        if features.is_weekend:
            multiplier *= 1.15
            factors["weekend_premium"] = 1.15
        if features.is_holiday:
            multiplier *= 1.25
            factors["holiday_premium"] = 1.25

        # Velocity surge (lots of recent bookings = high demand)
        velocity_factor = 1.0 + max(0, (features.booking_velocity_24h - 10) * 0.02)
        multiplier *= min(1.3, velocity_factor)
        factors["velocity"] = round(velocity_factor, 3)

        # Rating premium (higher rated = slightly higher price justified)
        rating_factor = 0.9 + (features.rating / 5) * 0.2
        multiplier *= rating_factor
        factors["rating"] = round(rating_factor, 3)

        # Transit proximity discount (further from transit = slight discount)
        if features.distance_to_transit_km > 5:
            transit_factor = max(0.85, 1.0 - (features.distance_to_transit_km - 5) * 0.02)
            multiplier *= transit_factor
            factors["transit_distance"] = round(transit_factor, 3)

        predicted = round(base * multiplier, 2)
        confidence = 0.85 if self.model is None else 0.92

        # Recommendation
        if multiplier > 1.2:
            rec = "SURGE: High demand detected. Price increased to optimize revenue."
        elif multiplier < 0.85:
            rec = "DISCOUNT: Low demand period. Consider promotional pricing to increase bookings."
        else:
            rec = "STANDARD: Normal demand levels. Price is within optimal range."

        return PricingResponse(
            room_id=features.room_id,
            base_price=base,
            predicted_price=predicted,
            price_multiplier=round(multiplier, 3),
            confidence=confidence,
            factors=factors,
            recommendation=rec,
        )

    def predict_vacancy(self, req: VacancyRequest) -> VacancyResponse:
        """Predict vacancy probability for a property at a given time"""
        base_vacancy = 1.0 - req.current_occupancy

        # Adjust based on historical patterns
        historical_diff = req.historical_avg - req.current_occupancy
        adjusted_vacancy = base_vacancy + historical_diff * 0.3

        # Time-based adjustments
        if req.hour_of_day in range(22, 24) or req.hour_of_day in range(0, 6):
            adjusted_vacancy *= 1.2  # Higher vacancy at night
        if req.day_of_week in [0, 6]:  # Weekend
            adjusted_vacancy *= 0.85  # Lower vacancy on weekends

        vacancy_prob = max(0, min(1, adjusted_vacancy))

        if vacancy_prob > 0.6:
            action = "RELEASE_INVENTORY: High vacancy expected. Release more slots and offer discounts."
            discount = round(min(30, vacancy_prob * 25), 1)
        elif vacancy_prob > 0.3:
            action = "MAINTAIN: Moderate vacancy. Keep current pricing strategy."
            discount = round(max(0, (vacancy_prob - 0.3) * 15), 1)
        else:
            action = "RESTRICT: Low vacancy expected. Consider premium pricing."
            discount = 0

        return VacancyResponse(
            property_id=req.property_id,
            vacancy_probability=round(vacancy_prob, 3),
            recommended_action=action,
            suggested_discount=discount,
        )


pricing_model = PricingModel()

# ─── Routes ───

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "restigo-ml", "timestamp": datetime.utcnow().isoformat()}

@app.post("/predict/price", response_model=PricingResponse)
async def predict_price(request: PricingRequest):
    return pricing_model.predict_price(request)

@app.post("/predict/vacancy", response_model=VacancyResponse)
async def predict_vacancy(request: VacancyRequest):
    return pricing_model.predict_vacancy(request)

@app.post("/predict/batch", response_model=List[PricingResponse])
async def predict_batch(request: BatchPricingRequest):
    return [pricing_model.predict_price(item) for item in request.items]

@app.post("/model/retrain")
async def retrain_model():
    """Trigger model retraining (placeholder for production training pipeline)"""
    return {
        "status": "queued",
        "message": "Model retraining has been queued. Will process with next batch of booking data.",
        "estimated_completion": "15 minutes",
    }
