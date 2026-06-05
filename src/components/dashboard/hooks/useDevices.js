// Hardware device (QR/NFC) inventory state + CRUD for the Dashboard.
// Self-contained, no persistence. Extracted from Dashboard.jsx (Group 5).
import { useState } from 'react'
import { INITIAL_DEVICES } from '../data/mockData'

export function useDevices() {
  const [devices, setDevices] = useState(INITIAL_DEVICES)

  const handleAddDevice = (newDevice) => {
    setDevices((current) => [
      ...current,
      {
        id: 'dev-' + Date.now(),
        deviceId: newDevice.deviceId,
        type: newDevice.type,
        location: newDevice.location,
        isActive: true,
        lastScan: 'N/A',
        scans: 0
      }
    ])
  }

  const handleDeleteDevice = (id) => {
    setDevices((current) => current.filter((dev) => dev.id !== id))
  }

  const handleToggleDeviceStatus = (id) => {
    setDevices((current) =>
      current.map((dev) =>
        dev.id === id ? { ...dev, isActive: !dev.isActive } : dev
      )
    )
  }

  return { devices, setDevices, handleAddDevice, handleDeleteDevice, handleToggleDeviceStatus }
}
