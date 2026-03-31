import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ActiveStatus } from '@prisma/client'
import prisma from '../../../../../lib/prisma'

const normalizeText = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()

const arabicStatusSchema = z.enum(['نشط', 'غير نشط'])

const createProductSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم المنتج مطلوب'),
  quantity: z.number().int().min(0, 'الكمية يجب أن تكون 0 أو أكثر'),
  status: arabicStatusSchema,
})

const updateProductSchema = z
  .object({
    nameAr: z.string().trim().min(1, 'اسم المنتج مطلوب').optional(),
    quantity: z.number().int().min(0, 'الكمية يجب أن تكون 0 أو أكثر').optional(),
    status: arabicStatusSchema.optional(),
  })
  .strict()

function toPrismaStatus(status: 'نشط' | 'غير نشط'): ActiveStatus {
  return status === 'نشط' ? ActiveStatus.ACTIVE : ActiveStatus.INACTIVE
}

function fromPrismaStatus(status: ActiveStatus): 'نشط' | 'غير نشط' {
  return status === ActiveStatus.ACTIVE ? 'نشط' : 'غير نشط'
}

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
    status: fromPrismaStatus(product.status),
  }
}

async function hasDuplicateProduct(nameAr: string, excludeId?: string) {
  const rows = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const normalizedInput = normalizeText(nameAr)

  return rows.some(
    (product) =>
      product.id !== excludeId &&
      normalizeText(product.name) === normalizedInput
  )
}

export async function GET() {
  try {
    const items = await prisma.product.findMany({
      orderBy: {
        id: 'desc',
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        status: true,
      },
    })

    return NextResponse.json(items.map(formatProduct), { status: 200 })
  } catch (error) {
    console.error('GET /products error:', error)

    return NextResponse.json(
      { message: 'تعذر جلب المنتجات' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const body = createProductSchema.parse(json)

    const normalizedName = body.nameAr.trim()

    const duplicate = await hasDuplicateProduct(normalizedName)
    if (duplicate) {
      return NextResponse.json(
        { message: 'المنتج موجود بالفعل (اسم المنتج مكرر).' },
        { status: 409 }
      )
    }

    const created = await prisma.product.create({
      data: {
        name: normalizedName,
        quantity: body.quantity,
        status: toPrismaStatus(body.status),
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        status: true,
      },
    })

    return NextResponse.json(formatProduct(created), { status: 201 })
  } catch (error) {
    console.error('POST /products error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? 'البيانات المدخلة غير صحيحة' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'تعذر إنشاء المنتج' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { message: 'معرّف المنتج مطلوب' },
        { status: 400 }
      )
    }

    const json = await req.json()
    const body = updateProductSchema.parse(json)

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
    const mergedQuantity = body.quantity ?? existing.quantity
    const mergedStatus = body.status
      ? toPrismaStatus(body.status)
      : existing.status

    const duplicate = await hasDuplicateProduct(mergedName, id)
    if (duplicate) {
      return NextResponse.json(
        { message: 'المنتج موجود بالفعل (اسم المنتج مكرر).' },
        { status: 409 }
      )
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: mergedName,
        quantity: mergedQuantity,
        status: mergedStatus,
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        status: true,
      },
    })

    return NextResponse.json(formatProduct(updated), { status: 200 })
  } catch (error) {
    console.error('PUT /products error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? 'البيانات المدخلة غير صحيحة' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'تعذر تعديل المنتج' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    const all = req.nextUrl.searchParams.get('all')

    if (all === 'true') {
      await prisma.product.deleteMany()

      return NextResponse.json(
        { success: true, message: 'تم حذف جميع المنتجات' },
        { status: 200 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { message: 'معرّف المنتج مطلوب' },
        { status: 400 }
      )
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

    return NextResponse.json(
      { success: true, message: 'تم حذف المنتج' },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /products error:', error)

    return NextResponse.json(
      { message: 'تعذر حذف المنتج' },
      { status: 500 }
    )
  }
}