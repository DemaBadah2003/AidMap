import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const departmentId = searchParams.get('departmentId')

  if (!departmentId) {
    return NextResponse.json({ error: 'departmentId required' }, { status: 400 })
  }

  try {
    const [services, doctors] = await Promise.all([
      prisma.service.findMany({
        where: { departmentId },
        select: { id: true, name: true, price: true, isAvailable: true },
        orderBy: { name: 'asc' },
      }),
      prisma.doctor.findMany({
        where: { departmentId },
        select: { id: true, name: true, specialty: true, schedule: true, phone: true },
        orderBy: { name: 'asc' },
      }),
    ])
    return NextResponse.json({ services, doctors })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch department detail' }, { status: 500 })
  }
}
