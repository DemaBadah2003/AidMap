import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'

type FrontStatus = 'مجدول' | 'تم' | 'ملغي'

function toDbStatus(status: FrontStatus) {
  switch (status) {
    case 'تم':
      return 'COMPLETED'
    case 'ملغي':
      return 'CANCELLED'
    case 'مجدول':
    default:
      return 'PENDING'
  }
}

function fromDbStatus(status: string): FrontStatus {
  switch (status) {
    case 'COMPLETED':
      return 'تم'
    case 'CANCELLED':
      return 'ملغي'
    case 'PENDING':
    default:
      return 'مجدول'
  }
}

const createSchema = z.object({
  institutionId: z.string().trim().min(1, 'معرّف المؤسسة مطلوب'),
  clinicId: z.string().trim().min(1, 'معرّف العيادة مطلوب'),
  productId: z.string().trim().min(1, 'معرّف المنتج مطلوب'),
  quantity: z.coerce.number().int().positive('يجب أن تكون الكمية أكبر من 0'),
  status: z.enum(['مجدول', 'تم', 'ملغي']).default('مجدول'),
})

const updateSchema = z.object({
  institutionId: z.string().trim().min(1, 'معرّف المؤسسة مطلوب').optional(),
  clinicId: z.string().trim().min(1, 'معرّف العيادة مطلوب').optional(),
  productId: z.string().trim().min(1, 'معرّف المنتج مطلوب').optional(),
  quantity: z.coerce.number().int().positive('يجب أن تكون الكمية أكبر من 0').optional(),
  status: z.enum(['مجدول', 'تم', 'ملغي']).optional(),
})

async function ensureRelationsExist(input: {
  institutionId?: string
  clinicId?: string
  productId?: string
}) {
  if (input.institutionId) {
    const institution = await prisma.institution.findUnique({
      where: { id: input.institutionId },
      select: { id: true },
    })

    if (!institution) {
      throw new Error('معرّف المؤسسة غير موجود')
    }
  }

  if (input.clinicId) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: input.clinicId },
      select: { id: true },
    })

    if (!clinic) {
      throw new Error('معرّف العيادة غير موجود')
    }
  }

  if (input.productId) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true },
    })

    if (!product) {
      throw new Error('معرّف المنتج غير موجود')
    }
  }
}

function formatDistribution(row: {
  id: string
  institutionId: string
  clinicId: string | null
  productId: string | null
  quantity: number
  status: string
}) {
  return {
    id: row.id,
    institutionId: row.institutionId,
    clinicId: row.clinicId ?? '',
    productId: row.productId ?? '',
    quantity: row.quantity,
    status: fromDbStatus(row.status),
  }
}

export async function GET() {
  try {
    const rows = await prisma.distribution.findMany({
      orderBy: { id: 'desc' },
      include: {
        institution: true,
        clinic: true,
        product: true,
      },
    })

    return NextResponse.json(rows.map(formatDistribution))
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

    await ensureRelationsExist({
      institutionId: body.institutionId,
      clinicId: body.clinicId,
      productId: body.productId,
    })

    const created = await prisma.distribution.create({
      data: {
        institutionId: body.institutionId,
        clinicId: body.clinicId,
        productId: body.productId,
        quantity: body.quantity,
        status: toDbStatus(body.status) as any,
      },
      include: {
        institution: true,
        clinic: true,
        product: true,
      },
    })

    return NextResponse.json(formatDistribution(created), { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'فشل التحقق من صحة البيانات', issues: e.issues },
        { status: 400 }
      )
    }

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2003') {
        return NextResponse.json(
          { message: 'أحد المعرّفات المرتبطة غير موجود في قاعدة البيانات' },
          { status: 400 }
        )
      }
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
    return NextResponse.json({ message: 'معرّف التوزيع مفقود' }, { status: 400 })
  }

  try {
    const body = updateSchema.parse(await req.json())

    const existing = await prisma.distribution.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ message: 'التوزيع غير موجود' }, { status: 404 })
    }

    await ensureRelationsExist({
      institutionId: body.institutionId,
      clinicId: body.clinicId,
      productId: body.productId,
    })

    const updated = await prisma.distribution.update({
      where: { id },
      data: {
        institutionId: body.institutionId,
        clinicId: body.clinicId,
        productId: body.productId,
        quantity: body.quantity,
        status: body.status ? (toDbStatus(body.status) as any) : undefined,
      },
      include: {
        institution: true,
        clinic: true,
        product: true,
      },
    })

    return NextResponse.json(formatDistribution(updated))
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'فشل التحقق من صحة البيانات', issues: e.issues },
        { status: 400 }
      )
    }

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2003') {
        return NextResponse.json(
          { message: 'أحد المعرّفات المرتبطة غير موجود في قاعدة البيانات' },
          { status: 400 }
        )
      }
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
      await prisma.distribution.deleteMany()
      return NextResponse.json({ ok: true })
    }

    if (!id) {
      return NextResponse.json({ message: 'معرّف التوزيع مفقود' }, { status: 400 })
    }

    const existing = await prisma.distribution.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ message: 'التوزيع غير موجود' }, { status: 404 })
    }

    await prisma.distribution.delete({
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