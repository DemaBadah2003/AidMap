import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const distributions = await prisma.distribution.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
        place: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            unit: true,
          },
        },
      },
    })

    return NextResponse.json(distributions, { status: 200 })
  } catch (error) {
    console.error('GET /api/distributions failed:', error)
    return NextResponse.json(
      { message: 'فشل في جلب التوزيعات' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.institutionId) {
      return NextResponse.json(
        { message: 'المؤسسة مطلوبة' },
        { status: 400 }
      )
    }

    if (!body.productId) {
      return NextResponse.json(
        { message: 'المنتج مطلوب' },
        { status: 400 }
      )
    }

    const quantity = Number(body.quantity)

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { message: 'الكمية يجب أن تكون أكبر من صفر' },
        { status: 400 }
      )
    }

    const data: any = {
      institutionId: body.institutionId,
      clinicId: body.clinicId || null,
      placeId: body.placeId || null,
      productId: body.productId,
      quantity,
      distributionDate: body.distributionDate
        ? new Date(body.distributionDate)
        : new Date(),
      status: (body.status || 'PENDING') as any,
      notes: body.notes ? String(body.notes).trim() : null,
    }

    // أضيفي beneficiaryId فقط إذا كان موجودًا في Prisma Client الحالي
    if (body.beneficiaryId !== undefined) {
      data.beneficiaryId = body.beneficiaryId || null
    }

    const distribution = await prisma.distribution.create({
      data,
      include: {
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
        place: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(distribution, { status: 201 })
  } catch (error) {
    console.error('POST /api/distributions failed:', error)
    return NextResponse.json(
      { message: 'فشل في إضافة التوزيع' },
      { status: 500 }
    )
  }
}