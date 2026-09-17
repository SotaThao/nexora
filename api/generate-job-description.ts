// Vercel serverless function (Node.js runtime).
// Secure backend proxy: calls DeepSeek's Anthropic-compatible API server-side
// so the API key never reaches the browser. Generates a short Vietnamese
// job-posting description paragraph from structured form fields.
//
// Request:  POST /api/generate-job-description
// Response: 200 { description: string } | 4xx/5xx { error: string }

const DEEPSEEK_URL = 'https://api.deepseek.com/anthropic/v1/messages'
const AI_MODEL = 'deepseek-flash'

type JobDescriptionFields = {
  postKind: 'hiring' | 'seeking'
  salon?: string
  skills?: string[]
  salary?: string
  employmentType?: 'Full-time' | 'Part-time'
  availability?: string
  payModel?: string
  support?: string[]
  experience?: string
  location: string
}

function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isNonEmptyStringArray(value: any): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string')
}

function validateFields(body: any): body is JobDescriptionFields {
  if (!body || typeof body !== 'object') return false
  if (body.postKind !== 'hiring' && body.postKind !== 'seeking') return false
  if (!isNonEmptyString(body.location)) return false
  return true
}

// Prompt is calibrated against the existing seed job descriptions in
// src/components/community/communityDemoContent.ts (demoJobs[].description):
// casual, friendly salon-industry Vietnamese, ~2-3 sentences, mentions the
// salon/role context, key requirements, and working conditions.
function buildPrompt(fields: JobDescriptionFields): string {
  const {
    postKind,
    salon,
    skills,
    salary,
    employmentType,
    availability,
    payModel,
    support,
    experience,
    location,
  } = fields

  const lines: string[] = []
  lines.push(
    postKind === 'hiring'
      ? 'Bạn đang viết mô tả cho một tin ĐĂNG TUYỂN THỢ trong cộng đồng ngành nail/salon tại Mỹ.'
      : 'Bạn đang viết mô tả cho một tin TÌM VIỆC của một thợ nail/salon tại Mỹ.',
  )
  lines.push('Thông tin chi tiết:')
  if (postKind === 'hiring' && isNonEmptyString(salon)) {
    lines.push(`- Tên tiệm: ${salon}`)
  }
  if (isNonEmptyStringArray(skills)) {
    lines.push(`- Kỹ năng/chuyên môn: ${skills.join(', ')}`)
  }
  if (isNonEmptyString(salary)) {
    lines.push(`- Mức lương: ${salary}`)
  }
  if (isNonEmptyString(employmentType)) {
    lines.push(`- Hình thức làm việc: ${employmentType}`)
  }
  if (isNonEmptyString(availability)) {
    lines.push(`- Thời gian bắt đầu: ${availability}`)
  }
  if (isNonEmptyString(payModel)) {
    lines.push(`- Hình thức trả lương: ${payModel}`)
  }
  if (support && support.length > 0) {
    lines.push(`- Hỗ trợ thêm: ${support.join(', ')}`)
  }
  if (isNonEmptyString(experience)) {
    lines.push(`- Kinh nghiệm: ${experience}`)
  }
  lines.push(`- Khu vực: ${location}`)

  const example =
    postKind === 'hiring'
      ? '"Luxury Nails & Spa cần thợ bột và thợ tay chân nước có tay nghề ổn định, phục vụ khách quen là chính. ' +
        'Tiệm đông khách quanh năm, bao lương tuần đầu để thợ mới quen khách trước khi tính ăn chia."'
      : '"Mình là thợ nail có tay nghề bột và tay chân nước, đang tìm chỗ làm ổn định lâu dài khu Houston. ' +
        'Có thể đi làm ngay, ưu tiên tiệm đông khách quen, môi trường làm việc thoải mái."'

  lines.push('')
  lines.push(
    (postKind === 'hiring'
      ? 'Hãy viết một đoạn mô tả ngắn (khoảng 60-120 từ) bằng tiếng Việt, dưới góc nhìn của CHỦ TIỆM đang cần tuyển thợ, ' +
        `giọng văn tự nhiên, thân thiện, đúng phong cách của cộng đồng ngành nail/salon người Việt tại Mỹ (ví dụ: ${example}).`
      : 'Hãy viết một đoạn mô tả ngắn (khoảng 60-120 từ) bằng tiếng Việt, dưới góc nhìn CỦA CHÍNH NGƯỜI THỢ đang tìm việc ' +
        `(xưng "mình"/"em"/"anh/chị", KHÔNG viết như một tiệm đang tuyển người), giọng văn tự nhiên, thân thiện, đúng ` +
        `phong cách của cộng đồng ngành nail/salon người Việt tại Mỹ (ví dụ: ${example}).`) +
      ' Dựa vào các thông tin đã cho ở trên (có thể chỉ là một vài dòng), viết tự nhiên như một tin đăng thật, không ' +
      'cần liệt kê lại toàn bộ. Đoạn văn sẽ được dùng trực tiếp làm nội dung phần "Lời nhắn thêm" trong form đăng tin.',
  )
  lines.push(
    'CHỈ trả về đúng đoạn mô tả đó, không thêm lời dẫn, không thêm markdown, không bọc trong dấu ngoặc kép.',
  )

  return lines.join('\n')
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Phương thức không được hỗ trợ.' })
      return
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      res.status(500).json({ error: 'DEEPSEEK_API_KEY chưa được cấu hình trên server.' })
      return
    }

    const body = req.body
    if (!validateFields(body)) {
      res.status(400).json({ error: 'Thiếu thông tin bắt buộc để tạo mô tả.' })
      return
    }

    const prompt = buildPrompt(body)

    let anthropicResponse: Response
    try {
      anthropicResponse = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
    } catch (err) {
      console.error('[generate-job-description] fetch to DeepSeek threw:', err)
      res.status(502).json({ error: 'Không thể tạo mô tả lúc này, thử lại sau.' })
      return
    }

    if (!anthropicResponse.ok) {
      const errorBody = await anthropicResponse.text().catch(() => '<unreadable body>')
      console.error('[generate-job-description] DeepSeek responded', anthropicResponse.status, errorBody)
      res.status(502).json({ error: 'Không thể tạo mô tả lúc này, thử lại sau.' })
      return
    }

    const data = await anthropicResponse.json()
    const textBlock = Array.isArray(data?.content) ? data.content.find((block: any) => block?.type === 'text') : null
    const description = textBlock?.text?.trim()

    if (!isNonEmptyString(description)) {
      console.error('[generate-job-description] unexpected DeepSeek payload:', JSON.stringify(data))
      res.status(502).json({ error: 'Không thể tạo mô tả lúc này, thử lại sau.' })
      return
    }

    res.status(200).json({ description })
  } catch (err) {
    console.error('[generate-job-description] unhandled error:', err)
    res.status(500).json({ error: 'Có lỗi xảy ra, vui lòng thử lại.' })
  }
}
