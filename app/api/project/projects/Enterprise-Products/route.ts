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
  institutionId: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(0),
  availability: z.enum(['متوفر', 'غير متوفر']).default('غير متوفر'),
})

function normalizeEnterpriseProduct(item: any) {
  return {
    id: item.id,
    institutionId: item.institutionId,
    productId: item.productId,
    quantity: item.quantity,
    availability: toUiAvailability(item.availability),
    institution: item.institution ? {
      ...item.institution,
      nameAr: item.institution.nameAr || item.institution.name || 'غير مسمى'
    } : null,
    product: item.product ? {
      ...item.product,
      nameAr: item.product.nameAr || item.product.name || 'غير مسمى'
    } : null,
  }
}

export async function GET(req: NextRequest) {
  try {
    const items = await prisma.enterpriseProduct.findMany({
      orderBy: { id: 'desc' },
      include: { institution: true, product: true },
    })
    return NextResponse.json(items.map(normalizeEnterpriseProduct))
  } catch (e) {
    return NextResponse.json({ message: 'خطأ في جلب البيانات' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const body = createSchema.parse(json)
    const created = await prisma.enterpriseProduct.create({
      data: {
        institutionId: body.institutionId,
        productId: body.productId,
        quantity: body.quantity,
        availability: toDbAvailability(body.availability as UiAvailability),
      },
      include: { institution: true, product: true }
    })
    return NextResponse.json(normalizeEnterpriseProduct(created), { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ message: 'فشل الحفظ' }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ message: 'ID مفقود' }, { status: 400 })
  try {
    const body = await req.json()
    const updated = await prisma.enterpriseProduct.update({
      where: { id },
      data: {
        institutionId: body.institutionId,
        productId: body.productId,
        quantity: Number(body.quantity),
        availability: body.availability ? toDbAvailability(body.availability as UiAvailability) : undefined,
      },
      include: { institution: true, product: true }
    })
    return NextResponse.json(normalizeEnterpriseProduct(updated))
  } catch (e) {
    return NextResponse.json({ message: 'فشل التعديل' }, { status: 500 })
  }
}