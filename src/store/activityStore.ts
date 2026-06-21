import type { Activity } from '../types'

const KEY = 'lilsuit_activity'

export function loadActivity(): Activity {
  return (localStorage.getItem(KEY) as Activity) ?? 'cycling'
}

export function saveActivity(activity: Activity): void {
  localStorage.setItem(KEY, activity)
}
