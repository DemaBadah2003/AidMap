import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { EnterpriseProductAvailability } from '@prisma/client'

type UiAvailability = 'متوفر' | 'غير متوفر'

function toDbAvailability(value: UiAvailability) {
  return value === 'متوفر'
    ? EnterpriseProductAvailability.AVAILABLE
    : EnterpriseProductAvailability.UNAVAILABLE
}

function toUiAvailability(value: EnterpriseProductAvailability): UiAvailability {
  return value === EnterpriseProductAvailability.AVAILABLE ? 'متوفر' : 'غير متوفر'
}

const createSchema = z.object({
  institutionId: z.string().trim().min(1, 'معرّف المؤسسة مطلوب'),
  productId: z.string().trim().min(1, 'معرّف المنتج مطلوب'),
  quantity: z.coerce.number().int().min(0, 'الكمية يجب أن تكون 0 أو أكثر'),
  availability: z.enum(['متوفر', 'غير متوفر']).default('غير متوفر'),
})

const updateSchema = z.object({
  institutionId: z.string().trim().min(1, 'معرّف المؤسسة مطلوب').optional(),
  productId: z.string().trim().min(1, 'معرّف المنتج مطلوب').optional(),
  quantity: z.coerce.number().int().min(0, 'الكمية يجب أن تكون 0 أو أكثر').optional(),
  availability: z.enum(['متوفر', 'غير متوفر']).optional(),
})

function normalizeEnterpriseProduct(item: {
  id: string
  institutionId: string
  productId: string
  quantity: number
  availability: EnterpriseProductAvailability
  institution?: unknown
  product?: unknown
}) {
  return {
    id: item.id,
    institutionId: item.institutionId,
    productId: item.productId,
    quantity: item.quantity,
    availability: toUiAvailability(item.availability),
    institution: item.institution ?? null,
    product: item.product ?? null,
  }
}

export async function GET(req: NextRequest) {
  try {
    const institutionId = req.nextUrl.searchParams.get('institutionId')
    const productId = req.nextUrl.searchParams.get('productId')

    const items = await prisma.enterpriseProduct.findMany({
      where: {
        ...(institutionId ? { institutionId } : {}),
        ...(productId ? { productId } : {}),
      },
      orderBy: { id: 'desc' },
      include: {
        institution: true,
        product: true,
      },
    })

    return NextResponse.json(items.map(normalizeEnterpriseProduct))
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

    const institutionExists = await prisma.institution.findUnique({
      where: { id: body.institutionId },
      select: { id: true },
    })

    if (!institutionExists) {
      return NextResponse.json(
        { message: 'المؤسسة المحددة غير موجودة' },
        { status: 400 }
      )
    }

    const productExists = await prisma.product.findUnique({
      where: { id: body.productId },
      select: { id: true },
    })

    if (!productExists) {
      return NextResponse.json(
        { message: 'المنتج المحدد غير موجود' },
        { status: 400 }
      )
    }

    const exists = await prisma.enterpriseProduct.findFirst({
      where: {
        institutionId: body.institutionId,
        productId: body.productId,
      },
      select: { id: true },
    })

    if (exists) {
      return NextResponse.json(
        { message: 'هذا الربط بين المؤسسة والمنتج موجود بالفعل.' },
        { status: 409 }
      )
    }

    const created = await prisma.enterpriseProduct.create({
      data: {
        institutionId: body.institutionId,
        productId: body.productId,
        quantity: body.quantity,
        availability: toDbAvailability(body.availability),
      },
      include: {
        institution: true,
        product: true,
      },
    })

    return NextResponse.json(normalizeEnterpriseProduct(created), { status: 201 })
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
    return NextResponse.json(
      { message: 'معرّف المنتج المؤسسي مفقود' },
      { status: 400 }
    )
  }

  try {
    const body = updateSchema.parse(await req.json())

    const current = await prisma.enterpriseProduct.findUnique({
      where: { id },
      select: {
        id: true,
        institutionId: true,
        productId: true,
      },
    })

    if (!current) {
      return NextResponse.json(
        { message: 'العنصر غير موجود' },
        { status: 404 }
      )
    }

    const nextInstitutionId = body.institutionId ?? current.institutionId
    const nextProductId = body.productId ?? current.productId

    if (body.institutionId) {
      const institutionExists = await prisma.institution.findUnique({
        where: { id: body.institutionId },
        select: { id: true },
      })

      if (!institutionExists) {
        return NextResponse.json(
          { message: 'المؤسسة المحددة غير موجودة' },
          { status: 400 }
        )
      }
    }

    if (body.productId) {
      const productExists = await prisma.product.findUnique({
        where: { id: body.productId },
        select: { id: true },
      })

      if (!productExists) {
        return NextResponse.json(
          { message: 'المنتج المحدد غير موجود' },
          { status: 400 }
        )
      }
    }

    if (body.institutionId || body.productId) {
      const exists = await prisma.enterpriseProduct.findFirst({
        where: {
          institutionId: nextInstitutionId,
          productId: nextProductId,
          NOT: { id },
        },
        select: { id: true },
      })

      if (exists) {
        return NextResponse.json(
          { message: 'هذا الربط بين المؤسسة والمنتج موجود بالفعل.' },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.enterpriseProduct.update({
      where: { id },
      data: {
        institutionId: body.institutionId,
        productId: body.productId,
        quantity: body.quantity,
        availability:
          body.availability ? toDbAvailability(body.availability) : undefined,
      },
      include: {
        institution: true,
        product: true,
      },
    })

    return NextResponse.json(normalizeEnterpriseProduct(updated))
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
      await prisma.enterpriseProduct.deleteMany()
      return NextResponse.json({ ok: true })
    }

    if (!id) {
      return NextResponse.json(
        { message: 'معرّف المنتج المؤسسي مفقود' },
        { status: 400 }
      )
    }

    const current = await prisma.enterpriseProduct.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!current) {
      return NextResponse.json(
        { message: 'العنصر غير موجود' },
        { status: 404 }
      )
    }

    await prisma.enterpriseProduct.delete({
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