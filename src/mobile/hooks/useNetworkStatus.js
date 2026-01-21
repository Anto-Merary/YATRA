import { useState, useEffect } from 'react'

/**
 * Hook to detect network connection status and type
 * Uses NetworkInformation API when available, falls back to navigator.onLine
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: '4g', // 'slow-2g', '2g', '3g', '4g'
    saveData: false,
    downlink: Infinity,
  })

  useEffect(() => {
    // Check if NetworkInformation API is available
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection

    if (!connection) {
      // Fallback to basic online/offline detection
      const handleOnline = () => {
        setNetworkStatus((prev) => ({ ...prev, isOnline: true }))
      }
      const handleOffline = () => {
        setNetworkStatus((prev) => ({ ...prev, isOnline: false, effectiveType: 'offline' }))
      }

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }

    // Update network status
    const updateNetworkStatus = () => {
      setNetworkStatus({
        isOnline: navigator.onLine,
        effectiveType: connection.effectiveType || '4g',
        saveData: connection.saveData || false,
        downlink: connection.downlink || Infinity,
      })
    }

    // Initial update
    updateNetworkStatus()

    // Listen for network changes
    connection.addEventListener('change', updateNetworkStatus)

    // Also listen for online/offline events
    const handleOnline = () => updateNetworkStatus()
    const handleOffline = () => {
      setNetworkStatus((prev) => ({ ...prev, isOnline: false, effectiveType: 'offline' }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      connection.removeEventListener('change', updateNetworkStatus)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Determine if connection is slow
  const isSlowConnection =
    !networkStatus.isOnline ||
    networkStatus.effectiveType === 'slow-2g' ||
    networkStatus.effectiveType === '2g' ||
    (networkStatus.effectiveType === '3g' && networkStatus.downlink < 1.5) ||
    networkStatus.saveData

  return {
    ...networkStatus,
    isSlowConnection,
    shouldLoadVideo: !isSlowConnection, // Don't load video on slow connections
  }
}
