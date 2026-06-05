import { useState, useMemo, useEffect } from 'react'

// Helper for subtracting days in UTC format
export const subtractDays = (dateStr, days) => {
  const d = new Date(dateStr + 'T00:00:00Z')
  if (isNaN(d.getTime())) return dateStr
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().split('T')[0]
}

const RANGE_OFFSETS = {
  '7 Days': 6,
  '30 Days': 29,
  '90 Days': 89,
  '180 Days': 179,
  '365 Days': 364,
}

/**
 * Shared hook that manages chart date-range state derived from a transactions array.
 *
 * @param {Array} transactions - Array of transaction objects with a `dateTime` field.
 * @returns {{ chartRange, chartStartDate, chartEndDate, setChartStartDate, setChartEndDate, handleChartRangeChange }}
 */
export function useChartDateRange(transactions) {
  // Derive the reference end date from the transactions array
  const refEndDate = useMemo(() => {
    if (!transactions || transactions.length === 0) return '2026-05-26'
    let maxDate = '1970-01-01'
    transactions.forEach(tx => {
      if (tx.dateTime) {
        const dateStr = tx.dateTime.split(' ')[0]
        if (dateStr > maxDate && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          maxDate = dateStr
        }
      }
    })
    return maxDate === '1970-01-01' ? '2026-05-26' : maxDate
  }, [transactions])

  const [chartRange, setChartRange] = useState('7 Days')
  const [chartStartDate, setChartStartDate] = useState(() => subtractDays(refEndDate, 6))
  const [chartEndDate, setChartEndDate] = useState(refEndDate)

  useEffect(() => {
    const offset = RANGE_OFFSETS[chartRange]
    if (offset !== undefined) {
      setChartStartDate(subtractDays(refEndDate, offset))
      setChartEndDate(refEndDate)
    }
  }, [refEndDate, chartRange])

  const handleChartRangeChange = (newRange) => {
    setChartRange(newRange)
    const offset = RANGE_OFFSETS[newRange]
    if (offset !== undefined) {
      setChartStartDate(subtractDays(refEndDate, offset))
      setChartEndDate(refEndDate)
    }
  }

  return {
    chartRange,
    chartStartDate,
    chartEndDate,
    setChartStartDate,
    setChartEndDate,
    handleChartRangeChange,
  }
}
