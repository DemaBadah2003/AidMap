import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ActiveStatus } from '@prisma/client'
import prisma from '@/lib/prisma'

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function toDbStatus(status: 'نشط' | 'غير نشط'): ActiveStatus {
  return status === 'نشط' ? ActiveStatus.ACTIVE : ActiveStatus.INACTIVE
}

function fromDbStatus(status: ActiveStatus): 'نشط' | 'غير نشط' {
  return status === ActiveStatus.ACTIVE ? 'نشط' : 'غير نشط'
}

const createSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم المنتج مطلوب'),
  quantity: z.coerce.number().int().min(0, 'الكمية يجب أن تكون 0 أو أكثر'),
  status: z.enum(['نشط', 'غير نشط']),
})

const updateSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم المنتج مطلوب').optional(),
  quantity: z.coerce
    .number()
    .int()
    .min(0, 'الكمية يجب أن تكون 0 أو أكثر')
    .optional(),
  status: z.enum(['نشط', 'غير نشط']).optional(),
})

function formatProduct(product: {
  id: string
  name: string
  quantity: number
  status: ActiveStatus
}) {
  return {
    id: product.id,
    nameAr: product.name,
    quantity: product.quantity,
    status: fromDbStatus(product.status),
  }
}

async function hasDuplicateProduct(nameAr: string, excludeId?: string) {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const normalizedInput = normalizeText(nameAr)

  return products.some(
    (product) =>
      product.id !== excludeId &&
      normalizeText(product.name) === normalizedInput
  )
}

export async function GET(req: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        name: true,
        quantity: true,
        status: true,
      },
    })

    return NextResponse.json(products.map(formatProduct))
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

    const normalizedName = body.nameAr.trim()

    const exists = await hasDuplicateProduct(normalizedName)

    if (exists) {
      return NextResponse.json(
        { message: 'المنتج موجود بالفعل (اسم المنتج مكرر).' },
        { status: 409 }
      )
    }

    const created = await prisma.product.create({
      data: {
        name: normalizedName,
        quantity: body.quantity,
        status: toDbStatus(body.status),
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        status: true,
      },
    })

    return NextResponse.json(formatProduct(created), { status: 201 })
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
    return NextResponse.json({ message: 'معرّف المنتج مفقود' }, { status: 400 })
  }

  try {
    const body = updateSchema.parse(await req.json())

    const existing = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        quantity: true,
        status: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { message: 'المنتج غير موجود' },
        { status: 404 }
      )
    }

    const mergedName = body.nameAr?.trim() ?? existing.name

    const exists = await hasDuplicateProduct(mergedName, id)

    if (exists) {
      return NextResponse.json(
        { message: 'المنتج موجود بالفعل (اسم المنتج مكرر).' },
        { status: 409 }
      )
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: body.nameAr?.trim() ?? existing.name,
        quantity: body.quantity ?? existing.quantity,
        status: body.status ? toDbStatus(body.status) : existing.status,
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        status: true,
      },
    })

    return NextResponse.json(formatProduct(updated))
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
      await prisma.product.deleteMany()
      return NextResponse.json({ ok: true })
    }

    if (!id) {
      return NextResponse.json({ message: 'معرّف المنتج مفقود' }, { status: 400 })
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json(
        { message: 'المنتج غير موجود' },
        { status: 404 }
      )
    }

    await prisma.product.delete({
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