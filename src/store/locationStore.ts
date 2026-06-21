import type { SavedLocation } from '../types'

const KEY = 'lilsuit_locations'
const MAX = 5

export function loadLocations(): SavedLocation[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveLocation(location: Omit<SavedLocation, 'id'>): SavedLocation {
  const locations = loadLocations()
  const existing = locations.find(l => l.name === location.name)
  if (existing) return existing
  const newLoc: SavedLocation = { ...location, id: crypto.randomUUID() }
  const updated = [newLoc, ...locations].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(updated))
  return newLoc
}

export function deleteLocation(id: string): void {
  const updated = loadLocations().filter(l => l.id !== id)
  localStorage.setItem(KEY, JSON.stringify(updated))
}
