import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

// 1. سكيما التحقق من البيانات
const shelterSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'اسم المركز مطلوب')
    .refine(
      (val) => val.split(/\s+/).filter(Boolean).length >= 4,
      { message: 'يجب أن يكون الاسم رباعياً على الأقل' }
    ),
  area: z.string().min(1, 'المنطقة مطلوبة'),
  phone: z.string()
    .trim()
    .regex(/^(056|059)\d{7}$/, 'رقم غير صحيح (056/059)'),
  capacity: z.coerce.number().int().min(1, 'السعة يجب أن تكون أكبر من 0'),
  familiesCount: z.coerce.number().int().nonnegative('عدد العائلات لا يمكن أن يكون سالباً'),
})

// دالة مساعدة لحساب حالة الامتلاء
function getFillStatus(familiesCount: number, capacity: number) {
  return familiesCount >= capacity ? 'FULL' : 'NOT_FULL'
}

// دالة مساعدة لجلب مشرف (تم حذف شرط isTrashed المسبب للخطأ 500)
async function getOrCreateDefaultSupervisor() {
  // تم إزالة { where: { isTrashed: false } } لأن الحقل غير موجود في جدول Supervisor
  let supervisor = await prisma.supervisor.findFirst();

  if (!supervisor) {
    supervisor = await prisma.supervisor.create({
      data: {
        name: 'مشرف افتراضي',
        phone: '0590000000',
        status: 'ACTIVE',
      },
    })
  }
  return supervisor.id
}

export async function GET(req: NextRequest) {
  try {
    const shelters = await prisma.shelter.findMany({
      where: { isTrashed: false },
      orderBy: { createdAt: 'desc' },
      include: { supervisor: true },
    })
    return NextResponse.json(shelters)
  } catch (error) {
    return NextResponse.json({ message: 'فشل في جلب البيانات' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const result = shelterSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ 
        message: 'بيانات غير صالحة', 
        errors: result.error.flatten().fieldErrors 
      }, { status: 400 })
    }

    const { name, area, phone, capacity, familiesCount } = result.data
    const supervisorId = await getOrCreateDefaultSupervisor()

    const newShelter = await prisma.shelter.create({
      data: {
        name,
        area,
        phone,
        capacity,
        familiesCount,
        fillStatus: getFillStatus(familiesCount, capacity),
        supervisorId,
        isTrashed: false,
        isProtected: false,
      },
    })

    return NextResponse.json(newShelter, { status: 201 })
  } catch (error: any) {
    console.error("DATABASE_ERROR:", error)
    return NextResponse.json({ message: 'خطأ داخلي في السيرفر' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'ID مطلوب' }, { status: 400 })

    const json = await req.json()
    const result = shelterSchema.safeParse(json)
    if (!result.success) return NextResponse.json({ message: 'بيانات غير صالحة' }, { status: 400 })

    const updated = await prisma.shelter.update({
      where: { id },
      data: {
        ...result.data,
        fillStatus: getFillStatus(result.data.familiesCount, result.data.capacity)
      }
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ message: 'فشل التحديث' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'ID مطلوب' }, { status: 400 })

    await prisma.shelter.update({
      where: { id },
      data: { isTrashed: true }
    })
    return NextResponse.json({ message: 'تم الحذف' })
  } catch (error) {
    return NextResponse.json({ message: 'فشل الحذف' }, { status: 500 })
  }
}