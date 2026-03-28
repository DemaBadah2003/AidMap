import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, PlaceType, PlaceStatus, Prisma } from '@prisma/client'
import { requireAdminApi } from '@/app/api/project/helpers/api-guards'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

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
const OPERATOR_REGEX = /^[A-Za-z\u0600-\u06FF\s]+$/

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 100
const DESCRIPTION_MAX_LENGTH = 500
const STATUS_TEXT_MAX_LENGTH = 300
const OPERATOR_MAX_LENGTH = 100
const MAX_COUNT_VALUE = 1000000

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function isValidFrontPlaceType(value: unknown): value is FrontPlaceType {
  return (
    value === 'shelter' ||
    value === 'hospital' ||
    value === 'water' ||
    value === 'food'
  )
}

function mapFrontTypeToPrismaType(type: FrontPlaceType): PlaceType {
  switch (type) {
    case 'shelter':
      return PlaceType.SHELTER
    case 'hospital':
      return PlaceType.MEDICAL
    case 'water':
      return PlaceType.WATER_POINT
    case 'food':
      return PlaceType.FOOD_SUPPORT_CENTER
    default:
      return PlaceType.SHELTER
  }
}

function mapStatusTextToPrismaStatus(statusText: string | null): PlaceStatus {
  if (!statusText) {
    return PlaceStatus.AVAILABLE
  }

  const value = statusText.toLowerCase()

  if (
    value.includes('مغلق') ||
    value.includes('closed') ||
    value.includes('غير متاح')
  ) {
    return PlaceStatus.UNAVAILABLE
  }

  if (
    value.includes('ممتلئ') ||
    value.includes('full') ||
    value.includes('مزدحم')
  ) {
    return PlaceStatus.FULL
  }

  return PlaceStatus.AVAILABLE
}

function parseOptionalText(
  value: unknown,
  maxLength: number
): string | null | 'INVALID' {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value !== 'string') {
    return 'INVALID'
  }

  const normalized = normalizeSpaces(value)

  if (!normalized) {
    return null
  }

  if (normalized.length > maxLength) {
    return 'INVALID'
  }

  return normalized
}

function parseOptionalInteger(value: unknown): number | null | 'INVALID' {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return 'INVALID'
  }

  if (value < 0 || value > MAX_COUNT_VALUE) {
    return 'INVALID'
  }

  return value
}
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    const mappedPlaces = places.map((place) => ({
      id: place.id,
      name: place.name,
      type:
        place.type === PlaceType.SHELTER
          ? 'shelter'
          : place.type === PlaceType.MEDICAL
            ? 'hospital'
            : place.type === PlaceType.WATER_POINT
              ? 'water'
              : 'food',
      lat: place.latitude != null ? Number(place.latitude) : 0,
      lng: place.longitude != null ? Number(place.longitude) : 0,
      operator: place.operator ?? '',
      capacity: place.capacity ?? 0,
      occupancy: place.occupancy ?? 0,
      availableBeds: place.availableBeds ?? 0,
      statusText: place.statusText ?? '',
    }))

    return NextResponse.json(
      {
        success: true,
        count: mappedPlaces.length,
        data: mappedPlaces,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET /api/project/places error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'فشل في جلب الأماكن',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
export async function POST(req: NextRequest) {
  try {
    const unauthorized = await requireAdminApi(req)
    if (unauthorized) {
      return unauthorized
    }

    const body = (await req.json()) as CreatePlaceBody

    const {
      name,
      type,
      latitude,
      longitude,
      description,
      operator,
      capacity,
      occupancy,
      availableBeds,
      statusText,
    } = body

    if (typeof name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'اسم المكان مطلوب' },
        { status: 400 }
      )
    }

    const normalizedName = normalizeSpaces(name)

    if (!normalizedName) {
      return NextResponse.json(
        { success: false, message: 'اسم المكان مطلوب' },
        { status: 400 }
      )
    }

    if (normalizedName.length < NAME_MIN_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `اسم المكان يجب أن يكون على الأقل ${NAME_MIN_LENGTH} أحرف`,
        },
        { status: 400 }
      )
    }

    if (normalizedName.length > NAME_MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `اسم المكان يجب ألا يزيد عن ${NAME_MAX_LENGTH} حرفًا`,
        },
        { status: 400 }
      )
    }

    if (!ARABIC_NAME_REGEX.test(normalizedName)) {
      return NextResponse.json(
        { success: false, message: 'اسم المكان يجب أن يكون باللغة العربية فقط' },
        { status: 400 }
      )
    }

    if (!isValidFrontPlaceType(type)) {
      return NextResponse.json(
        { success: false, message: 'نوع المكان غير صالح' },
        { status: 400 }
      )
    }

    const lat = Number(latitude)
    const lng = Number(longitude)

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return NextResponse.json(
        { success: false, message: 'قيمة خط العرض يجب أن تكون بين -90 و 90' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      return NextResponse.json(
        { success: false, message: 'قيمة خط الطول يجب أن تكون بين -180 و 180' },
        { status: 400 }
      )
    }

    const parsedDescription = parseOptionalText(description, DESCRIPTION_MAX_LENGTH)
    if (parsedDescription === 'INVALID') {
      return NextResponse.json(
        {
          success: false,
          message: `وصف المكان يجب ألا يزيد عن ${DESCRIPTION_MAX_LENGTH} حرف`,
        },
        { status: 400 }
      )
    }

    const parsedOperator = parseOptionalText(operator, OPERATOR_MAX_LENGTH)
    if (parsedOperator === 'INVALID') {
      return NextResponse.json(
        {
          success: false,
          message: `الجهة المشغلة يجب ألا تزيد عن ${OPERATOR_MAX_LENGTH} حرف`,
        },
        { status: 400 }
      )
    }

    if (parsedOperator && !OPERATOR_REGEX.test(parsedOperator)) {
      return NextResponse.json(
        { success: false, message: 'الجهة المشغلة يجب أن تحتوي على حروف فقط' },
        { status: 400 }
      )
    }

    const parsedStatusText = parseOptionalText(statusText, STATUS_TEXT_MAX_LENGTH)
    if (parsedStatusText === 'INVALID') {
      return NextResponse.json(
        {
          success: false,
          message: `حالة المكان يجب ألا تزيد عن ${STATUS_TEXT_MAX_LENGTH} حرف`,
        },
        { status: 400 }
      )
    }

    const parsedCapacity = parseOptionalInteger(capacity)
    if (parsedCapacity === 'INVALID') {
      return NextResponse.json(
        { success: false, message: `السعة يجب أن تكون رقمًا صحيحًا` },
        { status: 400 }
      )
    }

    const parsedOccupancy = parseOptionalInteger(occupancy)
    if (parsedOccupancy === 'INVALID') {
      return NextResponse.json(
        { success: false, message: `الإشغال يجب أن يكون رقمًا صحيحًا` },
        { status: 400 }
      )
    }

    const parsedAvailableBeds = parseOptionalInteger(availableBeds)
    if (parsedAvailableBeds === 'INVALID') {
      return NextResponse.json(
        { success: false, message: `المتاح يجب أن يكون رقمًا صحيحًا` },
        { status: 400 }
      )
    }

    if (type === 'shelter') {
      if (
        parsedCapacity !== null &&
        parsedOccupancy !== null &&
        parsedOccupancy > parsedCapacity
      ) {
        return NextResponse.json(
          { success: false, message: 'الإشغال لا يمكن أن يكون أكبر من السعة' },
          { status: 400 }
        )
      }

      if (
        parsedCapacity !== null &&
        parsedAvailableBeds !== null &&
        parsedAvailableBeds > parsedCapacity
      ) {
        return NextResponse.json(
          { success: false, message: 'المتاح لا يمكن أن يكون أكبر من السعة' },
          { status: 400 }
        )
      }

      if (
        parsedCapacity !== null &&
        parsedOccupancy !== null &&
        parsedAvailableBeds !== null &&
        parsedOccupancy + parsedAvailableBeds > parsedCapacity
      ) {
        return NextResponse.json(
          {
            success: false,
            message: 'مجموع الإشغال والمتاح لا يمكن أن يكون أكبر من السعة',
          },
          { status: 400 }
        )
      }
    }
const newPlace = await prisma.place.create({
  data: {
    name: normalizedName,
    type: mapFrontTypeToPrismaType(type),
    latitude: lat,
    longitude: lng,
    description: parsedDescription,
    operator: parsedOperator,
    capacity: type === 'shelter' ? (parsedCapacity ?? 0) : 0,
    occupancy: type === 'shelter' ? (parsedOccupancy ?? 0) : 0,
    availableBeds: type === 'shelter' ? (parsedAvailableBeds ?? 0) : 0,
    statusText: parsedStatusText,
    status: mapStatusTextToPrismaStatus(parsedStatusText),
    isActive: true,
    isProtected: false,
    isTrashed: false,
  },
})

    return NextResponse.json(
      {
        success: true,
        message: 'تمت إضافة المكان بنجاح',
        data: newPlace,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/project/places error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'فشل في إضافة المكان',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}