// app/project/services/service.ts

export type FillStatus = 'FULL' | 'NOT_FULL'

export type CampDto = {
  id: string
  name: string
  area?: string
  capacity: number
  status: FillStatus
}

const API = '/api/project/camps'

export const campsApi = {
  list: async (): Promise<CampDto[]> => {
    const res = await fetch(API)
    if (!res.ok) throw new Error('Failed to load camps')
    return res.json()
  },

  create: async (data: {
    nameAr: string
    areaAr: string
    capacity: number
    fillStatus: 'Full' | 'Not Full'
  }): Promise<CampDto> => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Create failed')
    return res.json()
  },

  update: async (
    id: string,
    data: {
      nameAr: string
      areaAr: string
      capacity: number
      fillStatus: 'Full' | 'Not Full'
    }
  ): Promise<CampDto> => {
    const res = await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Update failed')
    return res.json()
  },

  remove: async (id: string) => {
    await fetch(`${API}/${id}`, { method: 'DELETE' })
  },

  removeAll: async () => {
    await fetch(API, { method: 'DELETE' })
  },
}