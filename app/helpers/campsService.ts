// app/helpers/campsService.ts
import { CAMPS_ENDPOINT } from './const'
import { http } from './fileHelper'

export type FillStatus = 'Full' | 'Not Full'

export type CampsDTO = {
  id: string
  name: string
  area: string | null
  capacity: number
  status: 'FULL' | 'NOT_FULL'
  supervisorId: string
  createdAt: string
  updatedAt: string
}

export const campsApi = {
  list: () => http<CampsDTO[]>(CAMPS_ENDPOINT),

  create: (payload: {
    nameAr: string
    areaAr: string
    capacity: number
    fillStatus?: FillStatus
    supervisorId?: string
  }) =>
    http<CampsDTO>(CAMPS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (
    campId: string,
    payload: Partial<{
      nameAr: string
      areaAr: string
      capacity: number
      fillStatus: FillStatus
      supervisorId: string
    }>
  ) =>
    http<CampsDTO>(`${CAMPS_ENDPOINT}/${campId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  remove: (campId: string) =>
    http<{ ok: true }>(`${CAMPS_ENDPOINT}/${campId}`, {
      method: 'DELETE',
    }),

  removeAll: () =>
    http<{ ok: true }>(CAMPS_ENDPOINT, {
      method: 'DELETE',
    }),
}