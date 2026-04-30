import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

// --- شروط التحقق ---
const fourNamesRegex = /^[^\s]+\s+[^\s]+\s+[^\s]+\s+[^\s]+.*$/
const phoneRegex = /^(056|059)\d{7}$/
const idRegex = /^\d{9}$/

const citizenSchema = z.object({
  nameAr: z.string().trim().min(1).regex(fourNamesRegex, 'الاسم يجب أن يكون رباعياً'),
  idNumber: z.string().trim().regex(idRegex, 'رقم الهوية يجب أن يكون 9 أرقام'),
  phone: z.string().trim().regex(phoneRegex, 'رقم الهاتف غير صحيح'),
  familyCount: z.coerce.number().int().min(2, 'العائلة يجب أن تكون فردين فأكثر'),
  campId: z.string().optional(),
})

const updateSchema = citizenSchema.partial();

// 1. جلب البيانات (GET)
export async function GET() {
  try {
    const citizens = await prisma.citizens.findMany({
      orderBy: { createdAt: 'desc' },
      include: { camp: true },
    })
    
    return NextResponse.json(citizens.map((c: any) => ({
      id: c.id,
      nameAr: c.name,
      idNumber: c.idNumber,
      phone: c.phone,
      familyCount: c.numberOfFamily,
      campId: c.campId ?? '',
      campName: c.camp?.name ?? '',
      area: c.camp?.area ?? '',
    })))
  } catch (e) {
    return NextResponse.json({ message: 'خطأ في جلب البيانات' }, { status: 500 })
  }
}

// 2. إضافة جديد (POST)
export async function POST(req: NextRequest) {
  try {
    const body = citizenSchema.parse(await req.json())
    
    // استخدام any لتجاوز أخطاء Typescript المتعلقة بـ Prisma Schema إذا كانت غير متطابقة مؤقتاً
    const created = await (prisma.citizens as any).create({
      data: {
        name: body.nameAr,
        idNumber: body.idNumber,
        phone: body.phone,
        numberOfFamily: body.familyCount,
        campId: body.campId || null,
      },
      include: { camp: true }
    })

    return NextResponse.json({
      id: created.id,
      nameAr: created.name,
      idNumber: created.idNumber,
      phone: created.phone,
      familyCount: created.numberOfFamily,
      campId: created.campId ?? '',
      campName: created.camp?.name ?? '',
      area: created.camp?.area ?? '',
    })
  } catch (e) {
    console.error("POST Error:", e)
    return NextResponse.json({ message: 'البيانات غير صالحة أو مكررة' }, { status: 400 })
  }
}

// 3. التعديل (PATCH)
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  
  if (!id) return NextResponse.json({ message: 'المعرف مفقود' }, { status: 400 })

  try {
    const rawData = await req.json()
    const validatedData = updateSchema.parse(rawData)

    const updated = await (prisma.citizens as any).update({
      where: { id },
      data: {
        name: validatedData.nameAr,
        idNumber: validatedData.idNumber,
        phone: validatedData.phone,
        numberOfFamily: validatedData.familyCount,
        campId: validatedData.campId,
      },
      include: { camp: true }
    })

    return NextResponse.json({
      id: updated.id,
      nameAr: updated.name,
      idNumber: updated.idNumber,
      phone: updated.phone,
      familyCount: updated.numberOfFamily,
      campId: updated.campId ?? '',
      campName: updated.camp?.name ?? '',
      area: updated.camp?.area ?? '',
    })
  } catch (e) {
    console.error("PATCH Error:", e)
    return NextResponse.json({ message: 'فشل التعديل، تأكد من البيانات' }, { status: 400 })
  }
}

// 4. الحذف (DELETE)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ message: 'المعرف مفقود' }, { status: 400 })
  
  try {
    await prisma.citizens.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ message: 'فشل الحذف' }, { status: 400 })
  }
}