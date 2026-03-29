import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

function toDbStatus(fillStatus: 'Full' | 'Not Full') {
  return fillStatus === 'Full' ? 'FULL' : 'NOT_FULL'
}

const createSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم المخيم مطلوب'),
  areaAr: z.string().trim().optional().default(''),
  capacity: z.coerce.number().int().positive('يجب أن تكون السعة أكبر من 0'),
  fillStatus: z.enum(['Full', 'Not Full']).default('Not Full'),
  supervisorId: z.string().uuid().optional(),
})

const updateSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم المخيم مطلوب').optional(),
  areaAr: z.string().trim().optional(),
  capacity: z.coerce.number().int().positive('يجب أن تكون السعة أكبر من 0').optional(),
  fillStatus: z.enum(['Full', 'Not Full']).optional(),
  supervisorId: z.string().uuid().optional(),
})

async function getOrCreateDefaultSupervisorId() {
  const existing = await prisma.supervisor.findFirst({
    where: { isTrashed: false },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })

  if (existing?.id) return existing.id

  const created = await prisma.supervisor.create({
    data: {
      name: 'Default Supervisor',
      status: 'ACTIVE',
    },
    select: { id: true },
  })

  return created.id
}

export async function GET(req: NextRequest) {
  try {
    const forBeneficiary = req.nextUrl.searchParams.get('forBeneficiary')

    if (forBeneficiary === 'true') {
      const camps = await prisma.camps.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
        },
      })

      return NextResponse.json(camps)
    }

    const camps = await prisma.camps.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supervisor: true,
      },
    })

    return NextResponse.json(camps)
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

    const exists = await prisma.camps.findFirst({
      where: {
        name: body.nameAr,
      },
      select: { id: true },
    })

    if (exists) {
      return NextResponse.json(
        { message: 'المخيم موجود بالفعل (اسم مكرر).' },
        { status: 409 }
      )
    }

    const supervisorId =
      body.supervisorId ?? (await getOrCreateDefaultSupervisorId())

    const created = await prisma.camps.create({
      data: {
        name: body.nameAr,
        area: body.areaAr || null,
        capacity: body.capacity,
        status: toDbStatus(body.fillStatus),
        supervisorId,
      },
      include: {
        supervisor: true,
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
    return NextResponse.json({ message: 'معرّف المخيم مفقود' }, { status: 400 })
  }

  try {
    const body = updateSchema.parse(await req.json())

    if (body.nameAr) {
      const exists = await prisma.camps.findFirst({
        where: {
          name: body.nameAr,
          NOT: { id },
        },
        select: { id: true },
      })

      if (exists) {
        return NextResponse.json(
          { message: 'المخيم موجود بالفعل (اسم مكرر).' },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.camps.update({
      where: { id },
      data: {
        name: body.nameAr,
        area: body.areaAr,
        capacity: body.capacity,
        status: body.fillStatus ? toDbStatus(body.fillStatus) : undefined,
        supervisorId: body.supervisorId,
      },
      include: {
        supervisor: true,
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
      await prisma.camps.deleteMany()
      return NextResponse.json({ ok: true })
    }

    if (!id) {
      return NextResponse.json({ message: 'معرّف المخيم مفقود' }, { status: 400 })
    }

    await prisma.camps.delete({
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