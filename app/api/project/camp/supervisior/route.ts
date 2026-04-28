import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

// --- التحقق من البيانات (Zod) لضمان عدم حدوث Overload Error ---
const phoneRegex = /^(056|059)\d{7}$/
const AREA_VALUES = ['east', 'west', 'north', 'middle', 'south'] as const

const createSchema = z.object({
  name: z.string().trim().min(3, 'اسم المشرف يجب أن يكون 3 أحرف على الأقل'),
  phone: z.string().trim().regex(phoneRegex, 'رقم الجوال يجب أن يبدأ بـ 056 أو 059 ويتكون من 10 أرقام'),
  area: z.enum(AREA_VALUES, {
    errorMap: () => ({ message: 'يرجى اختيار منطقة صحيحة' }),
  }),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

const updateSchema = z.object({
  name: z.string().trim().min(3).optional(),
  phone: z.string().trim().regex(phoneRegex).optional(),
  area: z.enum(AREA_VALUES).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

// --- العمليات (CRUD) ---

// 1. جلب المشرفين (مع الفلترة والبحث)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const status = searchParams.get('status')
    const q = searchParams.get('q')?.trim()

    const where: any = { isTrashed: false }

    if (status === 'active') where.status = 'ACTIVE'
    else if (status === 'blocked') where.status = 'INACTIVE'

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } }
      ]
    }

    const supervisors = await prisma.supervisor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(supervisors)
  } catch (e) {
    return NextResponse.json({ message: 'خطأ في جلب البيانات' }, { status: 500 })
  }
}

// 2. إضافة مشرف جديد
export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const body = createSchema.parse(json)

    const exists = await prisma.supervisor.findFirst({
      where: {
        OR: [{ name: body.name }, { phone: body.phone }],
        isTrashed: false,
      },
    })

    if (exists) {
      return NextResponse.json({ message: 'المشرف أو رقم الجوال مسجل مسبقاً' }, { status: 409 })
    }

    const created = await prisma.supervisor.create({
      data: {
        name: body.name,
        phone: body.phone,
        area: body.area,
        status: body.status,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ message: 'خطأ داخلي في الخادم' }, { status: 500 })
  }
}

// 3. تحديث بيانات مشرف
export async function PUT(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ message: 'المعرف مفقود' }, { status: 400 })

  try {
    const json = await req.json()
    const body = updateSchema.parse(json)

    const updated = await prisma.supervisor.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: e.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ message: 'فشل التحديث' }, { status: 500 })
  }
}

// 4. حذف مشرف (Soft Delete)
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  try {
    if (!id) return NextResponse.json({ message: 'المعرف مفقود' }, { status: 400 })

    await prisma.supervisor.update({
      where: { id },
      data: { isTrashed: true },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ message: 'خطأ في الحذف' }, { status: 500 })
  }
}