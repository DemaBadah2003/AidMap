import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      include: { department: { include: { hospital: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    const formatted = services.map(s => ({
      id: s.id,
      name: s.name,
      price: s.price,
      isAvailable: s.isAvailable,
      departmentId: s.departmentId,
      departmentName: s.department?.name || '',
      hospitalId: s.department?.hospital?.id || '',
      hospitalName: s.department?.hospital?.name || '',
    }))
    return NextResponse.json(formatted)
  } catch (e) {
    console.error('GET /services error:', e)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name || !body.departmentId) {
      return NextResponse.json({ error: 'name and departmentId required' }, { status: 400 })
    }
    const service = await prisma.service.create({
      data: {
        name: body.name,
        price: body.price ? parseFloat(body.price) : 0,
        isAvailable: body.isAvailable !== false,
        departmentId: body.departmentId,
      },
    })
    return NextResponse.json(service, { status: 201 })
  } catch (e) {
    console.error('POST /services error:', e)
    return NextResponse.json({ error: 'Failed to create' }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const updated = await prisma.service.update({
      where: { id: body.id },
      data: {
        name: body.name,
        price: body.price ? parseFloat(body.price) : 0,
        isAvailable: body.isAvailable !== false,
        departmentId: body.departmentId,
      },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /services error:', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 400 })
  }
}
