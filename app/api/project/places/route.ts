import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, PlaceType, PlaceStatus, Prisma } from '@prisma/client'

// إعداد PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// --- أنواع البيانات والمساعدات ---
type FrontPlaceType = 'shelter' | 'hospital' | 'water' | 'food'

type CreatePlaceBody = {
  name?: unknown
  type?: unknown
  latitude?: unknown
  longitude?: unknown
  description?: unknown
  operator?: unknown
  capacity?: unknown
  occupancy?: unknown
  availableBeds?: unknown
  statusText?: unknown
}

const ARABIC_NAME_REGEX = /^[\u0600-\u06FF\s]+$/
const NAME_MAX_LENGTH = 100
const DESCRIPTION_MAX_LENGTH = 500
const STATUS_TEXT_MAX_LENGTH = 300
const OPERATOR_MAX_LENGTH = 100
const MAX_COUNT_VALUE = 1000000

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function isValidFrontPlaceType(value: unknown): value is FrontPlaceType {
  return ['shelter', 'hospital', 'water', 'food'].includes(value as string)
}

function mapFrontTypeToPrismaType(type: FrontPlaceType): PlaceType {
  const mapping: Record<FrontPlaceType, PlaceType> = {
    shelter: PlaceType.SHELTER,
    hospital: PlaceType.MEDICAL,
    water: PlaceType.WATER_POINT,
    food: PlaceType.FOOD_SUPPORT_CENTER,
  }
  return mapping[type]
}

function mapStatusTextToPrismaStatus(statusText: string | null): PlaceStatus {
  if (!statusText) return PlaceStatus.AVAILABLE
  const value = statusText.toLowerCase()
  if (value.includes('مغلق') || value.includes('closed') || value.includes('غير متاح')) return PlaceStatus.UNAVAILABLE
  if (value.includes('ممتلئ') || value.includes('full') || value.includes('مزدحم')) return PlaceStatus.FULL
  return PlaceStatus.AVAILABLE
}

function parseOptionalText(value: unknown, maxLength: number): string | null | 'INVALID' {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return 'INVALID'
  const normalized = normalizeSpaces(value)
  if (!normalized) return null
  if (normalized.length > maxLength) return 'INVALID'
  return normalized
}

function parseOptionalInteger(value: unknown): number | null | 'INVALID' {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (!Number.isInteger(num) || num < 0 || num > MAX_COUNT_VALUE) return 'INVALID'
  return num
}

// --- GET Method (متاحة للجميع) ---
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const typeParam = searchParams.get('type')

    const where: Prisma.PlaceWhereInput = {
      isActive: true,
      isTrashed: false,
    }

    if (typeParam && isValidFrontPlaceType(typeParam)) {
      where.type = mapFrontTypeToPrismaType(typeParam)
    }

    const places = await prisma.place.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const mappedPlaces = places.map((place) => ({
      id: place.id,
      name: place.name,
      type: place.type === PlaceType.SHELTER ? 'shelter' : 
            place.type === PlaceType.MEDICAL ? 'hospital' : 
            place.type === PlaceType.WATER_POINT ? 'water' : 'food',
      lat: Number(place.latitude) || 0,
      lng: Number(place.longitude) || 0,
      operator: place.operator ?? '',
      capacity: place.capacity ?? 0,
      occupancy: place.occupancy ?? 0,
      availableBeds: place.availableBeds ?? 0,
      statusText: place.statusText ?? '',
    }))

    return NextResponse.json({ success: true, count: mappedPlaces.length, data: mappedPlaces })
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ success: false, message: 'فشل في جلب البيانات' }, { status: 500 })
  }
}

// --- POST Method (تم إلغاء فحص الأدمن - متاحة للجميع) ---
export async function POST(req: NextRequest) {
  try {
    // تم حذف requireAdminApi لفتح الوصول للكل
    
    const body = (await req.json()) as CreatePlaceBody
    const { name, type, latitude, longitude, description, operator, capacity, occupancy, availableBeds, statusText } = body

    if (typeof name !== 'string' || !normalizeSpaces(name)) {
      return NextResponse.json({ success: false, message: 'اسم المكان مطلوب' }, { status: 400 })
    }

    const normalizedName = normalizeSpaces(name)
    if (!ARABIC_NAME_REGEX.test(normalizedName)) {
      return NextResponse.json({ success: false, message: 'الاسم يجب أن يكون بالعربية' }, { status: 400 })
    }

    if (!isValidFrontPlaceType(type)) {
      return NextResponse.json({ success: false, message: 'نوع المكان غير صالح' }, { status: 400 })
    }

    const lat = Number(latitude)
    const lng = Number(longitude)
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ success: false, message: 'إحداثيات غير صحيحة' }, { status: 400 })
    }

    const parsedDesc = parseOptionalText(description, DESCRIPTION_MAX_LENGTH)
    const parsedOp = parseOptionalText(operator, OPERATOR_MAX_LENGTH)
    const parsedStat = parseOptionalText(statusText, STATUS_TEXT_MAX_LENGTH)
    const cap = parseOptionalInteger(capacity)
    const occ = parseOptionalInteger(occupancy)
    const avail = parseOptionalInteger(availableBeds)

    const newPlace = await prisma.place.create({
      data: {
        name: normalizedName,
        type: mapFrontTypeToPrismaType(type),
        latitude: lat,
        longitude: lng,
        description: parsedDesc === 'INVALID' ? null : parsedDesc,
        operator: parsedOp === 'INVALID' ? null : parsedOp,
        capacity: type === 'shelter' ? (cap === 'INVALID' ? 0 : (cap ?? 0)) : 0,
        occupancy: type === 'shelter' ? (occ === 'INVALID' ? 0 : (occ ?? 0)) : 0,
        availableBeds: type === 'shelter' ? (avail === 'INVALID' ? 0 : (avail ?? 0)) : 0,
        statusText: parsedStat === 'INVALID' ? null : parsedStat,
        status: mapStatusTextToPrismaStatus(parsedStat === 'INVALID' ? null : parsedStat),
        isActive: true,
        isTrashed: false,
      },
    })

    return NextResponse.json({ success: true, message: 'تم الحفظ بنجاح', data: newPlace }, { status: 201 })
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json({ success: false, message: 'خطأ في السيرفر' }, { status: 500 })
  }
}