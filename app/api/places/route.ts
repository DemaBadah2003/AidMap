import { NextRequest, NextResponse } from 'next/server'
import  prisma  from '@/lib/prisma'

const mapTypeToDb = (type: string) => {
  switch (type) {
    case 'shelter':
      return 'SHELTER'
    case 'hospital':
      return 'MEDICAL'
    case 'water':
      return 'WATER_POINT'
    case 'food':
      return 'FOOD_SUPPORT_CENTER'
    default:
      return null
  }
}

const mapDbToUi = (type: string) => {
  switch (type) {
    case 'SHELTER':
      return 'shelter'
    case 'MEDICAL':
      return 'hospital'
    case 'WATER_POINT':
      return 'water'
    case 'FOOD_SUPPORT_CENTER':
      return 'food'
    default:
      return 'food'
  }
}

export async function GET() {
  try {
    const places = await prisma.place.findMany({
      where: {
        isActive: true,
        isTrashed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const normalized = places.map((place) => ({
      id: place.id,
      name: place.name,
      type: mapDbToUi(place.type),
      lat: Number(place.latitude),
      lng: Number(place.longitude),
      statusText: place.description || '',
    }))

    return NextResponse.json(normalized, { status: 200 })
  } catch (error) {
    console.error('GET /api/places failed:', error)
    return NextResponse.json(
      { message: 'فشل في جلب الأماكن' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const dbType = mapTypeToDb(body.type)

    if (!dbType) {
      return NextResponse.json(
        { message: 'نوع المكان غير صحيح' },
        { status: 400 }
      )
    }

    if (!body.name || body.latitude === undefined || body.longitude === undefined) {
      return NextResponse.json(
        { message: 'الاسم والإحداثيات مطلوبة' },
        { status: 400 }
      )
    }

    const latitude = Number(body.latitude)
    const longitude = Number(body.longitude)

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { message: 'خط العرض غير صحيح' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { message: 'خط الطول غير صحيح' },
        { status: 400 }
      )
    }

    const created = await prisma.place.create({
      data: {
        name: body.name.trim(),
        type: dbType as any,
        description: body.statusText || body.description || null,
        latitude,
        longitude,
        status: 'AVAILABLE',
        isActive: true,
        isTrashed: false,
        isProtected: false,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST /api/places failed:', error)
    return NextResponse.json(
      { message: 'فشل في إضافة المكان' },
      { status: 500 }
    )
  }
}