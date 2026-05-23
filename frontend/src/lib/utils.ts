import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function generateBookingCode(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RST-${ts}-${rand}`;
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    hotel: 'Hotel',
    transit_room: 'Transit Room',
    coworking: 'Coworking Space',
    nap_pod: 'Nap Pod',
    lounge: 'Lounge',
    capsule_hotel: 'Capsule Hotel',
    meeting_room: 'Meeting Room',
    short_stay_apartment: 'Short-Stay Apartment',
  };
  return labels[type] || type;
}

export function getPropertyTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    hotel: '🏨',
    transit_room: '✈️',
    coworking: '💻',
    nap_pod: '😴',
    lounge: '🛋️',
    capsule_hotel: '🛏️',
    meeting_room: '📋',
    short_stay_apartment: '🏠',
  };
  return icons[type] || '🏢';
}
