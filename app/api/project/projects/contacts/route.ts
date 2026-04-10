import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

/* ============================= */
/* 🔁 أدوات التحويل (Helpers) */
/* ============================= */

// تحويل الحالة من العرض (تم/لم يتم) إلى قيم قاعدة البيانات
function toDbStatus(status: 'تم' | 'لم يتم') {
  return status === 'تم' ? 'DONE' : 'NOT_DONE'
}

// تحويل الكائن القادم من قاعدة البيانات ليتناسب مع الواجهة الأمامية
function formatContact(contact: any) {
  return {
    ...contact,
    status: contact.status === 'DONE' ? 'تم' : 'لم يتم',
  }
}

/* ============================= */
/* 🧾 Schemas */
/* ============================= */

const createSchema = z.object({
  beneficiaryId: z.string().trim().min(1, 'معرّف المستفيد مطلوب'),
  institutionId: z.string().trim().min(1, 'معرّف المؤسسة مطلوب'),
  status: z.enum(['تم', 'لم يتم'], { 
    error_map: () => ({ message: "الحالة يجب أن تكون 'تم' أو 'لم يتم'" }) 
  }),
})

const updateSchema = createSchema.partial()

/* ============================= */
/* 🔍 التحقق من التكرار */
/* ============================= */

async function checkDuplicate(
  beneficiaryId: string,
  institutionId: string,
  excludeId?: string
) {
  const existing = await prisma.contact.findFirst({
    where: {
      beneficiaryId,
      institutionId,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  })
  return !!existing
}

/* ============================= */
/* 📥 GET - جلب كافة البيانات */
/* ============================= */

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { id: 'desc' },
      include: {
        beneficiary: { select: { id: true, name: true } }, // جلب بيانات محددة لتحسين الأداء
        institution: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(contacts.map(formatContact))
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطأ داخلي في الخادم' },
      { status: 500 }
    )
  }
}

/* ============================= */
/* ➕ POST - إضافة تواصل جديد */
/* ============================= */

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json())

    if (await checkDuplicate(body.beneficiaryId, body.institutionId)) {
      return NextResponse.json(
        {
          message: 'هذا المستفيد مسجل بالفعل لدى هذه المؤسسة',
          fieldErrors: { beneficiaryId: 'مكرر', institutionId: 'مكرر' },
        },
        { status: 409 }
      )
    }

    const created = await prisma.contact.create({
      data: {
        beneficiaryId: body.beneficiaryId,
        institutionId: body.institutionId,
        status: toDbStatus(body.status),
      },
      include: { beneficiary: true, institution: true },
    })

    return NextResponse.json(formatContact(created), { status: 201 })
  } catch (e) {
    return handleApiError(e)
  }
}

/* ============================= */
/* ✏️ PUT - تحديث تواصل */
/* ============================= */

export async function PUT(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ message: 'المعرّف مطلوب' }, { status: 400 })

  try {
    const body = updateSchema.parse(await req.json())
    
    const existing = await prisma.contact.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ message: 'غير موجود' }, { status: 404 })

    // التحقق من التكرار في حالة تغيير المعرفات
    const bId = body.beneficiaryId ?? existing.beneficiaryId
    const iId = body.institutionId ?? existing.institutionId

    if (await checkDuplicate(bId, iId, id)) {
      return NextResponse.json(
        { message: 'توجد بيانات مطابقة مسجلة مسبقاً', fieldErrors: { beneficiaryId: 'مكرر' } },
        { status: 409 }
      )
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        ...body,
        status: body.status ? toDbStatus(body.status) : undefined,
      },
      include: { beneficiary: true, institution: true },
    })

    return NextResponse.json(formatContact(updated))
  } catch (e) {
    return handleApiError(e)
  }
}

/* ============================= */
/* 🗑️ DELETE - حذف */
/* ============================= */

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const all = req.nextUrl.searchParams.get('all')

  try {
    if (all === 'true') {
      await prisma.contact.deleteMany()
      return NextResponse.json({ ok: true, message: 'تم مسح الكل' })
    }

    if (!id) return NextResponse.json({ message: 'المعرّف مطلوب' }, { status: 400 })

    await prisma.contact.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ message: 'فشل الحذف أو العنصر غير موجود' }, { status: 500 })
  }
}

/* ============================= */
/* 🛠️ موحد معالجة الأخطاء */
/* ============================= */

function handleApiError(e: any) {
  if (e instanceof z.ZodError) {
    const fieldErrors: any = {}
    e.issues.forEach((i) => { fieldErrors[i.path[0]] = i.message })
    return NextResponse.json({ message: 'خطأ في البيانات المرسلة', fieldErrors }, { status: 400 })
  }
  return NextResponse.json({ message: 'خطأ في الخادم' }, { status: 500 })
}