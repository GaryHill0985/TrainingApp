import { registerSW } from 'virtual:pwa-register'

/**
 * Keep the installed app on the latest version. The worker is built with autoUpdate, so a new
 * version takes over as soon as it has downloaded; this registration reloads the page at that
 * moment (instead of waiting for the next cold start) and re-checks for updates each time the
 * app comes to the front and every hour while it stays open.
 */
export function startAppUpdates() {
  if (!('serviceWorker' in navigator)) return
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => { if (navigator.onLine) void registration.update() }
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check() })
      window.setInterval(check, 60 * 60 * 1000)
    },
  })
}
