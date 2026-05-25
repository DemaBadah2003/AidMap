import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - جلب أقسام مستشفى معين
export async function GET(
  req: NextRequest,
  { params }: { params: { hospitalId: string } }
) {
  try {
    const { hospitalId } = params

    const departments = await prisma.department.findMany({
      where: { hospitalId },
      include: {
        hospital: {
          select: { 
            id: true, 
            hospitalName: true 
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = departments.map(d => ({
      id: d.id,
      name: d.name,
      deptType: d.deptType,
      status: d.status,
      description: d.description,
      hospitalId: d.hospitalId,
      hospitalName: d.hospital?.hospitalName || '',
    }))

    return NextResponse.json(formatted)
  } catch (e) {
    console.error('GET /hospitals/[hospitalId]/departments error:', e)
    return NextResponse.json(
      { error: 'Failed to fetch departments' }, 
      { status: 500 }
    )
  }
}

// POST - إضافة قسم جديد لمستشفى معين
export async function POST(
  req: NextRequest,
  { params }: { params: { hospitalId: string } }
) {
  try {
    const { hospitalId } = params
    const body = await req.json()

    if (!body.name?.trim() || !body.deptType) {
      return NextResponse.json(
        { error: 'name and deptType are required' },
        { status: 400 }
      )
    }

    // التحقق من وجود المستشفى
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    })

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    const department = await prisma.department.create({
      data: {
        name: body.name.trim(),
        deptType: body.deptType,
        status: body.status || 'يعمل بكفاءة',
        description: body.description?.trim() || null,
        hospitalId: hospitalId, // استخدام hospitalId من URL
      },
      include: {
        hospital: {
          select: { 
            id: true, 
            hospitalName: true 
          },
        },
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (e) {
    console.error('POST /hospitals/[hospitalId]/departments error:', e)
    return NextResponse.json(
      { error: 'Failed to create department' }, 
      { status: 400 }
    )
  }
}