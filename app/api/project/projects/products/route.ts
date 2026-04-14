import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const data = await prisma.product.findMany({ orderBy: { nameAr: 'asc' } })
  const normalized = data.map(p => ({
    ...p,
    uiStatus: p.status === 'MOJOUD' ? 'موجود' : 'غير موجود'
  }))
  return NextResponse.json(normalized)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const created = await prisma.product.create({
    data: {
      nameAr: body.nameAr,
      price: Number(body.price),
      quantity: Number(body.quantity),
      status: Number(body.quantity) > 0 ? 'MOJOUD' : 'GHAIR_MOJOUD'
    }
  })
  return NextResponse.json(created)
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const body = await req.json()

  if (!id) return NextResponse.json({ message: 'المعرف مفقود' }, { status: 400 })

  const updated = await prisma.product.update({
    where: { id: id },
    data: {
      nameAr: body.nameAr,
      price: Number(body.price),
      quantity: Number(body.quantity),
      status: Number(body.quantity) > 0 ? 'MOJOUD' : 'GHAIR_MOJOUD'
    }
  })
  
  return NextResponse.json({
    ...updated,
    uiStatus: updated.status === 'MOJOUD' ? 'موجود' : 'غير موجود'
  })
}