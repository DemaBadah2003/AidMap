import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { PresenceStatus } from '@prisma/client'

type UiPresenceStatus = 'متاح' | 'غير متاح'
type DbPresenceStatus = PresenceStatus

type FieldErrors = Partial<
  Record<'instagramId' | 'nameAr' | 'email' | 'serviceType' | 'presence' | 'placeId', string>
>

function toDbPresence(status: UiPresenceStatus): DbPresenceStatus {
  return status === 'متاح' ? PresenceStatus.AVAILABLE : PresenceStatus.UNAVAILABLE
}

function toUiPresence(status: PresenceStatus | string): UiPresenceStatus {
  return status === PresenceStatus.AVAILABLE ? 'متاح' : 'غير متاح'
}

function normalizeInstagram(value: string) {
  return value.trim().replace(/\s+/g, '_')
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

const englishComEmailSchema = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/,
    'البريد الإلكتروني يجب أن يكون باللغة الإنجليزية ويحتوي على @ وينتهي بـ .com'
  )

const createSchema = z.object({
  instagramId: z.string().trim().min(1, 'معرّف إنستغرام مطلوب'),
  nameAr: z.string().trim().min(1, 'اسم المؤسسة مطلوب'),
  email: englishComEmailSchema,
  serviceType: z.string().trim().min(1, 'نوع الخدمة مطلوب'),
  presence: z.enum(['متاح', 'غير متاح']).default('متاح'),
  placeId: z.string().uuid().optional().nullable(),
})

const updateSchema = z.object({
  instagramId: z.string().trim().min(1, 'معرّف إنستغرام مطلوب').optional(),
  nameAr: z.string().trim().min(1, 'اسم المؤسسة مطلوب').optional(),
  email: englishComEmailSchema.optional(),
  serviceType: z.string().trim().min(1, 'نوع الخدمة مطلوب').optional(),
  presence: z.enum(['متاح', 'غير متاح']).optional(),
  placeId: z.string().uuid().optional().nullable(),
})

function normalizeInstitution(institution: {
  id: string
  name: string
  instagramId: string | null
  email: string | null
  serviceType: string | null
  presence: PresenceStatus
  placeId?: string | null
  place?: unknown
}) {
  return {
    id: institution.id,
    nameAr: institution.name,
    instagramId: institution.instagramId ?? '',
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
                  { instagramId: { contains: q, mode: 'insensitive' } },
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

    const normalizedInstagramId = normalizeInstagram(body.instagramId)
    const normalizedEmailValue = normalizeEmail(body.email)
    const normalizedServiceType = body.serviceType.trim()

    const duplicateInstagram = await prisma.institution.findFirst({
      where: {
        instagramId: {
          equals: normalizedInstagramId,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    })

    if (duplicateInstagram) {
      return NextResponse.json(
        {
          message: 'معرّف إنستغرام مستخدم مسبقًا',
          fieldErrors: {
            instagramId: 'معرّف إنستغرام مستخدم مسبقًا',
          },
        },
        { status: 409 }
      )
    }

    const duplicateEmail = await prisma.institution.findFirst({
      where: {
        email: {
          equals: normalizedEmailValue,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    })

    if (duplicateEmail) {
      return NextResponse.json(
        {
          message: 'البريد الإلكتروني مستخدم مسبقًا',
          fieldErrors: {
            email: 'البريد الإلكتروني مستخدم مسبقًا',
          },
        },
        { status: 409 }
      )
    }

    const duplicateNameAndService = await prisma.institution.findFirst({
      where: {
        AND: [
          {
            name: {
              equals: body.nameAr,
              mode: 'insensitive',
            },
          },
          {
            serviceType: {
              equals: normalizedServiceType,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: { id: true },
    })

    if (duplicateNameAndService) {
      return NextResponse.json(
        {
          message: 'البيانات مكررة',
          fieldErrors: {
            nameAr: 'البيانات مكررة',
            serviceType: 'البيانات مكررة',
          },
        },
        { status: 409 }
      )
    }

    if (body.placeId) {
      const placeAlreadyUsed = await prisma.institution.findFirst({
        where: {
          placeId: body.placeId,
        },
        select: { id: true },
      })

      if (placeAlreadyUsed) {
        return NextResponse.json(
          {
            message: 'هذا المكان مرتبط بالفعل بمؤسسة أخرى.',
            fieldErrors: {
              placeId: 'هذا المكان مرتبط بالفعل بمؤسسة أخرى.',
            },
          },
          { status: 409 }
        )
      }
    }

    const created = await prisma.institution.create({
      data: {
        name: body.nameAr,
        instagramId: normalizedInstagramId,
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
    console.error('POST institutions error:', e)

    if (e instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'فشل التحقق من صحة البيانات',
          fieldErrors: mapZodIssuesToFieldErrors(e),
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
      { message: 'معرّف المؤسسة مفقود' },
      { status: 400 }
    )
  }

  try {
    const body = updateSchema.parse(await req.json())

    const currentInstitution = await prisma.institution.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        instagramId: true,
        email: true,
        serviceType: true,
        placeId: true,
      },
    })

    if (!currentInstitution) {
      return NextResponse.json(
        { message: 'المؤسسة غير موجودة' },
        { status: 404 }
      )
    }

    if (body.instagramId !== undefined) {
      const nextInstagram = normalizeInstagram(body.instagramId)

      const duplicateInstagram = await prisma.institution.findFirst({
        where: {
          NOT: { id },
          instagramId: {
            equals: nextInstagram,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })

      if (duplicateInstagram) {
        return NextResponse.json(
          {
            message: 'معرّف إنستغرام مستخدم مسبقًا',
            fieldErrors: {
              instagramId: 'معرّف إنستغرام مستخدم مسبقًا',
            },
          },
          { status: 409 }
        )
      }
    }

    if (body.email !== undefined) {
      const nextEmail = normalizeEmail(body.email)

      const duplicateEmail = await prisma.institution.findFirst({
        where: {
          NOT: { id },
          email: {
            equals: nextEmail,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })

      if (duplicateEmail) {
        return NextResponse.json(
          {
            message: 'البريد الإلكتروني مستخدم مسبقًا',
            fieldErrors: {
              email: 'البريد الإلكتروني مستخدم مسبقًا',
            },
          },
          { status: 409 }
        )
      }
    }

    if (body.nameAr !== undefined || body.serviceType !== undefined) {
      const nextName = body.nameAr ?? currentInstitution.name
      const nextServiceType = body.serviceType ?? currentInstitution.serviceType ?? ''

      const duplicateNameAndService = await prisma.institution.findFirst({
        where: {
          NOT: { id },
          AND: [
            {
              name: {
                equals: nextName,
                mode: 'insensitive',
              },
            },
            {
              serviceType: {
                equals: nextServiceType,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: { id: true },
      })

      if (duplicateNameAndService) {
        return NextResponse.json(
          {
            message: 'البيانات مكررة',
            fieldErrors: {
              nameAr: 'البيانات مكررة',
              serviceType: 'البيانات مكررة',
            },
          },
          { status: 409 }
        )
      }
    }

    if (body.placeId !== undefined && body.placeId) {
      const placeAlreadyUsed = await prisma.institution.findFirst({
        where: {
          placeId: body.placeId,
          NOT: { id },
        },
        select: { id: true },
      })

      if (placeAlreadyUsed) {
        return NextResponse.json(
          {
            message: 'هذا المكان مرتبط بالفعل بمؤسسة أخرى.',
            fieldErrors: {
              placeId: 'هذا المكان مرتبط بالفعل بمؤسسة أخرى.',
            },
          },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.institution.update({
      where: { id },
      data: {
        name: body.nameAr,
        instagramId: body.instagramId !== undefined ? normalizeInstagram(body.instagramId) : undefined,
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
    console.error('PUT institutions error:', e)

    if (e instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'فشل التحقق من صحة البيانات',
          fieldErrors: mapZodIssuesToFieldErrors(e),
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
      const institutions = await prisma.institution.findMany({
        select: { id: true },
      })

      if (institutions.length === 0) {
        return NextResponse.json({
          ok: true,
          message: 'لا توجد مؤسسات للحذف',
          deletedCount: 0,
        })
      }

      const result = await prisma.institution.deleteMany({})

      return NextResponse.json({
        ok: true,
        message: 'تم حذف جميع المؤسسات من قاعدة البيانات',
        deletedCount: result.count,
      })
    }

    if (!id) {
      return NextResponse.json(
        { message: 'معرّف المؤسسة مفقود' },
        { status: 400 }
      )
    }

    const currentInstitution = await prisma.institution.findUnique({
      where: { id },
      select: { id: true, name: true },
    })

    if (!currentInstitution) {
      return NextResponse.json(
        { message: 'المؤسسة غير موجودة أو تم حذفها مسبقًا' },
        { status: 404 }
      )
    }

    await prisma.institution.delete({
      where: { id },
    })

    return NextResponse.json({
      ok: true,
      message: 'تم حذف المؤسسة من قاعدة البيانات بنجاح',
      deletedId: id,
    })
  } catch (e: any) {
    console.error('DELETE institutions error:', e)

    if (e?.code === 'P2003') {
      return NextResponse.json(
        {
          message:
            'لا يمكن حذف المؤسسة لأنها مرتبطة ببيانات أخرى في قاعدة البيانات. احذف الارتباطات أولًا أو فعّل cascade delete.',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}