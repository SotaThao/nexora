import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DevicesView from '../../src/components/DevicesView'
import { LanguageProvider } from '../../src/contexts/LanguageContext'

const mockDevices = [
  { id: '1', deviceId: 'NFC-001', type: 'NFC Stand', location: 'Front Desk', isActive: true, lastScan: 'Today', scans: 142 },
  { id: '2', deviceId: 'QR-Table-01', type: 'QR Card', location: 'Table 01', isActive: true, lastScan: 'Today', scans: 95 },
  { id: '3', deviceId: 'NFC-002', type: 'NFC Stand', location: 'Table 02', isActive: true, lastScan: 'Yesterday', scans: 88 },
  { id: '4', deviceId: 'QR-Table-03', type: 'QR Card', location: 'Table 03', isActive: false, lastScan: 'N/A', scans: 0 },
  { id: '5', deviceId: 'NFC-Sticker-01', type: 'NFC Sticker', location: 'Mirror 01', isActive: true, lastScan: 'Today', scans: 210 }
]

describe('DevicesView Component Unit Tests', () => {
  it('renders DevicesView title and subtitle', () => {
    render(
      <LanguageProvider>
        <DevicesView devices={mockDevices} />
      </LanguageProvider>
    )

    expect(screen.getByText(/QR \/ NFC Devices/i)).toBeInTheDocument()
    expect(screen.getByText(/Manage physical salon stands, tabletop codes, and smart taps/i)).toBeInTheDocument()
  })

  it('calculates and displays hardware KPIs correctly', () => {
    render(
      <LanguageProvider>
        <DevicesView devices={mockDevices} />
      </LanguageProvider>
    )

    const qrKpi = screen.getByText(/^QR Devices$/i).parentElement
    expect(within(qrKpi).getByText('2')).toBeInTheDocument()

    const nfcKpi = screen.getByText(/^NFC Devices$/i).parentElement
    expect(within(nfcKpi).getByText('3')).toBeInTheDocument()

    const activeNfcKpi = screen.getByText(/^Active NFC$/i).parentElement
    expect(within(activeNfcKpi).getByText('3')).toBeInTheDocument()

    const issuesKpi = screen.getByText(/^Device Issues$/i).parentElement
    expect(within(issuesKpi).getByText('1')).toBeInTheDocument()
  })

  it('displays the list of devices with correct placement and status details', () => {
    render(
      <LanguageProvider>
        <DevicesView devices={mockDevices} />
      </LanguageProvider>
    )

    expect(screen.getByText('NFC-001')).toBeInTheDocument()
    expect(screen.getByText('Front Desk')).toBeInTheDocument()
    expect(screen.getByText('QR-Table-01')).toBeInTheDocument()
    expect(screen.getByText('Table 01')).toBeInTheDocument()
    expect(screen.getByText('QR-Table-03')).toBeInTheDocument()
    expect(screen.getByText('Table 03')).toBeInTheDocument()

    expect(screen.getByText('142')).toBeInTheDocument()
    expect(screen.getByText('95')).toBeInTheDocument()
    expect(screen.getByText('88')).toBeInTheDocument()
    expect(screen.getByText('210')).toBeInTheDocument()

    expect(screen.getAllByText(/Active/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Inactive/i).length).toBeGreaterThan(0)
  })

  it('opens and submits Add New Device modal and invokes onAddDevice callback', () => {
    const handleAdd = vi.fn()
    render(
      <LanguageProvider>
        <DevicesView devices={mockDevices} onAddDevice={handleAdd} />
      </LanguageProvider>
    )

    const addBtn = screen.getByRole('button', { name: /Add New Device/i })
    fireEvent.click(addBtn)

    expect(screen.getByText(/Register QR \/ NFC Hardware/i)).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /Confirm/i })
    fireEvent.click(submitBtn)
    expect(screen.getByText(/Device ID is required/i)).toBeInTheDocument()

    const idInput = screen.getByPlaceholderText(/e.g. NFC-003, QR-Table-04/i)
    fireEvent.change(idInput, { target: { value: 'NFC-003' } })

    fireEvent.click(submitBtn)
    expect(screen.getByText(/Location is required/i)).toBeInTheDocument()

    const locInput = screen.getByPlaceholderText(/e.g. Table 04, Mirror 05, Front Counter/i)
    fireEvent.change(locInput, { target: { value: 'Table 04' } })

    const typeSelect = screen.getByRole('combobox')
    fireEvent.change(typeSelect, { target: { value: 'NFC Sticker' } })

    fireEvent.click(submitBtn)

    expect(handleAdd).toHaveBeenCalledWith({
      deviceId: 'NFC-003',
      type: 'NFC Sticker',
      location: 'Table 04'
    })

    expect(screen.queryByText(/Register QR \/ NFC Hardware/i)).not.toBeInTheDocument()
  })

  it('triggers onToggleDeviceStatus when toggle button is clicked', () => {
    const handleToggle = vi.fn()
    render(
      <LanguageProvider>
        <DevicesView devices={mockDevices} onToggleDeviceStatus={handleToggle} />
      </LanguageProvider>
    )

    const nfc001Card = screen.getByText('NFC-001').closest('section')
    const toggleBtn = within(nfc001Card).getAllByRole('button').find(btn => !btn.textContent && btn.className.includes('relative'))
    
    expect(toggleBtn).toBeInTheDocument()
    fireEvent.click(toggleBtn)

    expect(handleToggle).toHaveBeenCalledWith('1')
  })

  it('opens delete confirmation, cancels, and deletes device invoking onDeleteDevice callback', () => {
    const handleDelete = vi.fn()
    render(
      <LanguageProvider>
        <DevicesView devices={mockDevices} onDeleteDevice={handleDelete} />
      </LanguageProvider>
    )

    const nfc001Card = screen.getByText('NFC-001').closest('section')
    const deleteBtn = within(nfc001Card).getByRole('button', { name: /Delete/i })
    fireEvent.click(deleteBtn)

    expect(screen.getByText(/Confirm Delete/i)).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to unregister this device/i)).toBeInTheDocument()

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelBtn)
    expect(screen.queryByText(/Confirm Delete/i)).not.toBeInTheDocument()
    expect(handleDelete).not.toHaveBeenCalled()

    fireEvent.click(deleteBtn)
    const modalDeleteBtn = screen.getAllByRole('button', { name: /Delete/i }).find(btn => btn.closest('.fixed'))
    expect(modalDeleteBtn).toBeInTheDocument()
    fireEvent.click(modalDeleteBtn)

    expect(handleDelete).toHaveBeenCalledWith('1')
    expect(screen.queryByText(/Confirm Delete/i)).not.toBeInTheDocument()
  })

  it('displays export success toast when Export button is clicked', async () => {
    render(
      <LanguageProvider>
        <DevicesView devices={mockDevices} />
      </LanguageProvider>
    )

    const exportBtn = screen.getByRole('button', { name: /Export/i })
    fireEvent.click(exportBtn)

    expect(screen.getByText(/Device directory successfully exported to spreadsheet/i)).toBeInTheDocument()
  })
})
