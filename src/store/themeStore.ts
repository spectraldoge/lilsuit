const KEY = 'lilsuit_theme'

export type Theme = 'dark' | 'light'

export function loadTheme(): Theme {
  return (localStorage.getItem(KEY) as Theme) ?? 'dark'
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(KEY, theme)
}

export function applyTheme(theme: Theme): void {
  if (theme === 'light') {
    document.documentElement.classList.add('light')
    document.documentElement.classList.remove('dark')
  } else {
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('light')
  }
}
