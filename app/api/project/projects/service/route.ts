import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GeneralStatus } from '@prisma/client'
import prisma from '@/lib/prisma'

type FrontServiceStatus = 'نشط' | 'مغلق'

const createSchema = z.object({
  serviceType: z.string().trim().min(1, 'نوع الخدمة مطلوب'),
  status: z.enum(['نشط', 'مغلق']).default('نشط'),
})

const updateSchema = z
  .object({
    serviceType: z.string().trim().min(1, 'نوع الخدمة مطلوب').optional(),
    status: z.enum(['نشط', 'مغلق']).optional(),
  })
  .strict()

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function toDbStatus(status: FrontServiceStatus): GeneralStatus {
  if (status === 'نشط') {
    return 'ACTIVE' as GeneralStatus
  }

  return 'INACTIVE' as GeneralStatus
}

function fromDbStatus(status: GeneralStatus): FrontServiceStatus {
  const value = String(status)

  if (value === 'ACTIVE') return 'نشط'
  return 'مغلق'
}

function mapServiceToFrontend(service: {
  id: string
  serviceType: string
  status: GeneralStatus
}) {
  return {
    id: service.id,
    serviceType: service.serviceType,
    status: fromDbStatus(service.status),
  }
}

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')

    if (id) {
      const service = await prisma.service.findUnique({
        where: { id },
      })

      if (!service) {
        return NextResponse.json(
          { message: 'الخدمة غير موجودة' },
          { status: 404 }
        )
      }

      return NextResponse.json(mapServiceToFrontend(service))
    }

    const services = await prisma.service.findMany({
      orderBy: { id: 'desc' },
    })

    return NextResponse.json(services.map(mapServiceToFrontend))
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json())

    const exists = await prisma.service.findFirst({
      where: {
        serviceType: body.serviceType,
      },
      select: { id: true },
    })

    if (exists) {
      return NextResponse.json(
        { message: 'الخدمة موجودة بالفعل (نوع خدمة مكرر).' },
        { status: 409 }
      )
    }

    const created = await prisma.service.create({
      data: {
        serviceType: body.serviceType,
        status: toDbStatus(body.status),
      },
    })

    return NextResponse.json(mapServiceToFrontend(created), { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: e.issues[0]?.message ?? 'فشل التحقق من صحة البيانات',
          issues: e.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { message: 'معرّف الخدمة مفقود' },
      { status: 400 }
    )
  }

  try {
    const body = updateSchema.parse(await req.json())

    const current = await prisma.service.findUnique({
      where: { id },
    })

    if (!current) {
      return NextResponse.json(
        { message: 'الخدمة غير موجودة' },
        { status: 404 }
      )
    }

    const nextServiceType = body.serviceType?.trim() ?? current.serviceType
    const normalizedNextType = normalizeText(nextServiceType)

    const allServices = await prisma.service.findMany({
      select: {
        id: true,
        serviceType: true,
      },
    })

    const duplicate = allServices.find(
      (item) =>
        item.id !== id &&
        normalizeText(item.serviceType) === normalizedNextType
    )

    if (duplicate) {
      return NextResponse.json(
        { message: 'الخدمة موجودة بالفعل (نوع خدمة مكرر).' },
        { status: 409 }
      )
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        serviceType: body.serviceType?.trim(),
        status: body.status ? toDbStatus(body.status) : undefined,
      },
    })

    return NextResponse.json(mapServiceToFrontend(updated))
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: e.issues[0]?.message ?? 'فشل التحقق من صحة البيانات',
          issues: e.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const all = req.nextUrl.searchParams.get('all')

  try {
    if (all === 'true') {
      await prisma.service.deleteMany()
      return NextResponse.json({ ok: true })
    }

    if (!id) {
      return NextResponse.json(
        { message: 'معرّف الخدمة مفقود' },
        { status: 400 }
      )
    }

    const current = await prisma.service.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!current) {
      return NextResponse.json(
        { message: 'الخدمة غير موجودة' },
        { status: 404 }
      )
    }

    await prisma.service.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}