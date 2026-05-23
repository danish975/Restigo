"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_model_1 = require("../modules/auth/auth.model");
const property_model_1 = require("../modules/property/property.model");
const room_model_1 = require("../modules/room/room.model");
const inventory_slot_model_1 = require("../modules/inventory/inventory-slot.model");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("../core/utils/logger");
const AMENITIES_POOL = [
    'wifi', 'parking', 'ac', 'tv', 'minibar', 'safe', 'room_service',
    'shower', 'coffee_machine', 'power_outlets', 'locker', 'quiet_zone',
];
const CITIES = [
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
];
const PROPERTY_TYPES = ['hotel', 'transit_room', 'coworking', 'nap_pod', 'lounge', 'capsule_hotel', 'meeting_room', 'short_stay_apartment'];
const ROOM_TYPES = ['standard', 'deluxe', 'suite', 'pod', 'capsule', 'desk', 'meeting_room', 'private_office'];
const randomSubset = (arr, count) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};
const seed = async () => {
    await (0, database_1.default)();
    logger_1.logger.info('Seeding database...');
    // Clear existing data
    await Promise.all([
        auth_model_1.User.deleteMany({}), property_model_1.Property.deleteMany({}),
        room_model_1.Room.deleteMany({}), inventory_slot_model_1.InventorySlot.deleteMany({}),
    ]);
    // Create admin user
    const admin = await auth_model_1.User.create({
        email: 'admin@restigo.app', password: 'Admin@123456',
        firstName: 'Admin', lastName: 'Restigo', role: 'admin',
        isEmailVerified: true,
    });
    // Create provider users
    const providers = [];
    for (let i = 1; i <= 5; i++) {
        const provider = await auth_model_1.User.create({
            email: `provider${i}@restigo.app`, password: 'Provider@123',
            firstName: `Provider`, lastName: `${i}`, role: 'provider',
            isEmailVerified: true,
        });
        providers.push(provider);
    }
    // Create test user
    await auth_model_1.User.create({
        email: 'user@restigo.app', password: 'User@123456',
        firstName: 'Test', lastName: 'User', role: 'user',
        isEmailVerified: true,
    });
    // Create properties
    const properties = [];
    const propertyData = [
        { name: 'The Taj Mahal Palace', type: 'hotel', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' },
        { name: 'Oberoi Grand Hotel', type: 'hotel', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800' },
        { name: 'SkyRest Transit Lounge', type: 'transit_room', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800' },
        { name: 'UrbanPod Cowork Hub', type: 'coworking', image: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800' },
        { name: 'ZenCapsule Stay', type: 'capsule_hotel', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800' },
        { name: 'Grand Hyatt Suites', type: 'hotel', image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800' },
        { name: 'FlexStay Business Suites', type: 'short_stay_apartment', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800' },
        { name: 'Leela Palace Retreat', type: 'hotel', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800' },
        { name: 'WorkBay Meeting Center', type: 'meeting_room', image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800' },
        { name: 'TransitEase Airport Hotel', type: 'transit_room', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800' },
        { name: 'CloudDesk Premium Office', type: 'coworking', image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800' },
        { name: 'JW Marriott Luxury', type: 'hotel', image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800' },
        { name: 'RestPoint Micro Hotel', type: 'hotel', image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800' },
        { name: 'PodLife Co-Living', type: 'nap_pod', image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800' },
        { name: 'ITC Gardenia Grand', type: 'hotel', image: 'https://images.unsplash.com/photo-1551882547-ff40c0d129fa?w=800' },
    ];
    for (let i = 0; i < propertyData.length; i++) {
        const pData = propertyData[i];
        const city = CITIES[i % CITIES.length];
        const type = pData.type;
        const provider = providers[i % providers.length];
        const basePrice = type === 'nap_pod' ? 199 : type === 'coworking' ? 299 : type === 'hotel' ? 899 : 399;
        const property = await property_model_1.Property.create({
            providerId: provider._id,
            name: pData.name,
            description: `Premium ${type.replace('_', ' ')} in ${city.name}. Perfect for hourly stays, short-term bookings, and flexible workspace needs. Modern amenities, prime location.`,
            type,
            images: [pData.image],
            location: {
                type: 'Point',
                coordinates: [city.lng + (Math.random() - 0.5) * 0.1, city.lat + (Math.random() - 0.5) * 0.1],
                address: `${100 + i} Business District, ${city.name}`,
                city: city.name, state: 'State', country: 'India', zipCode: `${400000 + i * 10}`,
            },
            amenities: randomSubset(AMENITIES_POOL, 4 + Math.floor(Math.random() * 5)),
            contact: { phone: `+91${9000000000 + i}`, email: `info@${pData.name.toLowerCase().replace(/\s/g, '')}.com` },
            priceRange: { min: basePrice, max: basePrice * 3, currency: 'INR' },
            rating: { average: 3.5 + Math.random() * 1.5, count: 10 + Math.floor(Math.random() * 200) },
            status: 'active', isVerified: true, featured: i < 8,
            operatingHours: { open: '06:00', close: '23:00', is24Hours: type === 'capsule_hotel' || type === 'hotel', closedDays: [] },
            policies: { cancellationPolicy: 'moderate', minBookingHours: 1, maxBookingHours: 12 },
        });
        properties.push(property);
    }
    // Create rooms and inventory slots
    for (const property of properties) {
        const roomCount = 3 + Math.floor(Math.random() * 5);
        for (let r = 0; r < roomCount; r++) {
            const roomType = ROOM_TYPES[r % ROOM_TYPES.length];
            const basePrice = property.priceRange.min + Math.random() * (property.priceRange.max - property.priceRange.min) * 0.3;
            const room = await room_model_1.Room.create({
                propertyId: property._id,
                name: `${roomType.charAt(0).toUpperCase() + roomType.slice(1).replace('_', ' ')} ${r + 1}`,
                type: roomType, roomNumber: `${Math.floor(Math.random() * 5) + 1}0${r + 1}`,
                capacity: { adults: roomType === 'desk' ? 1 : 2, children: 0 },
                basePrice: Math.round(basePrice), currency: 'INR',
                amenities: randomSubset(AMENITIES_POOL, 3),
                size: { value: roomType === 'pod' ? 50 : 200, unit: 'sqft' },
                description: `Comfortable ${roomType.replace('_', ' ')} with modern amenities.`,
            });
            // Generate slots for next 3 days
            const today = new Date();
            for (let d = 0; d < 3; d++) {
                const date = new Date(today);
                date.setDate(date.getDate() + d);
                date.setHours(0, 0, 0, 0);
                for (let hour = 6; hour < 22; hour++) {
                    const startTime = `${hour.toString().padStart(2, '0')}:00`;
                    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
                    await inventory_slot_model_1.InventorySlot.create({
                        roomId: room._id, propertyId: property._id,
                        date, startTime, endTime, durationMinutes: 60,
                        status: 'available', basePrice: room.basePrice, currency: 'INR',
                    }).catch(() => { }); // Skip duplicates
                }
            }
        }
        await property_model_1.Property.findByIdAndUpdate(property._id, { totalRooms: roomCount });
    }
    const stats = {
        users: await auth_model_1.User.countDocuments(),
        properties: await property_model_1.Property.countDocuments(),
        rooms: await room_model_1.Room.countDocuments(),
        slots: await inventory_slot_model_1.InventorySlot.countDocuments(),
    };
    logger_1.logger.info(stats, '✅ Database seeded successfully');
    logger_1.logger.info('Login credentials:');
    logger_1.logger.info('  Admin: admin@restigo.app / Admin@123456');
    logger_1.logger.info('  Provider: provider1@restigo.app / Provider@123');
    logger_1.logger.info('  User: user@restigo.app / User@123456');
    process.exit(0);
};
seed().catch((err) => {
    logger_1.logger.error('Seed error:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map