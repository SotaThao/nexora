// Mock/seed data for the merchant Dashboard.
// Extracted from Dashboard.jsx (Group 1 refactor) — pure data, no JSX/React.

export const MOCK_NEXORA_STAFF_PROFILES = {
  'NEX-STAFF-ANNA0921': {
    fullName: 'Anna Nguyen',
    nickname: 'Anna N.',
    phone: '(713) 555-1234',
    email: 'anna@example.com',
    position: 'Nail Technician',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200',
    vlinkpayId: 'VLP-0921-ANNA',
    payoutConfigs: {
      zelle: { enabled: true, value: '(713) 555-1234', qrCode: '', accountName: 'Anna Nguyen' },
      cashapp: { enabled: true, value: '$annanais', qrCode: '', accountName: 'Anna Nguyen' },
      venmo: { enabled: true, value: '@annanais', qrCode: '', accountName: 'Anna Nguyen' },
      bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
      paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
      applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
    }
  },
  'NEX-STAFF-LISA1102': {
    fullName: 'Lisa Tran',
    nickname: 'Lisa T.',
    phone: '(408) 555-2345',
    email: 'lisa@example.com',
    position: 'Nail Tech',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
    vlinkpayId: 'VLP-1102-LISA',
    payoutConfigs: {
      venmo: { enabled: true, value: '@lisatran-nails', qrCode: '', accountName: 'Lisa Tran' },
      cashapp: { enabled: true, value: '$lisatran', qrCode: '', accountName: 'Lisa Tran' },
      zelle: { enabled: true, value: 'lisa@example.com', qrCode: '', accountName: 'Lisa Tran' },
      bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
      paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
      applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
    }
  },
  'NEX-STAFF-HN1148': {
    fullName: 'Hanna Nguyen',
    nickname: 'Hanna Ng.',
    phone: '(407) 555-4567',
    email: 'hanna@example.com',
    position: 'Nail Art Designer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200',
    vlinkpayId: 'VLP-1148-HN',
    payoutConfigs: {
      venmo: { enabled: true, value: '@hanna-art', qrCode: '', accountName: 'Hanna Nguyen' },
      zelle: { enabled: true, value: 'hanna@example.com', qrCode: '', accountName: 'Hanna Nguyen' },
      cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
      bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
      paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
      applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
    }
  }
}

export const INITIAL_STAFF = [
  {
    id: 'NEX-STAFF-MIA0123',
    fullName: 'Mia Tran',
    nickname: 'Mia T.',
    position: 'Gel-X Artist',
    isActive: true,
    showInTipsFlow: true,
    phone: '407-555-0123',
    email: 'mia.tran@gmail.com',
    paymentAccounts: { venmo: '@mia-nails', cashapp: '$miaglow', zelle: 'mia.tran@gmail.com', vlinkpay: 'VLP-0123-MIA' }
  },
  {
    id: 'NEX-STAFF-VL8893',
    fullName: 'Vivian Le',
    nickname: 'Vivian L.',
    position: 'Acrylic Specialist',
    isActive: true,
    showInTipsFlow: true,
    phone: '407-555-0199',
    email: 'vivian.le@gmail.com',
    paymentAccounts: { venmo: '', cashapp: '$vivianle', zelle: '407-555-0199', vlinkpay: 'VLP-8893-VL' }
  },
  {
    id: 'NEX-STAFF-ASH0155',
    fullName: 'Ashley Park',
    nickname: 'Ashley P.',
    position: 'Pedicure Lead',
    isActive: true,
    showInTipsFlow: true,
    phone: '407-555-0155',
    email: 'ashley@glownails.com',
    paymentAccounts: { venmo: '@ashley-pedi', cashapp: '', zelle: 'ashley@glownails.com', vlinkpay: 'VLP-0155-ASH' }
  },
  {
    id: 'NEX-STAFF-HN1148',
    fullName: 'Hanna Nguyen',
    nickname: 'Hanna Ng.',
    position: 'Nail Art Designer',
    isActive: false,
    showInTipsFlow: true,
    phone: '407-555-0144',
    email: 'hanna.art@gmail.com',
    paymentAccounts: { venmo: '@hanna-art', cashapp: '', zelle: '', vlinkpay: 'VLP-1148-HN' }
  }
]

export const INITIAL_TRANSACTIONS = [
  { id: 'TX-2042', dateTime: '2026-05-25 14:32', amount: 28, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Manicure Station 03', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2041', dateTime: '2026-05-25 13:10', amount: 35, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Front Desk', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2040', dateTime: '2026-05-25 11:05', amount: 22, staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', touchpoint: 'Pedicure Chair 02', paymentMethod: 'Cash App', status: 'Pending' },
  { id: 'TX-2039', dateTime: '2026-05-24 17:45', amount: 30, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Manicure Station 01', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2038', dateTime: '2026-05-24 15:20', amount: 18, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Receipt QR', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2037', dateTime: '2026-05-23 10:15', amount: 24, staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', touchpoint: 'VIP Pedicure Room', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2036', dateTime: '2026-05-24 13:20', amount: 25, staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', touchpoint: 'Nail Art Station 02', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2035', dateTime: '2026-05-24 14:05', amount: 24, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Acrylic Station 01', paymentMethod: 'Cash App', status: 'Failed' },
  { id: 'TX-2034', dateTime: '2026-05-24 11:15', amount: 45, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Manicure Station 03', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2033', dateTime: '2026-05-24 09:30', amount: 30, staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', touchpoint: 'Pedicure Chair 02', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2032', dateTime: '2026-05-23 17:10', amount: 15, staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', touchpoint: 'Nail Art Station 02', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2031', dateTime: '2026-05-23 15:50', amount: 40, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Front Desk', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2030', dateTime: '2026-05-23 16:40', amount: 32, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Receipt QR', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2029', dateTime: '2026-05-23 14:25', amount: 18, staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', touchpoint: 'VIP Pedicure Room', paymentMethod: 'Zelle', status: 'Failed' },
  { id: 'TX-2028', dateTime: '2026-05-23 11:05', amount: 30, staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', touchpoint: 'Front Desk', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2027', dateTime: '2026-05-23 10:30', amount: 28, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Acrylic Station 01', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2026', dateTime: '2026-05-22 13:10', amount: 25, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Manicure Station 03', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2025', dateTime: '2026-05-22 11:50', amount: 35, staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', touchpoint: 'Pedicure Chair 02', paymentMethod: 'Cash App', status: 'Pending' },
  { id: 'TX-2024', dateTime: '2026-05-22 16:30', amount: 22, staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', touchpoint: 'Nail Art Station 02', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2023', dateTime: '2026-05-22 15:15', amount: 32, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Front Desk', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2022', dateTime: '2026-05-22 09:45', amount: 38, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Receipt QR', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-2021', dateTime: '2026-05-21 17:10', amount: 28, staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', touchpoint: 'VIP Pedicure Room', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2020', dateTime: '2026-05-21 15:45', amount: 18, staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', touchpoint: 'Front Desk', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-2019', dateTime: '2026-05-21 16:00', amount: 15, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Acrylic Station 01', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2018', dateTime: '2026-05-21 14:20', amount: 50, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Manicure Station 03', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2017', dateTime: '2026-05-21 10:05', amount: 20, staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', touchpoint: 'Pedicure Chair 02', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2016', dateTime: '2026-05-20 12:20', amount: 35, staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', touchpoint: 'Nail Art Station 02', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2015', dateTime: '2026-05-20 14:10', amount: 42, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Front Desk', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2014', dateTime: '2026-05-20 11:30', amount: 22, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Receipt QR', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2012', dateTime: '2026-05-19 14:50', amount: 26, staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', touchpoint: 'Front Desk', paymentMethod: 'Zelle', status: 'Success' }
]

export const INITIAL_REVIEWS = [
  { id: 'R-1', rating: 5, comment: 'Mia shaped my Gel-X set perfectly and the chrome finish looks premium.', staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', category: 'Good (Google)', date: '2026-05-25' },
  { id: 'R-2', rating: 5, comment: 'Vivian was fast, clean, and helped me pick a wedding color.', staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', category: 'Good (Yelp)', date: '2026-05-25' },
  { id: 'R-3', rating: 2, comment: 'Great polish, but I waited 20 minutes after my appointment time.', staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', category: 'Internal Feedback', date: '2026-05-24' },
  { id: 'R-4', rating: 4, comment: 'Pedicure was relaxing and the salon was very clean.', staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', category: 'Good (Google)', date: '2026-05-23' },
  { id: 'R-5', rating: 1, comment: 'My color chipped after one day. I need someone to contact me.', staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', category: 'Internal Feedback', date: '2026-05-22' },
  { id: 'R-6', rating: 5, comment: 'Incredible attention to detail! Best Gel-X artist in the city.', staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', category: 'Good (Yelp)', date: '2026-05-24' },
  { id: 'R-7', rating: 5, comment: 'Vivian does the most natural looking acrylic sets!', staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', category: 'Good (Google)', date: '2026-05-24' },
  { id: 'R-8', rating: 5, comment: 'Ashley gives the absolute best foot massages during pedicures!', staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', category: 'Good (Google)', date: '2026-05-24' },
  { id: 'R-9', rating: 5, comment: 'Sofia is a master of nail art. She drew exactly what I showed her!', staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', category: 'Good (Google)', date: '2026-05-24' },
  { id: 'R-10', rating: 4, comment: 'Love the shape, Mia is very sweet. Will definitely come back.', staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', category: 'Good (Google)', date: '2026-05-22' },
  { id: 'R-11', rating: 4, comment: 'Fast service and very friendly staff. Nice atmosphere.', staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', category: 'Good (Google)', date: '2026-05-21' },
  { id: 'R-12', rating: 3, comment: 'The nail art was beautiful, but the top coat was uneven.', staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', category: 'Internal Feedback', date: '2026-05-21' },
  { id: 'R-13', rating: 5, comment: 'Stunning designs and very professional service.', staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', category: 'Good (Yelp)', date: '2026-05-20' }
]

export const INITIAL_TOUCHPOINTS = [
  { id: 'tp-main', name: 'Lobby Welcome QR', type: 'Business Main', isActive: true, scans: 245 },
  { id: 'tp-front', name: 'Front Desk', type: 'Front Desk', deviceId: 'NFC-001', isActive: true, scans: 842 },
  { id: 'tp-mani-1', name: 'Manicure Station 01', type: 'Table QR', isActive: true, scans: 1102 },
  { id: 'tp-mani-3', name: 'Manicure Station 03', type: 'Table QR', isActive: true, scans: 748 },
  { id: 'tp-pedi-2', name: 'Pedicure Chair 02', type: 'Table QR', isActive: true, scans: 636 },
  { id: 'tp-receipt', name: 'Receipt QR', type: 'Receipt QR', isActive: true, scans: 436 },
  { id: 'tp-vip', name: 'VIP Pedicure Room', type: 'Business Main', deviceId: 'NFC-VIP', isActive: true, scans: 312 },
  { id: 'tp-nail-2', name: 'Nail Art Station 02', type: 'Table QR', isActive: true, scans: 195 },
  { id: 'tp-acrylic-1', name: 'Acrylic Station 01', type: 'Table QR', isActive: true, scans: 280 }
]

export const INITIAL_DEVICES = [
  { id: '1', deviceId: 'NFC-001', type: 'NFC Stand', location: 'Front Desk', isActive: true, lastScan: 'Today', scans: 142 },
  { id: '2', deviceId: 'QR-Table-01', type: 'QR Card', location: 'Table 01', isActive: true, lastScan: 'Today', scans: 95 },
  { id: '3', deviceId: 'NFC-002', type: 'NFC Stand', location: 'Table 02', isActive: true, lastScan: 'Yesterday', scans: 88 },
  { id: '4', deviceId: 'QR-Table-03', type: 'QR Card', location: 'Table 03', isActive: false, lastScan: 'N/A', scans: 0 },
  { id: '5', deviceId: 'NFC-Sticker-01', type: 'NFC Sticker', location: 'Mirror 01', isActive: true, lastScan: 'Today', scans: 210 }
]

export const STAFF_PERFORMANCE = [
  { name: 'Mia Tran', nickname: 'Mia T.', tips: 612.3, rating: 4.86, reviews: 58, pct: 100, specialty: 'Gel-X' },
  { name: 'Vivian Le', nickname: 'Vivian L.', tips: 487.45, rating: 4.72, reviews: 47, pct: 80, specialty: 'Acrylic' },
  { name: 'Ashley Park', nickname: 'Ashley P.', tips: 402.1, rating: 4.69, reviews: 39, pct: 66, specialty: 'Pedicure' },
  { name: 'Hanna Nguyen', nickname: 'Hanna Ng.', tips: 318.25, rating: 4.61, reviews: 28, pct: 52, specialty: 'Nail Art' },
  { name: 'Hannah Kim', nickname: 'Hannah K.', tips: 276.58, rating: 4.57, reviews: 24, pct: 45, specialty: 'Dip Powder' }
]

export const TOP_TOUCHPOINTS = [
  { name: 'Manicure Station 01', type: 'QR', scans: 1102, conversion: 24.6 },
  { name: 'Front Desk Checkout', type: 'QR', scans: 842, conversion: 18.7 },
  { name: 'Pedicure Chair 02', type: 'QR', scans: 636, conversion: 16.8 },
  { name: 'Receipt Bottom QR', type: 'QR', scans: 436, conversion: 15.1 }
]
