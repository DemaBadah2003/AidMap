import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - جلب جميع الأطباء
export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        hospital: {
          select: { id: true, hospitalName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = doctors.map(d => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      phone: d.phone,
      workSchedule: d.workSchedule,
      description: d.description,
      hospitalId: d.hospitalId,
      hospitalName: d.hospital?.hospitalName || '',
      departmentId: d.departmentId,
    }))

    // تغيير: إرجاع doctors كـ object وليس array مباشرة
    return NextResponse.json({ doctors: formatted })
  } catch (e) {
    console.error('GET /doctors error:', e)
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 })
  }
}

// POST - إضافة طبيب جديد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // التحقق من الحقول المطلوبة
    if (!body.name?.trim() || !body.hospitalId || !body.phone || !body.workSchedule) {
      return NextResponse.json(
        { error: 'name, hospitalId, phone, and workSchedule are required' },
        { status: 400 }
      )
    }

    // التحقق من صحة رقم الهاتف
    const phoneRegex = /^(056|059)\d{7}$/
    if (!phoneRegex.test(body.phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // التحقق من عدم تكرار رقم الهاتف
    const existingDoctor = await prisma.doctor.findFirst({
      where: { phone: body.phone },
    })

    if (existingDoctor) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 409 }
      )
    }

    const doctor = await prisma.doctor.create({
      data: {
        name: body.name.trim(),
        specialty: body.specialization || body.specialty, // دعم كلا الاسمين
        phone: body.phone,
        workSchedule: body.workSchedule,
        description: body.description?.trim() || null,
        hospitalId: body.hospitalId,
        departmentId: body.departmentId || null,
      },
    })

    return NextResponse.json(doctor, { status: 201 })
  } catch (e) {
    console.error('POST /doctors error:', e)
    return NextResponse.json({ error: 'Failed to create doctor' }, { status: 400 })
  }
}

// PATCH - تعديل طبيب
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // التحقق من صحة رقم الهاتف
    if (body.phone) {
      const phoneRegex = /^(056|059)\d{7}$/
      if (!phoneRegex.test(body.phone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        )
      }

      // التحقق من عدم تكرار رقم الهاتف (باستثناء الطبيب الحالي)
      const existingDoctor = await prisma.doctor.findFirst({
        where: { 
          phone: body.phone,
          NOT: { id: body.id }
        },
      })

      if (existingDoctor) {
        return NextResponse.json(
          { error: 'Phone number already exists' },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.doctor.update({
      where: { id: body.id },
      data: {
        name: body.name?.trim(),
        specialty: body.specialization || body.specialty,
        phone: body.phone,
        workSchedule: body.workSchedule,
        description: body.description?.trim() || null,
        hospitalId: body.hospitalId,
        departmentId: body.departmentId || null,
      },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /doctors error:', e)
    return NextResponse.json({ error: 'Failed to update doctor' }, { status: 400 })
  }
}