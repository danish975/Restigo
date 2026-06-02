"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { formatPrice, getPropertyTypeLabel, getPropertyTypeIcon } from "@/lib/utils";
import { searchAPI } from "@/lib/api";
import {
  Search, MapPin, Star, Clock, Filter, X, SlidersHorizontal,
  Wifi, Car, Wind, Coffee, ChevronDown, Grid3X3, Map as MapIcon, Loader2,
  ArrowRight, CheckCircle, Building2, BedDouble, Laptop, Users,
} from "lucide-react";

const SPACE_FILTERS = [
  { value: "", label: "All Spaces", icon: "🏢" },
  { value: "hotel", label: "Hotels", icon: "🏨" },
  { value: "coworking", label: "Coworking", icon: "💻" },
  { value: "nap_pod", label: "Rest Pods", icon: "😴" },
  { value: "lounge", label: "Lounges", icon: "🛋️" },
  { value: "capsule_hotel", label: "Capsule", icon: "🛏️" },
  { value: "meeting_room", label: "Meeting", icon: "📋" },
  { value: "transit_room", label: "Transit", icon: "✈️" },
];

const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated" },
  { value: "price_low", label: "Price: Low → High" },
  { value: "price_high", label: "Price: High → Low" },
  { value: "distance", label: "Nearest" },
];

const AMENITY_ICONS: Record<string, string> = {
  wifi: "📶", parking: "🅿️", ac: "❄️", tv: "📺", minibar: "🍷",
  safe: "🔒", room_service: "🛎️", shower: "🚿", coffee_machine: "☕",
  power_outlets: "🔌", locker: "🔐", quiet_zone: "🤫", gym: "💪",
  pool: "🏊", spa: "💆", restaurant: "🍽️", bar: "🍸", laundry: "👔",
  conference_room: "🏛️", business_center: "💼", shuttle: "🚌",
  printer: "🖨️", whiteboard: "📝", projector: "📽️", phone_booth: "📞",
  kitchen: "🍳", pet_friendly: "🐾", wheelchair_accessible: "♿",
  ev_charging: "⚡",
};

const CATEGORY_COLORS: Record<string, string> = {
  hotel: "from-blue-500/90 to-indigo-600/90",
  coworking: "from-emerald-500/90 to-teal-600/90",
  nap_pod: "from-violet-500/90 to-purple-600/90",
  lounge: "from-amber-500/90 to-orange-600/90",
  meeting_room: "from-rose-500/90 to-pink-600/90",
  capsule_hotel: "from-cyan-500/90 to-blue-600/90",
  transit_room: "from-sky-500/90 to-indigo-600/90",
};

function SearchContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  // Fetch from API
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 18, sortBy };
      if (query) params.q = query;
      if (typeFilter) params.type = typeFilter;
      if (maxPrice) params.maxPrice = maxPrice;
      if (minRating) params.rating = minRating;

      const { data } = await searchAPI.search(params);
      if (data.success) {
        setProperties(data.data.properties || []);
        setTotalPages(data.data.pagination?.pages || 1);
        setTotal(data.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [query, typeFilter, sortBy, page, maxPrice, minRating]);

  useEffect(() => {
    setPage(1);
  }, [query, typeFilter, sortBy, maxPrice, minRating]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchProperties(), 350);
    return () => clearTimeout(debounce);
  }, [fetchProperties]);

  const handleImageError = (id: string) => {
    setImgErrors((prev) => new Set(prev).add(id));
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Navbar />

      {/* ─── Search Header ─── */}
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
              id="toggle-filters"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex border border-[hsl(var(--border))] rounded-xl overflow-hidden">
              <button onClick={() => setViewMode("grid")} className={`p-3 transition-colors ${viewMode === "grid" ? "bg-[hsl(var(--secondary))]" : "hover:bg-[hsl(var(--secondary)/0.5)]"}`} id="view-grid">
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button onClick={() => setViewMode("map")} className={`p-3 transition-colors ${viewMode === "map" ? "bg-[hsl(var(--secondary))]" : "hover:bg-[hsl(var(--secondary)/0.5)]"}`} id="view-map">
                <MapIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Type filters */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {SPACE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  typeFilter === f.value
                    ? "bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] text-white shadow-lg"
                    : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] border border-[hsl(var(--border))]"
                }`}
                id={`filter-${f.value || "all"}`}
              >
                <span className="text-xs">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>

          {/* Filters panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="pt-4 mt-4 border-t border-[hsl(var(--border))] grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Sort By</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full py-2 px-3 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm outline-none" id="sort-select">
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Max Price/hr</label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="₹2000"
                      className="w-full py-2 px-3 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm outline-none"
                      id="filter-max-price"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Min Rating</label>
                    <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="w-full py-2 px-3 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm outline-none" id="filter-min-rating">
                      <option value="">Any</option>
                      <option value="4.5">4.5+ ★</option>
                      <option value="4.0">4.0+ ★</option>
                      <option value="3.5">3.5+ ★</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => { setMaxPrice(""); setMinRating(""); setQuery(""); setTypeFilter(""); }}
                      className="w-full py-2 px-3 rounded-lg border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--secondary))] transition-colors"
                      id="clear-filters"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Results ─── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            <span className="font-semibold text-[hsl(var(--foreground))]">{total}</span> spaces found
            {query && <> for &quot;<span className="font-medium text-[hsl(var(--foreground))]">{query}</span>&quot;</>}
            {typeFilter && <> in <span className="font-medium text-[hsl(var(--foreground))]">{SPACE_FILTERS.find(f => f.value === typeFilter)?.label}</span></>}
          </p>
          {totalPages > 1 && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Page {page} of {totalPages}
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
                <div className="h-52 skeleton" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 skeleton rounded" />
                  <div className="h-4 w-1/2 skeleton rounded" />
                  <div className="h-4 w-2/3 skeleton rounded" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-6 w-14 skeleton rounded-md" />
                    <div className="h-6 w-14 skeleton rounded-md" />
                    <div className="h-6 w-14 skeleton rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {properties.map((property, i) => (
                <motion.div
                  key={property._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.4 }}
                  layout
                >
                  <Link href={`/property/${property.slug}`} className="group block" id={`property-${property._id}`}>
                    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden transition-all duration-300 hover:border-[hsl(var(--primary)/0.4)] hover:shadow-xl hover:shadow-[hsl(var(--primary))/0.08] hover:-translate-y-1">
                      {/* ─── Hero Image ─── */}
                      <div className="relative h-52 bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--muted))] overflow-hidden">
                        {property.images?.[0] && !imgErrors.has(property._id) ? (
                          <img
                            src={property.images[0]}
                            alt={property.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            onError={() => handleImageError(property._id)}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-6xl opacity-30 group-hover:scale-110 transition-transform duration-500">
                              {getPropertyTypeIcon(property.type)}
                            </span>
                          </div>
                        )}

                        {/* Gradient overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                        {/* Category badge */}
                        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r ${CATEGORY_COLORS[property.type] || "from-gray-500/90 to-gray-600/90"} text-white text-xs font-semibold backdrop-blur-sm shadow-sm`}>
                          {getPropertyTypeLabel(property.type)}
                        </div>

                        {/* Featured badge */}
                        {property.featured && (
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Featured
                          </div>
                        )}

                        {/* Price tag */}
                        <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-[hsl(var(--background)/0.9)] backdrop-blur-sm text-sm font-bold shadow-lg">
                          {formatPrice(property.priceRange?.min || 0)}
                          <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">/hr</span>
                        </div>

                        {/* Availability indicator */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-medium backdrop-blur-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          Available
                        </div>
                      </div>

                      {/* ─── Card Body ─── */}
                      <div className="p-5">
                        {/* Name */}
                        <h3 className="font-semibold text-base mb-1.5 group-hover:text-[hsl(var(--primary))] transition-colors line-clamp-1">
                          {property.name}
                        </h3>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] mb-3">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--primary))]" />
                          <span className="line-clamp-1">
                            {property.location?.city || "Unknown"}{property.location?.country ? `, ${property.location.country}` : ""}
                          </span>
                        </div>

                        {/* Rating + Reviews */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-500/10">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-semibold text-sm text-amber-600 dark:text-amber-400">
                                {(property.rating?.average || 0).toFixed(1)}
                              </span>
                            </div>
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                              ({property.rating?.count || 0} reviews)
                            </span>
                          </div>
                          {property.distance != null && (
                            <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.distance.toFixed(1)} km
                            </span>
                          )}
                        </div>

                        {/* Amenities */}
                        <div className="flex gap-1.5 mb-4 flex-wrap">
                          {(property.amenities || []).slice(0, 4).map((a: string) => (
                            <span
                              key={a}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] text-xs capitalize"
                            >
                              <span className="text-[10px]">{AMENITY_ICONS[a] || "•"}</span>
                              {a.replace(/_/g, " ")}
                            </span>
                          ))}
                          {(property.amenities?.length || 0) > 4 && (
                            <span className="px-2 py-0.5 rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] text-xs font-medium">
                              +{property.amenities.length - 4} more
                            </span>
                          )}
                        </div>

                        {/* Book Now CTA */}
                        <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(174,72%,40%)] text-white text-sm font-semibold shadow-md shadow-[hsl(174,72%,46%)]/15 hover:shadow-lg hover:shadow-[hsl(174,72%,46%)]/25 transition-all duration-300 flex items-center justify-center gap-2 group-hover:from-[hsl(174,72%,50%)] group-hover:to-[hsl(174,72%,44%)]">
                          Book Now
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ─── Empty State ─── */}
        {properties.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="inline-flex p-4 rounded-full bg-[hsl(var(--secondary))] mb-4">
              <Search className="h-8 w-8 text-[hsl(var(--muted-foreground))] opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No spaces found</h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm mb-6">Try adjusting your search or filters to find what you&apos;re looking for.</p>
            <button
              onClick={() => { setQuery(""); setTypeFilter(""); setMaxPrice(""); setMinRating(""); }}
              className="px-6 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              id="clear-search"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* ─── Pagination ─── */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--secondary))] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              id="page-prev"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${
                      page === pageNum
                        ? "bg-gradient-to-r from-[hsl(174,72%,46%)] to-[hsl(253,63%,58%)] text-white shadow-lg"
                        : "hover:bg-[hsl(var(--secondary))]"
                    }`}
                    id={`page-${pageNum}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--secondary))] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              id="page-next"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading spaces...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
