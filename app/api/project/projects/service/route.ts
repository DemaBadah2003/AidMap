import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GeneralStatus } from '@prisma/client'
import prisma from '@/lib/prisma'

type FrontServiceStatus = 'نشط' | 'مغلق'

const serviceSchema = z.object({
  serviceType: z.string().trim().min(1, 'نوع الخدمة مطلوب'),
  status: z.enum(['نشط', 'مغلق']).default('نشط'),
})

// محولات الحالة
function toDbStatus(status: FrontServiceStatus): GeneralStatus {
  return status === 'نشط' ? 'ACTIVE' : 'INACTIVE'
}

function fromDbStatus(status: GeneralStatus): FrontServiceStatus {
  return status === 'ACTIVE' ? 'نشط' : 'مغلق'
}

export async function GET(req: NextRequest) {
  try {
    const services = await prisma.service.findMany({ orderBy: { id: 'desc' } })
    return NextResponse.json(services.map(s => ({
      id: s.id,
      serviceType: s.serviceType,
      status: fromDbStatus(s.status)
    })))
  } catch (e) {
    return NextResponse.json({ message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = serviceSchema.parse(await req.json())

    // التحقق من التكرار مع تجاهل المسافات الزائدة
    const exists = await prisma.service.findFirst({
      where: { serviceType: body.serviceType.trim() }
    })

    if (exists) {
      return NextResponse.json(
        { message: `الخدمة "${body.serviceType}" موجودة بالفعل في النظام.` },
        { status: 409 }
      )
    }

    const created = await prisma.service.create({
      data: {
        serviceType: body.serviceType,
        status: toDbStatus(body.status),
      },
    })

    return NextResponse.json({
      id: created.id,
      serviceType: created.serviceType,
      status: fromDbStatus(created.status)
    }, { status: 201 })

  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ message: e.issues[0].message }, { status: 400 })
    return NextResponse.json({ message: e.message || 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ message: 'المعرف مفقود' }, { status: 400 })

  try {
    const body = serviceSchema.parse(await req.json())

    // التأكد أن الاسم الجديد لا يخص خدمة أخرى
    const duplicate = await prisma.service.findFirst({
      where: {
        serviceType: body.serviceType,
        NOT: { id: id }
      }
    })

    if (duplicate) {
      return NextResponse.json({ message: 'الاسم مكرر لخدمة أخرى' }, { status: 409 })
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        serviceType: body.serviceType,
        status: toDbStatus(body.status)
      }
    })

    return NextResponse.json({
      id: updated.id,
      serviceType: updated.serviceType,
      status: fromDbStatus(updated.status)
    })
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 })
  }
}