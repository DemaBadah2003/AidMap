import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { requireAdminApi } from '@/app/api/project/helpers/api-guards'


export type AdminPlaceType = 'shelter' | 'hospital' | 'water' | 'food'

export type AdminPlace = {
  id: string
  name: string
  type: AdminPlaceType
  lng: number
  lat: number
  operator?: string
  capacity?: number | null
  occupancy?: number | null
  availableBeds?: number | null
  statusText?: string
  createdAt?: string
  updatedAt?: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'places.json')

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })

  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, '[]', 'utf-8')
  }
}

async function readPlaces(): Promise<AdminPlace[]> {
  await ensureDataFile()
  const raw = await fs.readFile(DATA_FILE, 'utf-8')

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writePlaces(places: AdminPlace[]) {
  await ensureDataFile()
  await fs.writeFile(DATA_FILE, JSON.stringify(places, null, 2), 'utf-8')
}

function isValidType(type: unknown): type is AdminPlaceType {
  return type === 'shelter' || type === 'hospital' || type === 'water' || type === 'food'
}

function isValidNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeNullableNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null

  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function validatePlacePayload(body: any) {
  const errors: string[] = []

  if (!body || typeof body !== 'object') {
    errors.push('Body غير صالح')
    return errors
  }

  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('الاسم مطلوب')
  }

  if (!isValidType(body.type)) {
    errors.push('النوع يجب أن يكون shelter أو hospital أو water أو food')
  }

  const lng = Number(body.lng)
  const lat = Number(body.lat)

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    errors.push('lng غير صالح')
  }

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    errors.push('lat غير صالح')
  }

  return errors
}

export async function GET(req: NextRequest) {
  const unauthorized = requireAdminApi(req)
  if (unauthorized) return unauthorized

  try {
    const places = await readPlaces()

    return NextResponse.json({
      success: true,
      count: places.length,
      data: places,
    })
  } catch (error) {
    console.error('GET /api/admin/places error:', error)
    return NextResponse.json(
      { success: false, message: 'فشل في جلب الأماكن' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = requireAdminApi(req)
  if (unauthorized) return unauthorized

  try {
    const body = await req.json()
    const errors = validatePlacePayload(body)

    if (errors.length) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors },
        { status: 400 }
      )
    }

    const places = await readPlaces()
    const now = new Date().toISOString()

    const newPlace: AdminPlace = {
      id: crypto.randomUUID(),
      name: String(body.name).trim(),
      type: body.type,
      lng: Number(body.lng),
      lat: Number(body.lat),
      operator: body.operator ? String(body.operator).trim() : '',
      capacity: normalizeNullableNumber(body.capacity) ?? null,
      occupancy: normalizeNullableNumber(body.occupancy) ?? null,
      availableBeds: normalizeNullableNumber(body.availableBeds) ?? null,
      statusText: body.statusText ? String(body.statusText).trim() : '',
      createdAt: now,
      updatedAt: now,
    }

    places.unshift(newPlace)
    await writePlaces(places)

    return NextResponse.json(
      {
        success: true,
        message: 'تمت إضافة المكان بنجاح',
        data: newPlace,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/admin/places error:', error)
    return NextResponse.json(
      { success: false, message: 'فشل في إضافة المكان' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = requireAdminApi(req)
  if (unauthorized) return unauthorized

  try {
    const body = await req.json()

    if (!body?.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'id مطلوب للتعديل' },
        { status: 400 }
      )
    }

    const errors = validatePlacePayload(body)
    if (errors.length) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors },
        { status: 400 }
      )
    }

    const places = await readPlaces()
    const index = places.findIndex((p) => p.id === body.id)

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: 'المكان غير موجود' },
        { status: 404 }
      )
    }

    const existing = places[index]

    const updatedPlace: AdminPlace = {
      ...existing,
      name: String(body.name).trim(),
      type: body.type,
      lng: Number(body.lng),
      lat: Number(body.lat),
      operator: body.operator ? String(body.operator).trim() : '',
      capacity: normalizeNullableNumber(body.capacity) ?? null,
      occupancy: normalizeNullableNumber(body.occupancy) ?? null,
      availableBeds: normalizeNullableNumber(body.availableBeds) ?? null,
      statusText: body.statusText ? String(body.statusText).trim() : '',
      updatedAt: new Date().toISOString(),
    }

    places[index] = updatedPlace
    await writePlaces(places)

    return NextResponse.json({
      success: true,
      message: 'تم تعديل المكان بنجاح',
      data: updatedPlace,
    })
  } catch (error) {
    console.error('PUT /api/admin/places error:', error)
    return NextResponse.json(
      { success: false, message: 'فشل في تعديل المكان' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = requireAdminApi(req)
  if (unauthorized) return unauthorized

  try {
    const body = await req.json()

    if (!body?.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'id مطلوب للحذف' },
        { status: 400 }
      )
    }

    const places = await readPlaces()
    const exists = places.some((p) => p.id === body.id)

    if (!exists) {
      return NextResponse.json(
        { success: false, message: 'المكان غير موجود' },
        { status: 404 }
      )
    }

    const filtered = places.filter((p) => p.id !== body.id)
    await writePlaces(filtered)

    return NextResponse.json({
      success: true,
      message: 'تم حذف المكان بنجاح',
    })
  } catch (error) {
    console.error('DELETE /api/admin/places error:', error)
    return NextResponse.json(
      { success: false, message: 'فشل في حذف المكان' },
      { status: 500 }
    )
  }
}