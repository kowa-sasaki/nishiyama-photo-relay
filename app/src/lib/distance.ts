import type { Spot } from './types'

const EARTH_RADIUS_METERS = 6371000

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h))
}

export function sortSpotsByDistance(spots: Spot[], origin: { lat: number; lng: number }): Spot[] {
  return [...spots].sort(
    (a, b) =>
      distanceMeters({ lat: a.lat, lng: a.lng }, origin) - distanceMeters({ lat: b.lat, lng: b.lng }, origin),
  )
}

export function getDistancesBySpot(spots: Spot[], origin: { lat: number; lng: number }): Map<string, number> {
  return new Map(spots.map((spot) => [spot.id, distanceMeters({ lat: spot.lat, lng: spot.lng }, origin)]))
}

export function formatDistanceLabel(meters: number): string {
  const rounded = Math.round(meters)
  if (rounded < 1000) {
    return `${rounded}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}
