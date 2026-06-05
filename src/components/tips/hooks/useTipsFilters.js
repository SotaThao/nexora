import { useState, useMemo } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';

export function useTipsFilters({ transactions, staff }) {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangePreset, setDateRangePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [selectedTouchpoint, setSelectedTouchpoint] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const resetFilters = () => {
    setDateRangePreset('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSelectedStaff('all');
    setSelectedTouchpoint('all');
    setSelectedPayment('all');
    setSelectedStatus('all');
    setSearchQuery('');
  };

  const staffOptions = useMemo(() => {
    return [
      { value: 'all', label: t('dashboard.activity_log.all_staff') || 'All Staff' },
      ...(staff || []).map(member => ({ value: member.nickname, label: member.nickname }))
    ];
  }, [staff, t]);

  const touchpointOptions = useMemo(() => {
    const uniqueFromTx = Array.from(new Set(transactions.map(tx => tx.touchpoint)));
    return [
      { value: 'all', label: t('dashboard.activity_log.all_touchpoints') || 'All Touch Points' },
      ...uniqueFromTx.filter(Boolean).map(name => ({ value: name, label: name }))
    ];
  }, [transactions, t]);

  const paymentOptions = [
    { value: 'all', label: t('dashboard.activity_log.all_payments') || 'All Payment Methods' },
    { value: 'Venmo', label: 'Venmo' },
    { value: 'Cash App', label: 'Cash App' },
    { value: 'Zelle', label: 'Zelle' },
    { value: 'VLINKPAY', label: 'VLINKPAY' }
  ];

  const statusOptions = [
    { value: 'all', label: t('dashboard.activity_log.all_statuses') || 'All Statuses' },
    { value: 'Success', label: 'Success' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Failed', label: 'Failed' }
  ];

  const datePresetOptions = [
    { value: 'all', label: t('dashboard.activity_log.preset_all') || 'All Time' },
    { value: 'today', label: t('dashboard.activity_log.preset_today') || 'Today' },
    { value: 'yesterday', label: t('dashboard.activity_log.preset_yesterday') || 'Yesterday' },
    { value: '7days', label: t('dashboard.activity_log.preset_7days') || 'Last 7 Days' },
    { value: '30days', label: t('dashboard.activity_log.preset_30days') || 'Last 30 Days' },
    { value: 'custom', label: t('dashboard.activity_log.preset_custom') || 'Custom Range' }
  ];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (dateRangePreset !== 'all') {
        const txDateStr = tx.dateTime.split(' ')[0];
        if (dateRangePreset === 'today') {
          const todayStr = new Date().toISOString().split('T')[0];
          if (txDateStr !== todayStr) return false;
        } else if (dateRangePreset === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          if (txDateStr !== yesterdayStr) return false;
        } else if (dateRangePreset === '7days') {
          const limit = new Date();
          limit.setDate(limit.getDate() - 7);
          const limitStr = limit.toISOString().split('T')[0];
          if (txDateStr < limitStr) return false;
        } else if (dateRangePreset === '30days') {
          const limit = new Date();
          limit.setDate(limit.getDate() - 30);
          const limitStr = limit.toISOString().split('T')[0];
          if (txDateStr < limitStr) return false;
        } else if (dateRangePreset === 'custom') {
          if (startDate && txDateStr < startDate) return false;
          if (endDate && txDateStr > endDate) return false;
        }
      }
      if (minAmount && tx.amount < parseFloat(minAmount)) return false;
      if (maxAmount && tx.amount > parseFloat(maxAmount)) return false;
      if (selectedStaff !== 'all' && tx.staffName !== selectedStaff) return false;
      if (selectedTouchpoint !== 'all' && tx.touchpoint !== selectedTouchpoint) return false;
      if (selectedPayment !== 'all' && tx.paymentMethod.toLowerCase() !== selectedPayment.toLowerCase()) return false;
      if (selectedStatus !== 'all' && tx.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = tx.id.toLowerCase().includes(q);
        const matchStaff = (tx.staffName || '').toLowerCase().includes(q);
        const matchTouchpoint = (tx.touchpoint || '').toLowerCase().includes(q);
        const matchPayment = (tx.paymentMethod || '').toLowerCase().includes(q);
        if (!matchId && !matchStaff && !matchTouchpoint && !matchPayment) return false;
      }
      return true;
    });
  }, [transactions, dateRangePreset, startDate, endDate, minAmount, maxAmount, selectedStaff, selectedTouchpoint, selectedPayment, selectedStatus, searchQuery]);

  return {
    searchQuery, setSearchQuery,
    dateRangePreset, setDateRangePreset,
    startDate, setStartDate,
    endDate, setEndDate,
    minAmount, setMinAmount,
    maxAmount, setMaxAmount,
    selectedStaff, setSelectedStaff,
    selectedTouchpoint, setSelectedTouchpoint,
    selectedPayment, setSelectedPayment,
    selectedStatus, setSelectedStatus,
    resetFilters,
    staffOptions,
    touchpointOptions,
    paymentOptions,
    statusOptions,
    datePresetOptions,
    filteredTransactions,
  };
}
