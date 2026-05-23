"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { formatPrice, getPropertyTypeLabel, getPropertyTypeIcon } from "@/lib/utils";
import { searchAPI } from "@/lib/api";
import {
  Search, MapPin, Star, Clock, Filter, X, SlidersHorizontal,
  Wifi, Car, Wind, Coffee, ChevronDown, Grid3X3, Map as MapIcon, Loader2,
} from "lucide-react";

const SPACE_FILTERS = [
  { value: "", label: "All Spaces" },
  { value: "hotel", label: "Hotels" },
  { value: "coworking", label: "Coworking" },
  { value: "nap_pod", label: "Rest Pods" },
  { value: "lounge", label: "Lounges" },
  { value: "capsule_hotel", label: "Capsule" },
  { value: "meeting_room", label: "Meeting" },
  { value: "transit_room", label: "Transit" },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [loading, setLoading] = useState(true);

  // Fetch from API
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (query) params.location = query; // The backend uses location or text search
        if (typeFilter) params.type = typeFilter;
        
        const { data } = await searchAPI.search(params);
        if (data.success) {
          setProperties(data.data.properties);
        }
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchProperties();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, typeFilter]);

  // Sort
  const filtered = [...properties]
    .sort((a, b) => {
      if (sortBy === "price_low") return a.priceRange.min - b.priceRange.min;
      if (sortBy === "price_high") return b.priceRange.max - a.priceRange.max;
      if (sortBy === "rating") return b.rating.average - a.rating.average;
      return (a.distance || 0) - (b.distance || 0);
    });

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Navbar />

      {/* Search Header */}
      <div className="pt-20 pb-6 px-4 sm:px-6 lg:px-8 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="mx-auto max-w-7xl">
          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by city, name, or type..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all text-sm"
                id="search-input"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl border transition-colors ${showFilters ? 'bg-[hsl(var(--primary))] text-white border-transparent' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))]'}`}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex border border-[hsl(var(--border))] rounded-xl overflow-hidden">
              <button onClick={() => setViewMode("grid")} className={`p-3 ${viewMode === "grid" ? "bg-[hsl(var(--secondary))]" : ""}`}><Grid3X3 className="h-5 w-5" /></button>
              <button onClick={() => setViewMode("map")} className={`p-3 ${viewMode === "map" ? "bg-[hsl(var(--secondary))]" : ""}`}><MapIcon className="h-5 w-5" /></button>
            </div>
          </div>

          {/* Type filters */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {SPACE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  typeFilter === f.value
                    ? "bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] text-white shadow-lg"
                    : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] border border-[hsl(var(--border))]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Filters panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-4 mt-4 border-t border-[hsl(var(--border))] grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Sort By</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full py-2 px-3 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm outline-none">
                      <option value="rating">Top Rated</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                      <option value="distance">Nearest</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Max Price/hr</label>
                    <input type="number" placeholder="₹2000" className="w-full py-2 px-3 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Min Rating</label>
                    <select className="w-full py-2 px-3 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm outline-none">
                      <option value="">Any</option>
                      <option value="4.5">4.5+ ★</option>
                      <option value="4.0">4.0+ ★</option>
                      <option value="3.5">3.5+ ★</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Radius</label>
                    <select className="w-full py-2 px-3 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm outline-none">
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                      <option value="25">25 km</option>
                      <option value="50">50 km</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            <span className="font-semibold text-[hsl(var(--foreground))]">{filtered.length}</span> spaces found
            {query && <> for &quot;<span className="font-medium text-[hsl(var(--foreground))]">{query}</span>&quot;</>}
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
                <div className="h-48 skeleton" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 skeleton rounded" />
                  <div className="h-4 w-1/2 skeleton rounded" />
                  <div className="h-4 w-2/3 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((property, i) => (
                <motion.div
                  key={property._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/property/${property.slug}`} className="group block">
                    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden transition-all hover:border-[hsl(var(--primary)/0.4)] hover:shadow-xl hover:shadow-[hsl(var(--primary))/0.05] hover:-translate-y-1">
                      {/* Image placeholder with gradient */}
                      <div className="relative h-48 bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--muted))] flex items-center justify-center overflow-hidden">
                        <div className="text-6xl opacity-30 group-hover:scale-110 transition-transform duration-500">
                          {getPropertyTypeIcon(property.type)}
                        </div>
                        {property.featured && (
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold">
                            Featured
                          </div>
                        )}
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full glass text-xs font-medium">
                          {getPropertyTypeLabel(property.type)}
                        </div>
                        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-[hsl(var(--background))] text-xs font-semibold">
                          from {formatPrice(property.priceRange.min)}<span className="text-[hsl(var(--muted-foreground))] font-normal">/hr</span>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="font-semibold text-base mb-1 group-hover:text-[hsl(var(--primary))] transition-colors line-clamp-1">
                          {property.name}
                        </h3>

                        <div className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))] mb-3">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="line-clamp-1">{property.location.address}, {property.location.city}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-sm">{property.rating.average.toFixed(1)}</span>
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">({property.rating.count})</span>
                          </div>
                          {property.distance && (
                            <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.distance.toFixed(1)} km
                            </span>
                          )}
                        </div>

                        {/* Amenities */}
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          {property.amenities.slice(0, 4).map((a: string) => (
                            <span key={a} className="px-2 py-0.5 rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] text-xs capitalize">
                              {a.replace('_', ' ')}
                            </span>
                          ))}
                          {property.amenities.length > 4 && (
                            <span className="px-2 py-0.5 rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] text-xs">
                              +{property.amenities.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No spaces found</h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
