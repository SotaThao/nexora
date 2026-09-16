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
  },
  {
    id: 'e2',
    title: 'Hội thảo chủ Salon: Quản lý thợ và tăng doanh thu',
    date: '2026-08-22',
    location: 'Online (Zoom)',
    attendees: 156,
  },
  {
    id: 'e3',
    title: 'Nail Art Masterclass: Xu hướng Thu Đông 2026',
    date: '2026-09-05',
    location: 'Atlanta, GA',
    attendees: 28,
  }
];

export const demoLearning = [
  {
    id: 'l1',
    title: 'Khoá học đắp bột cơ bản cho người mới bắt đầu',
    author: 'Master Kelly',
    duration: '12 video (4 giờ)',
    rating: 4.8,
  },
  {
    id: 'l2',
    title: 'Kỹ thuật vẽ 3D nổi và đính đá chuyên nghiệp',
    author: 'Jimmy Nguyen',
    duration: '8 video (2.5 giờ)',
    rating: 4.9,
  },
  {
    id: 'l3',
    title: 'Tiếng Anh giao tiếp cơ bản ngành Nail',
    author: 'Nexora Academy',
    duration: '20 video (5 giờ)',
    rating: 4.7,
  }
];

export type DemoJob = {
  id: string
  postKind: 'seeking' | 'hiring'
  title: string
  salon: string | null
  location: string
  salary: string
  employmentType: 'Full-time' | 'Part-time'
  status: 'open' | 'filled' | 'closed'
  urgent?: boolean
  posted: string
  posterName: string
  posterRole: string
  experience: string
  skills?: string[]
  availability?: string
  payModel?: string
  support?: string[]
  image: string
  description: string
  ownerPersonaId: string | null
}

export const DEFAULT_JOB_IMAGE = '/assets/images/marketing/nail/nail_spa_treatment.jpg'

// postKind: 'hiring' (chủ tiệm đăng tuyển) | 'seeking' (thợ đăng tìm việc) — tách riêng
// khỏi employmentType (Full-time/Part-time) để không đè nghĩa 1 field cho 2 khái niệm khác nhau.
// ownerPersonaId: null cho tin mẫu có sẵn; tin do demo "Đăng tin" tạo ra sẽ gắn id persona
// đang đăng nhập để demo được luồng "Bài của tôi" (sửa/xoá/đổi trạng thái).
export const demoJobs: DemoJob[] = [
  {
    id: 'j1',
    postKind: 'hiring',
    title: 'Tuyển thợ bột / thợ tay chân nước bao lương',
    salon: 'Luxury Nails & Spa',
    location: 'Houston, TX',
    salary: '$1,200 - $1,500/tuần',
    employmentType: 'Full-time',
    status: 'open',
    posted: '2 ngày trước',
    posterName: 'Kayla Le',
    posterRole: 'Chủ salon',
    experience: '2+ năm kinh nghiệm',
    image: DEFAULT_JOB_IMAGE,
    description: 'Luxury Nails & Spa cần thợ bột và thợ tay chân nước có tay nghề ổn định, phục vụ khách quen là chính. Tiệm đông khách quanh năm, bao lương tuần đầu để thợ mới quen khách trước khi tính ăn chia.',
    ownerPersonaId: null,
  },
  {
    id: 'j2',
    postKind: 'hiring',
    title: 'Cần thợ xuyên bang, có chỗ ở cho thợ',
    salon: 'Cali Beauty Nails',
    location: 'Dallas, TX',
    salary: 'Ăn chia 6/4',
    employmentType: 'Full-time',
    status: 'open',
    urgent: true,
    posted: '5 giờ trước',
    posterName: 'David Pham',
    posterRole: 'Chủ salon',
    experience: 'Không yêu cầu kinh nghiệm',
    image: '/assets/images/marketing/nail/nail_rose_quartz.jpg',
    description: 'Cali Beauty Nails ở Dallas cần thợ xuyên bang, có chỗ ở miễn phí cho thợ mới chuyển tới trong 2 tuần đầu. Tiệm khu Mỹ trắng, khách tip cao, cần thợ chăm chỉ và giao tiếp cơ bản.',
    ownerPersonaId: null,
  },
  {
    id: 'j3',
    postKind: 'hiring',
    title: 'Tuyển thợ phụ (Receptionist) biết tiếng Anh',
    salon: 'Bella Salon',
    location: 'Austin, TX',
    salary: '$15 - $18/giờ',
    employmentType: 'Part-time',
    status: 'open',
    posted: '1 ngày trước',
    posterName: 'Mai Tran',
    posterRole: 'Quản lý',
    experience: 'Ưu tiên có kinh nghiệm đón khách',
    image: '/assets/images/marketing/nail/nail_zen_minimalist.jpg',
    description: 'Bella Salon cần thợ phụ/receptionist biết tiếng Anh giao tiếp cơ bản để đón khách, đặt lịch, và hỗ trợ khu vực sơn. Lịch làm linh động, phù hợp học sinh/sinh viên làm part-time.',
    ownerPersonaId: null,
  },
  {
    id: 'j4',
    postKind: 'seeking',
    title: 'Thợ nail 5 năm kinh nghiệm tìm chỗ làm ổn định',
    salon: null,
    location: 'Houston, TX',
    salary: 'Mong muốn 60/40 hoặc lương cứng $900+/tuần',
    employmentType: 'Full-time',
    status: 'open',
    posted: '4 giờ trước',
    posterName: 'Hoa Nguyen',
    posterRole: 'Thợ nail',
    experience: '5 năm kinh nghiệm bột & dip',
    image: '/assets/images/marketing/nail/nail_art_luxury.jpg',
    description: 'Thợ nail 5 năm kinh nghiệm bột và dip, đang tìm tiệm ổn định lâu dài ở khu Houston. Có thể đi làm ngay, ưu tiên tiệm đông khách quen, môi trường làm việc thoải mái.',
    ownerPersonaId: null,
  },
];

export const JOB_POST_KINDS = [
  { value: 'seeking', label: 'Tìm việc' },
  { value: 'hiring', label: 'Tuyển thợ' },
];

export const JOB_LOCATIONS = ['Tất cả khu vực', 'Houston, TX', 'Dallas, TX', 'Austin, TX'];
