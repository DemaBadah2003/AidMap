import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

const createSchema = z.object({
  institutionId: z.string().uuid('معرف المؤسسة غير صالح'),
  serviceId: z.string().uuid('معرف الخدمة غير صالح'),
})

const updateSchema = z.object({
  institutionId: z.string().uuid('معرف المؤسسة غير صالح').optional(),
  serviceId: z.string().uuid('معرف الخدمة غير صالح').optional(),
})

export async function GET() {
  try {
    const items = await prisma.institutionService.findMany({
      orderBy: { id: 'desc' },
      include: {
        institution: true,
        service: true,
      },
    })

    return NextResponse.json(items)
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

    const exists = await prisma.institutionService.findFirst({
      where: {
        institutionId: body.institutionId,
        serviceId: body.serviceId,
      },
      select: { id: true },
    })

    if (exists) {
      return NextResponse.json(
        { message: 'الخدمة مرتبطة بالفعل بهذه المؤسسة.' },
        { status: 409 }
      )
    }

    const created = await prisma.institutionService.create({
      data: {
        institutionId: body.institutionId,
        serviceId: body.serviceId,
      },
      include: {
        institution: true,
        service: true,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'فشل التحقق من صحة البيانات', issues: e.issues },
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
    return NextResponse.json({ message: 'معرّف السجل مفقود' }, { status: 400 })
  }

  try {
    const body = updateSchema.parse(await req.json())

    const existing = await prisma.institutionService.findUnique({
      where: { id },
      select: {
        id: true,
        institutionId: true,
        serviceId: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ message: 'السجل غير موجود' }, { status: 404 })
    }

    if (body.institutionId || body.serviceId) {
      const exists = await prisma.institutionService.findFirst({
        where: {
          institutionId: body.institutionId ?? existing.institutionId,
          serviceId: body.serviceId ?? existing.serviceId,
          NOT: { id },
        },
        select: { id: true },
      })

      if (exists) {
        return NextResponse.json(
          { message: 'الخدمة مرتبطة بالفعل بهذه المؤسسة.' },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.institutionService.update({
      where: { id },
      data: {
        institutionId: body.institutionId,
        serviceId: body.serviceId,
      },
      include: {
        institution: true,
        service: true,
      },
    })

    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'فشل التحقق من صحة البيانات', issues: e.issues },
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
      await prisma.institutionService.deleteMany()
      return NextResponse.json({ ok: true })
    }

    if (!id) {
      return NextResponse.json({ message: 'معرّف السجل مفقود' }, { status: 400 })
    }

    await prisma.institutionService.delete({
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