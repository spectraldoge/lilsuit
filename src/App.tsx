import { useState, useEffect } from 'react'
import type { UserProfile } from './types'
import { loadProfile } from './store/profileStore'
import Onboarding from './components/Onboarding'
import HomeScreen from './components/HomeScreen'
import SettingsScreen from './components/SettingsScreen'

type Screen = 'onboarding' | 'home' | 'settings'

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding')
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const saved = loadProfile()
    if (saved) {
      setProfile(saved)
      setScreen('home')
    }
  }, [])

  if (screen === 'onboarding' || !profile) {
    return (
      <Onboarding
        onComplete={p => {
          setProfile(p)
          setScreen('home')
        }}
      />
    )
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        profile={profile}
        onSave={p => {
          setProfile(p)
          setScreen('home')
        }}
        onBack={() => setScreen('home')}
      />
    )
  }

  return (
    <HomeScreen
      profile={profile}
      onOpenSettings={() => setScreen('settings')}
    />
  )
}
