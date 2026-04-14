import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

// مخطط التحقق
const serviceSchema = z.object({
  institutionId: z.string().uuid(),
  serviceId: z.string().uuid(),
  status: z.string().min(1),
})

// 1. جلب البيانات
export async function GET() {
  try {
    const items = await prisma.institutionService.findMany({
      orderBy: { id: 'desc' },
      include: {
        institution: { select: { id: true, name: true } }, // استبدال nameAr بـ name
        service: { select: { id: true, serviceType: true } },
      },
    })
    return NextResponse.json(items)
  } catch (e) {
    return NextResponse.json({ message: 'خطأ في جلب البيانات' }, { status: 500 })
  }
}

// 2. إضافة ربط جديد
export async function POST(req: NextRequest) {
  try {
    const body = serviceSchema.parse(await req.json())
    const created = await prisma.institutionService.create({
      data: body,
      include: {
        institution: { select: { name: true } },
        service: { select: { serviceType: true } },
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ message: 'فشل الإضافة' }, { status: 500 })
  }
}

// 3. تحديث البيانات (حل مشكلة الايرور في الصورة)
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ message: 'المعرف مفقود' }, { status: 400 })

  try {
    const body = await req.json()
    const updated = await prisma.institutionService.update({
      where: { id },
      data: {
        institutionId: body.institutionId,
        serviceId: body.serviceId,
        status: body.status,
      },
      include: {
        institution: { select: { name: true } }, // التصحيح هنا: استخدام name بدلاً من nameAr
        service: { select: { serviceType: true } },
      },
    })
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ message: 'فشل التعديل' }, { status: 500 })
  }
}