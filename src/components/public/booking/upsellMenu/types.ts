/**
 * Shape Category/Service cho màn Upsell Menu.
 *
 * Repo này chưa có module POS (không có `views/pos/`, `usePosServices`,
 * `posServices` repository, cũng không có `PosServiceApiDto` trong
 * `src/types/repositories.ts`), nên type được khai tại chỗ thay vì import.
 * Giữ nguyên tên field của POS gốc — `displayOrder`, `categoryIds`, `tags` —
 * để khi module POS về đây thì đổi sang import là xong, không phải sửa logic.
 */

export type PosServiceStatus = 'Active' | 'Inactive'

export interface PosCategory {
  id: string
  name: string
  description?: string | null
  displayOrder: number
}

export interface PosService {
  id: string
  name: string
  price: number
  durationMinutes: number
  description?: string | null
  icon?: string | null
  photoUrl?: string | null
  status: PosServiceStatus
  displayOrder: number
  categoryIds: string[]
  tags: string[]
  memberPrice?: number
}
