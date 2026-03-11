import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const beneficiaries = await prisma.beneficiary.findMany({
      where: {
        isTrashed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        camp: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(beneficiaries, { status: 200 })
  } catch (error) {
    console.error('GET /api/beneficiaries failed:', error)
    return NextResponse.json(
      { message: 'فشل في جلب المستفيدين' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json(
        { message: 'اسم المستفيد مطلوب' },
        { status: 400 }
      )
    }

    const name = String(body.name).trim()
    const phone = body.phone ? String(body.phone).trim() : null
    const numberOfFamily = body.numberOfFamily ? Number(body.numberOfFamily) : 0
    const priority = (body.priority || 'NORMAL') as any
    const campId = body.campId || null

    const data: any = {
      name,
      phone,
      numberOfFamily,
      priority,
      campId,
      isTrashed: false,
      isProtected: false,
    }

    // أضيفي email/password فقط إذا كانا موجودين فعلاً في Prisma Client الحالي
    if (body.email !== undefined) {
      data.email = body.email ? String(body.email).trim() : null
    }

    if (body.password !== undefined) {
      data.password = body.password ? String(body.password).trim() : null
    }

    const beneficiary = await prisma.beneficiary.create({
      data,
    })

    return NextResponse.json(beneficiary, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/beneficiaries failed:', error)

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { message: 'البريد الإلكتروني مستخدم من قبل' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { message: 'فشل في إضافة المستفيد' },
      { status: 500 }
    )
  }
}