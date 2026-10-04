import { useSyncExternalStore } from 'react'
import { getSyncStatus, subscribeSync } from './engine'

export function useSyncStatus() {
  return useSyncExternalStore(subscribeSync, getSyncStatus, getSyncStatus)
}
