import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// دالة جلب البيانات
export async function GET() {
  try {
    const points = await prisma.internet.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(points)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// دالة إضافة نقطة جديدة
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const newPoint = await prisma.internet.create({
      data: {
        placeName: body.placeName,
        powerSource: body.powerSource,
        wifiQuality: body.wifiQuality,
        seatsCount: Number(body.seatsCount) || 0,
        isFree: body.isFree
      }
    })
    return NextResponse.json(newPoint, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// الكود الجديد: دالة التعديل التي كانت مفقودة وتسببت في خطأ 405
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') // جلب المعرف من الرابط

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const body = await req.json()

    const updatedPoint = await prisma.internet.update({
      where: { id: id },
      data: {
        placeName: body.placeName,
        powerSource: body.powerSource,
        wifiQuality: body.wifiQuality,
        seatsCount: Number(body.seatsCount) || 0,
        isFree: body.isFree
      }
    })

    return NextResponse.json(updatedPoint)
  } catch (error: any) {
    console.error("PATCH ERROR:", error.message)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}