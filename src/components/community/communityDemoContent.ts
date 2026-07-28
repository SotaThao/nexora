// DEMO CONTENT: This file contains static mock data for PO review.
// There is no backend yet for Events, Learning, and Jobs.
// These will be replaced with real API data later.
// DO NOT save to Supabase, create tables, or call APIs for this data.

export const demoEvents = [
  {
    id: 'e1',
    title: 'Workshop: Kỹ thuật đắp Gel-X chuẩn form',
    date: '2026-08-15',
    location: 'Houston, TX',
    attendees: 42,
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'e2',
    title: 'Hội thảo chủ Salon: Quản lý thợ và tăng doanh thu',
    date: '2026-08-22',
    location: 'Online (Zoom)',
    attendees: 156,
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'e3',
    title: 'Nail Art Masterclass: Xu hướng Thu Đông 2026',
    date: '2026-09-05',
    location: 'Atlanta, GA',
    attendees: 28,
    image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?auto=format&fit=crop&q=80&w=800',
  }
];

export const demoLearning = [
  {
    id: 'l1',
    title: 'Khoá học đắp bột cơ bản cho người mới bắt đầu',
    author: 'Master Kelly',
    duration: '12 video (4 giờ)',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'l2',
    title: 'Kỹ thuật vẽ 3D nổi và đính đá chuyên nghiệp',
    author: 'Jimmy Nguyen',
    duration: '8 video (2.5 giờ)',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1516975080661-460d3d5718ee?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'l3',
    title: 'Tiếng Anh giao tiếp cơ bản ngành Nail',
    author: 'Nexora Academy',
    duration: '20 video (5 giờ)',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&q=80&w=800',
  }
];

export const demoJobs = [
  {
    id: 'j1',
    title: 'Tuyển thợ bột / thợ tay chân nước bao lương',
    salon: 'Luxury Nails & Spa',
    location: 'Houston, TX',
    salary: '$1,200 - $1,500/tuần',
    type: 'Full-time',
    posted: '2 ngày trước',
  },
  {
    id: 'j2',
    title: 'Cần thợ xuyên bang, có chỗ ở cho thợ',
    salon: 'Cali Beauty Nails',
    location: 'Dallas, TX',
    salary: 'Ăn chia 6/4',
    type: 'Full-time',
    posted: '5 giờ trước',
  },
  {
    id: 'j3',
    title: 'Tuyển thợ phụ (Receptionist) biết tiếng Anh',
    salon: 'Bella Salon',
    location: 'Austin, TX',
    salary: '$15 - $18/giờ',
    type: 'Part-time',
    posted: '1 ngày trước',
  }
];
