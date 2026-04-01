import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma, DistributionStatus as PrismaDistributionStatus } from '@prisma/client'
import prisma from '@/lib/prisma'

const createSchema = z.object({
  beneficiaryId: z.string().trim().optional().nullable(),
  institutionId: z.string().trim().min(1, 'معرّف المؤسسة مطلوب'),
  productId: z.string().trim().optional().nullable(),
  quantity: z.coerce.number().int().min(0, 'يجب أن تكون الكمية 0 أو أكثر').default(0),
  status: z.nativeEnum(PrismaDistributionStatus).default(PrismaDistributionStatus.PENDING),
  aidId: z.string().trim().optional().nullable(),
  clinicId: z.string().trim().optional().nullable(),
  placeId: z.string().trim().optional().nullable(),
})

const updateSchema = z.object({
  beneficiaryId: z.string().trim().optional().nullable(),
  institutionId: z.string().trim().min(1, 'معرّف المؤسسة مطلوب').optional(),
  productId: z.string().trim().optional().nullable(),
  quantity: z.coerce.number().int().min(0, 'يجب أن تكون الكمية 0 أو أكثر').optional(),
  status: z.nativeEnum(PrismaDistributionStatus).optional(),
  aidId: z.string().trim().optional().nullable(),
  clinicId: z.string().trim().optional().nullable(),
  placeId: z.string().trim().optional().nullable(),
})

function normalizeOptional(value?: string | null) {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

async function ensureRelationsExist(input: {
  beneficiaryId?: string | null
  institutionId?: string
  productId?: string | null
  aidId?: string | null
  clinicId?: string | null
  placeId?: string | null
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

  if (input.beneficiaryId) {
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: input.beneficiaryId },
      select: { id: true },
    })

    if (!beneficiary) {
      throw new Error('معرّف المستفيد غير موجود')
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

  if (input.aidId) {
    const aid = await prisma.aid.findUnique({
      where: { id: input.aidId },
      select: { id: true },
    })

    if (!aid) {
      throw new Error('معرّف المساعدة غير موجود')
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

  if (input.placeId) {
    const place = await prisma.place.findUnique({
      where: { id: input.placeId },
      select: { id: true },
    })

    if (!place) {
      throw new Error('معرّف المكان غير موجود')
    }
  }
}

function formatDistribution(row: {
  id: string
  beneficiaryId: string | null
  institutionId: string
  productId: string | null
  quantity: number
  status: PrismaDistributionStatus
  aidId: string | null
  clinicId: string | null
  placeId: string | null
}) {
  return {
    id: row.id,
    beneficiaryId: row.beneficiaryId,
    institutionId: row.institutionId,
    productId: row.productId,
    quantity: row.quantity,
    status: row.status,
    aidId: row.aidId,
    clinicId: row.clinicId,
    placeId: row.placeId,
  }
}

export async function GET() {
  try {
    const distributions = await prisma.distribution.findMany({
      orderBy: { id: 'desc' },
    })

    return NextResponse.json(distributions.map(formatDistribution))
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

    const payload = {
      beneficiaryId: normalizeOptional(body.beneficiaryId),
      institutionId: body.institutionId.trim(),
      productId: normalizeOptional(body.productId),
      quantity: body.quantity,
      status: body.status,
      aidId: normalizeOptional(body.aidId),
      clinicId: normalizeOptional(body.clinicId),
      placeId: normalizeOptional(body.placeId),
    }

    await ensureRelationsExist(payload)

    const created = await prisma.distribution.create({
      data: payload,
    })

    return NextResponse.json(formatDistribution(created), { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'فشل التحقق من صحة البيانات', issues: e.issues },
        { status: 400 }
      )
    }

    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
      return NextResponse.json(
        { message: 'أحد المعرّفات المرتبطة غير موجود في قاعدة البيانات' },
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
    return NextResponse.json({ message: 'معرّف التوزيع مفقود' }, { status: 400 })
  }

  try {
    const body = updateSchema.parse(await req.json())

    const existing = await prisma.distribution.findUnique({
      where: { id },
      select: {
        id: true,
        beneficiaryId: true,
        institutionId: true,
        productId: true,
        quantity: true,
        status: true,
        aidId: true,
        clinicId: true,
        placeId: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ message: 'التوزيع غير موجود' }, { status: 404 })
    }

    const merged = {
      beneficiaryId:
        body.beneficiaryId !== undefined
          ? normalizeOptional(body.beneficiaryId)
          : existing.beneficiaryId,
      institutionId: body.institutionId ?? existing.institutionId,
      productId:
        body.productId !== undefined ? normalizeOptional(body.productId) : existing.productId,
      quantity: body.quantity ?? existing.quantity,
      status: body.status ?? existing.status,
      aidId: body.aidId !== undefined ? normalizeOptional(body.aidId) : existing.aidId,
      clinicId: body.clinicId !== undefined ? normalizeOptional(body.clinicId) : existing.clinicId,
      placeId: body.placeId !== undefined ? normalizeOptional(body.placeId) : existing.placeId,
    }

    await ensureRelationsExist(merged)

    const updated = await prisma.distribution.update({
      where: { id },
      data: {
        beneficiaryId:
          body.beneficiaryId !== undefined ? normalizeOptional(body.beneficiaryId) : undefined,
        institutionId: body.institutionId,
        productId: body.productId !== undefined ? normalizeOptional(body.productId) : undefined,
        quantity: body.quantity,
        status: body.status,
        aidId: body.aidId !== undefined ? normalizeOptional(body.aidId) : undefined,
        clinicId: body.clinicId !== undefined ? normalizeOptional(body.clinicId) : undefined,
        placeId: body.placeId !== undefined ? normalizeOptional(body.placeId) : undefined,
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

    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
      return NextResponse.json(
        { message: 'أحد المعرّفات المرتبطة غير موجود في قاعدة البيانات' },
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