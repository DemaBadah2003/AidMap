import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { PresenceStatus } from '@prisma/client'

type UiPresenceStatus = 'متاح' | 'غير متاح'
type DbPresenceStatus = PresenceStatus

type FieldErrors = Partial<
  Record<'managerName' | 'nameAr' | 'email' | 'serviceType' | 'presence' | 'placeId', string>
>

function toDbPresence(status: UiPresenceStatus): DbPresenceStatus {
  return status === 'متاح' ? PresenceStatus.AVAILABLE : PresenceStatus.UNAVAILABLE
}

function toUiPresence(status: PresenceStatus | string): UiPresenceStatus {
  return status === PresenceStatus.AVAILABLE ? 'متاح' : 'غير متاح'
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function mapZodIssuesToFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {}

  for (const issue of error.issues) {
    const fieldName = issue.path[0]
    if (typeof fieldName === 'string' && !(fieldName in fieldErrors)) {
      fieldErrors[fieldName as keyof FieldErrors] = issue.message
    }
  }

  return fieldErrors
}

// شروط البريد الإلكتروني: إنجليزي، يحتوي على @، ينتهي بـ .com
const englishComEmailSchema = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/,
    'البريد الإلكتروني يجب أن يكون باللغة الإنجليزية ويحتوي على @ وينتهي بـ .com'
  )

const createSchema = z.object({
  managerName: z.string().trim().min(1, 'اسم مسؤول المؤسسة مطلوب'),
  nameAr: z.string().trim().min(1, 'اسم المؤسسة مطلوب'),
  email: englishComEmailSchema,
  serviceType: z.string().trim().min(1, 'نوع الخدمة مطلوب'),
  presence: z.enum(['متاح', 'غير متاح']).default('متاح'),
  placeId: z.string().uuid().optional().nullable(),
})

const updateSchema = z.object({
  managerName: z.string().trim().min(1, 'اسم مسؤول المؤسسة مطلوب').optional(),
  nameAr: z.string().trim().min(1, 'اسم المؤسسة مطلوب').optional(),
  email: englishComEmailSchema.optional(),
  serviceType: z.string().trim().min(1, 'نوع الخدمة مطلوب').optional(),
  presence: z.enum(['متاح', 'غير متاح']).optional(),
  placeId: z.string().uuid().optional().nullable(),
})

function normalizeInstitution(institution: {
  id: string
  name: string
  instagramId: string | null // سنستمر في قراءته من الداتابيز كمصدر للبيانات
  email: string | null
  serviceType: string | null
  presence: PresenceStatus
  placeId?: string | null
  place?: unknown
}) {
  return {
    id: institution.id,
    nameAr: institution.name,
    managerName: institution.instagramId ?? '', // تحويله لليوزرفيس باسم مسؤول المؤسسة
    email: institution.email ?? '',
    serviceType: institution.serviceType ?? '',
    presence: toUiPresence(institution.presence),
    placeId: institution.placeId ?? null,
    place: institution.place ?? null,
  }
}

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim() || ''
    const presence = req.nextUrl.searchParams.get('presence')?.trim() || ''
    const placeId = req.nextUrl.searchParams.get('placeId')?.trim() || ''

    const presenceFilter =
      presence === 'متاح'
        ? PresenceStatus.AVAILABLE
        : presence === 'غير متاح'
          ? PresenceStatus.UNAVAILABLE
          : undefined

    const institutions = await prisma.institution.findMany({
      where: {
        AND: [
          q
            ? {
                OR: [
                  { id: { contains: q, mode: 'insensitive' } },
                  { instagramId: { contains: q, mode: 'insensitive' } }, // البحث في حقل المسؤول
                  { name: { contains: q, mode: 'insensitive' } },
                  { email: { contains: q, mode: 'insensitive' } },
                  { serviceType: { contains: q, mode: 'insensitive' } },
                ],
              }
            : {},
          presenceFilter ? { presence: presenceFilter } : {},
          placeId ? { placeId } : {},
        ],
      },
      orderBy: { name: 'asc' },
      include: {
        place: true,
      },
    })

    return NextResponse.json(institutions.map(normalizeInstitution))
  } catch (e) {
    console.error('GET institutions error:', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json())

    const normalizedEmailValue = normalizeEmail(body.email)
    const normalizedServiceType = body.serviceType.trim()

    // التحقق من تكرار البريد الإلكتروني
    const duplicateEmail = await prisma.institution.findFirst({
      where: {
        email: { equals: normalizedEmailValue, mode: 'insensitive' },
      },
      select: { id: true },
    })

    if (duplicateEmail) {
      return NextResponse.json(
        {
          message: 'البريد الإلكتروني مستخدم مسبقًا',
          fieldErrors: { email: 'البريد الإلكتروني مستخدم مسبقًا' },
        },
        { status: 409 }
      )
    }

    const created = await prisma.institution.create({
      data: {
        name: body.nameAr,
        instagramId: body.managerName.trim(), // تخزين اسم المسؤول في حقل instagramId
        email: normalizedEmailValue,
        serviceType: normalizedServiceType,
        presence: toDbPresence(body.presence),
        placeId: body.placeId || null,
      },
      include: {
        place: true,
      },
    })

    return NextResponse.json(normalizeInstitution(created), { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'فشل التحقق من صحة البيانات', fieldErrors: mapZodIssuesToFieldErrors(e) },
        { status: 400 }
      )
    }
    return NextResponse.json({ message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ message: 'معرّف المؤسسة مفقود' }, { status: 400 })

  try {
    const body = updateSchema.parse(await req.json())

    const updated = await prisma.institution.update({
      where: { id },
      data: {
        name: body.nameAr,
        instagramId: body.managerName !== undefined ? body.managerName.trim() : undefined,
        email: body.email !== undefined ? normalizeEmail(body.email) : undefined,
        serviceType: body.serviceType !== undefined ? body.serviceType.trim() : undefined,
        presence: body.presence !== undefined ? toDbPresence(body.presence) : undefined,
        placeId: body.placeId !== undefined ? body.placeId || null : undefined,
      },
      include: {
        place: true,
      },
    })

    return NextResponse.json(normalizeInstitution(updated))
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'فشل التحقق من صحة البيانات', fieldErrors: mapZodIssuesToFieldErrors(e) },
        { status: 400 }
      )
    }
    return NextResponse.json({ message: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const all = req.nextUrl.searchParams.get('all')

  try {
    if (all === 'true') {
      const result = await prisma.institution.deleteMany({})
      return NextResponse.json({ ok: true, deletedCount: result.count })
    }
    if (!id) return NextResponse.json({ message: 'معرّف المؤسسة مفقود' }, { status: 400 })

    await prisma.institution.delete({ where: { id } })
    return NextResponse.json({ ok: true, deletedId: id })
  } catch (e) {
    return NextResponse.json({ message: 'خطأ في الخادم' }, { status: 500 })
  }
}