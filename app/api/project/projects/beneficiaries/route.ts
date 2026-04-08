import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BeneficiaryPriority } from '@prisma/client'
import prisma from '@/lib/prisma'

// دالة تحويل الأولوية لقاعدة البيانات
function toDbPriority(priority: 'مستعجل' | 'عادي' | 'حرج'): BeneficiaryPriority {
  if (priority === 'مستعجل') return BeneficiaryPriority.URGENT
  if (priority === 'حرج') return BeneficiaryPriority.IMPORTANT
  return BeneficiaryPriority.NORMAL
}

// دالة تحويل الأولوية للعرض
function fromDbPriority(priority: BeneficiaryPriority): 'مستعجل' | 'عادي' | 'حرج' {
  if (priority === BeneficiaryPriority.URGENT) return 'مستعجل'
  if (priority === BeneficiaryPriority.IMPORTANT) return 'حرج'
  return 'عادي'
}

// Schema المحدثة لتتوافق مع الفرونت إند (بدون تعقيدات المسافات وبنطاق 1-50)
const beneficiarySchema = z.object({
  nameAr: z.string().min(1, 'اسم المستفيد مطلوب').trim(),
  phone: z.string().trim().min(1, 'رقم الهاتف مطلوب'),
  familyCount: z.coerce
    .number()
    .int()
    .min(1, 'يجب أن يكون فرد واحد على الأقل')
    .max(50, 'الحد الأقصى 50 فرداً'),
  campId: z.string().trim().min(1, 'يجب اختيار المخيم'),
  priority: z.enum(['مستعجل', 'عادي', 'حرج']),
})

const updateSchema = beneficiarySchema.partial();

// 1. جلب البيانات (GET)
export async function GET() {
  try {
    const beneficiaries = await prisma.beneficiary.findMany({
      orderBy: { createdAt: 'desc' },
      include: { camp: true },
    })
    return NextResponse.json(beneficiaries.map((b) => ({
      id: b.id,
      nameAr: b.name,
      phone: b.phone,
      familyCount: b.numberOfFamily,
      campId: b.campId ?? '',
      campName: b.camp?.name ?? '',
      area: b.camp?.area ?? '',
      priority: fromDbPriority(b.priority),
    })))
  } catch (e) {
    return NextResponse.json({ message: 'خطأ في جلب البيانات' }, { status: 500 })
  }
}

// 2. إضافة مستفيد جديد (POST)
export async function POST(req: NextRequest) {
  try {
    const body = beneficiarySchema.parse(await req.json())
    
    const created = await prisma.beneficiary.create({
      data: {
        name: body.nameAr,
        phone: body.phone,
        numberOfFamily: body.familyCount,
        campId: body.campId,
        priority: toDbPriority(body.priority),
      },
      include: { camp: true }
    })

    return NextResponse.json({
      id: created.id,
      nameAr: created.name,
      phone: created.phone,
      familyCount: created.numberOfFamily,
      campId: created.campId ?? '',
      campName: created.camp?.name ?? '',
      area: created.camp?.area ?? '',
      priority: fromDbPriority(created.priority),
    })
  } catch (e) {
    console.error("POST Error:", e)
    return NextResponse.json({ message: 'البيانات غير صالحة أو مخالفة للشروط' }, { status: 400 })
  }
}

// 3. التعديل (PATCH) - تم تحسينه لحل خطأ 400
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  
  if (!id) return NextResponse.json({ message: 'المعرف مفقود' }, { status: 400 })

  try {
    const rawData = await req.json()
    // استخراج الحقول التي نريد تحديثها فقط وتمريرها للسكيما الجزئية
    const validatedData = updateSchema.parse(rawData)

    const updated = await prisma.beneficiary.update({
      where: { id },
      data: {
        name: validatedData.nameAr,
        phone: validatedData.phone,
        numberOfFamily: validatedData.familyCount,
        campId: validatedData.campId,
        priority: validatedData.priority ? toDbPriority(validatedData.priority) : undefined,
      },
      include: { camp: true }
    })

    return NextResponse.json({
      id: updated.id,
      nameAr: updated.name,
      phone: updated.phone,
      familyCount: updated.numberOfFamily,
      campId: updated.campId ?? '',
      campName: updated.camp?.name ?? '',
      area: updated.camp?.area ?? '',
      priority: fromDbPriority(updated.priority),
    })
  } catch (e) {
    console.error("PATCH Error:", e)
    return NextResponse.json({ message: 'فشل التعديل، تأكد من مطابقة الشروط' }, { status: 400 })
  }
}

// 4. الحذف (DELETE)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ message: 'المعرف مفقود' }, { status: 400 })
  
  try {
    await prisma.beneficiary.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ message: 'فشل الحذف' }, { status: 400 })
  }
}