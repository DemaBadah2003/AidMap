import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

type DbEmergencyStatus = 'NEW' | 'IN_PROGRESS' | 'CLOSED'
type DbEmergencyLevel = 'LOW' | 'MEDIUM' | 'HIGH'

type UiEmergencyStatus = 'جديدة' | 'قيد المعالجة' | 'مغلقة'
type UiEmergencyLevel = 'منخفض' | 'متوسط' | 'مرتفع'

function toDbStatus(status: UiEmergencyStatus): DbEmergencyStatus {
  if (status === 'جديدة') return 'NEW'
  if (status === 'قيد المعالجة') return 'IN_PROGRESS'
  return 'CLOSED'
}

function fromDbStatus(status: DbEmergencyStatus): UiEmergencyStatus {
  if (status === 'NEW') return 'جديدة'
  if (status === 'IN_PROGRESS') return 'قيد المعالجة'
  return 'مغلقة'
}

function toDbLevel(level: UiEmergencyLevel): DbEmergencyLevel {
  if (level === 'منخفض') return 'LOW'
  if (level === 'متوسط') return 'MEDIUM'
  return 'HIGH'
}

function fromDbLevel(level: DbEmergencyLevel): UiEmergencyLevel {
  if (level === 'LOW') return 'منخفض'
  if (level === 'MEDIUM') return 'متوسط'
  return 'مرتفع'
}

const createSchema = z.object({
  campId: z.string().trim().min(1, 'معرّف المخيم مطلوب'),
  emergencyType: z.string().trim().min(1, 'نوع الطارئ مطلوب'),
  emergencyDescription: z.string().trim().min(1, 'وصف الطارئ مطلوب'),
  emergencyStatus: z.enum(['جديدة', 'قيد المعالجة', 'مغلقة']).default('جديدة'),
  emergencyLevel: z.enum(['منخفض', 'متوسط', 'مرتفع']).default('متوسط'),
  supervisorId: z.string().trim().min(1, 'معرّف المشرف مطلوب'),
})

const updateSchema = z
  .object({
    campId: z.string().trim().min(1, 'معرّف المخيم مطلوب').optional(),
    emergencyType: z.string().trim().min(1, 'نوع الطارئ مطلوب').optional(),
    emergencyDescription: z.string().trim().min(1, 'وصف الطارئ مطلوب').optional(),
    emergencyStatus: z.enum(['جديدة', 'قيد المعالجة', 'مغلقة']).optional(),
    emergencyLevel: z.enum(['منخفض', 'متوسط', 'مرتفع']).optional(),
    supervisorId: z.string().trim().min(1, 'معرّف المشرف مطلوب').optional(),
  })
  .strict()

async function assertCampExists(campId: string) {
  const camp = await prisma.camps.findUnique({
    where: { id: campId },
    select: { id: true },
  })

  if (!camp) {
    throw new Error('المخيم غير موجود')
  }
}

async function assertSupervisorExists(supervisorId: string) {
  const supervisor = await prisma.supervisor.findUnique({
    where: { id: supervisorId },
    select: { id: true },
  })

  if (!supervisor) {
    throw new Error('المشرف غير موجود')
  }
}

function mapEmergencyToFrontend(item: {
  id: string
  campId: string
  emergencyType: string
  description: string | null
  status: DbEmergencyStatus
  level: DbEmergencyLevel
  supervisorId: string
  supervisor?: { id: string; name: string } | null
}) {
  return {
    id: item.id,
    campId: item.campId,
    emergencyType: item.emergencyType,
    emergencyDescription: item.description ?? '',
    emergencyStatus: fromDbStatus(item.status),
    emergencyLevel: fromDbLevel(item.level),
    supervisorId: item.supervisorId,
    supervisorName: item.supervisor?.name ?? item.supervisorId,
    supervisor: item.supervisor?.name ?? item.supervisorId,
  }
}

export async function GET() {
  try {
    const emergencies = await prisma.emergency.findMany({
      orderBy: { id: 'desc' },
      include: {
        supervisor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(emergencies.map(mapEmergencyToFrontend))
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

    await assertCampExists(body.campId)
    await assertSupervisorExists(body.supervisorId)

    const created = await prisma.emergency.create({
      data: {
        campId: body.campId,
        emergencyType: body.emergencyType,
        description: body.emergencyDescription,
        status: toDbStatus(body.emergencyStatus),
        level: toDbLevel(body.emergencyLevel),
        supervisorId: body.supervisorId,
      },
      include: {
        supervisor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(mapEmergencyToFrontend(created), { status: 201 })
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
    return NextResponse.json({ message: 'معرّف الطارئ مفقود' }, { status: 400 })
  }

  try {
    const body = updateSchema.parse(await req.json())

    const existing = await prisma.emergency.findUnique({
      where: { id },
      include: {
        supervisor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ message: 'حالة الطوارئ غير موجودة' }, { status: 404 })
    }

    if (body.campId) {
      await assertCampExists(body.campId)
    }

    if (body.supervisorId) {
      await assertSupervisorExists(body.supervisorId)
    }

    const updated = await prisma.emergency.update({
      where: { id },
      data: {
        campId: body.campId,
        emergencyType: body.emergencyType,
        description:
          body.emergencyDescription !== undefined ? body.emergencyDescription : undefined,
        status: body.emergencyStatus ? toDbStatus(body.emergencyStatus) : undefined,
        level: body.emergencyLevel ? toDbLevel(body.emergencyLevel) : undefined,
        supervisorId: body.supervisorId,
      },
      include: {
        supervisor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(mapEmergencyToFrontend(updated))
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
      await prisma.emergency.deleteMany()
      return NextResponse.json({ ok: true })
    }

    if (!id) {
      return NextResponse.json({ message: 'معرّف الطارئ مفقود' }, { status: 400 })
    }

    const existing = await prisma.emergency.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ message: 'حالة الطوارئ غير موجودة' }, { status: 404 })
    }

    await prisma.emergency.delete({
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