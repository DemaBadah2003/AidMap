import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, PlaceType, Prisma } from '@prisma/client'

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
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const typeParam = searchParams.get('type')

    const where: Prisma.PlaceWhereInput = {}

    if (typeParam && isValidFrontPlaceType(typeParam)) {
      where.type = mapFrontTypeToPrismaType(typeParam)
    }

    const places = await prisma.place.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(
      {
        success: true,
        count: places.length,
        data: places,
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
    const body = await req.json()

    const {
      name,
      type,
      latitude,
      longitude,
      description,
    } = body as {
      name?: unknown
      type?: unknown
      latitude?: unknown
      longitude?: unknown
      description?: unknown
    }

    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'اسم المكان مطلوب',
        },
        { status: 400 }
      )
    }

    if (!isValidFrontPlaceType(type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'نوع المكان غير صالح',
        },
        { status: 400 }
      )
    }

    const lat = Number(latitude)
    const lng = Number(longitude)

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return NextResponse.json(
        {
          success: false,
          message: 'قيمة خط العرض غير صحيحة',
        },
        { status: 400 }
      )
    }

    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      return NextResponse.json(
        {
          success: false,
          message: 'قيمة خط الطول غير صحيحة',
        },
        { status: 400 }
      )
    }

    const newPlace = await prisma.place.create({
      data: {
        name: name.trim(),
        type: mapFrontTypeToPrismaType(type),
        latitude: lat,
        longitude: lng,
        description:
          typeof description === 'string' && description.trim()
            ? description.trim()
            : null,
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