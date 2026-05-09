import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: { hospital: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    const formatted = departments.map(d => ({
      id: d.id,
      name: d.name,
      deptType: d.deptType,
      status: d.status,
      description: d.description,
      hospitalId: d.hospitalId,
      hospitalName: d.hospital?.name || '',
    }))
    return NextResponse.json(formatted)
  } catch (e) {
    console.error('GET /departments error:', e)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name || !body.hospitalId || !body.deptType) {
      return NextResponse.json({ error: 'name, hospitalId, deptType required' }, { status: 400 })
    }
    const dept = await prisma.department.create({
      data: {
        name: body.name,
        deptType: body.deptType,
        status: body.status || 'يعمل بكفاءة',
        description: body.description || null,
        hospitalId: body.hospitalId,
      },
    })
    return NextResponse.json(dept, { status: 201 })
  } catch (e) {
    console.error('POST /departments error:', e)
    return NextResponse.json({ error: 'Failed to create' }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const updated = await prisma.department.update({
      where: { id: body.id },
      data: {
        name: body.name,
        deptType: body.deptType,
        status: body.status,
        description: body.description || null,
        hospitalId: body.hospitalId,
      },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /departments error:', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 400 })
  }
}
