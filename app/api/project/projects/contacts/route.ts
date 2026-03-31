import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

/* ============================= */
/* 🔁 تحويل الحالة */
/* ============================= */

function toDbStatus(status: 'تم' | 'لم يتم') {
  return status === 'تم' ? 'DONE' : 'NOT_DONE'
}

function fromDbStatus(status: 'DONE' | 'NOT_DONE') {
  return status === 'DONE' ? 'تم' : 'لم يتم'
}

/* ============================= */
/* 🧾 Schemas */
/* ============================= */

const createSchema = z.object({
  beneficiaryId: z.string().trim().min(1, 'معرّف المستفيد مطلوب'),
  institutionId: z.string().trim().min(1, 'معرّف المؤسسة مطلوب'),
  status: z.enum(['تم', 'لم يتم']),
})

const updateSchema = z.object({
  beneficiaryId: z.string().trim().min(1).optional(),
  institutionId: z.string().trim().min(1).optional(),
  status: z.enum(['تم', 'لم يتم']).optional(),
})

/* ============================= */
/* 🔍 Helper: duplicate check */
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
/* 📥 GET */
/* ============================= */

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { id: 'desc' },
      include: {
        beneficiary: true,
        institution: true,
      },
    })

    return NextResponse.json(
      contacts.map((c) => ({
        ...c,
        status: fromDbStatus(c.status),
      }))
    )
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

/* ============================= */
/* ➕ POST */
/* ============================= */

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json())

    // duplicate check
    const isDuplicate = await checkDuplicate(
      body.beneficiaryId,
      body.institutionId
    )

    if (isDuplicate) {
      return NextResponse.json(
        {
          message: 'البيانات مكررة',
          fieldErrors: {
            beneficiaryId: 'مكرر',
            institutionId: 'مكرر',
          },
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
      include: {
        beneficiary: true,
        institution: true,
      },
    })

    return NextResponse.json(
      {
        ...created,
        status: fromDbStatus(created.status),
      },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof z.ZodError) {
      const fieldErrors: any = {}
      e.issues.forEach((i) => {
        fieldErrors[i.path[0]] = i.message
      })

      return NextResponse.json(
        { message: 'فشل التحقق', fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

/* ============================= */
/* ✏️ PUT */
/* ============================= */

export async function PUT(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { message: 'معرّف التواصل مفقود' },
      { status: 400 }
    )
  }

  try {
    const body = updateSchema.parse(await req.json())

    const existing = await prisma.contact.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { message: 'التواصل غير موجود' },
        { status: 404 }
      )
    }

    const beneficiaryId = body.beneficiaryId ?? existing.beneficiaryId
    const institutionId = body.institutionId ?? existing.institutionId

    // duplicate check
    const isDuplicate = await checkDuplicate(
      beneficiaryId,
      institutionId,
      id
    )

    if (isDuplicate) {
      return NextResponse.json(
        {
          message: 'البيانات مكررة',
          fieldErrors: {
            beneficiaryId: 'مكرر',
            institutionId: 'مكرر',
          },
        },
        { status: 409 }
      )
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        beneficiaryId: body.beneficiaryId,
        institutionId: body.institutionId,
        status: body.status ? toDbStatus(body.status) : undefined,
      },
      include: {
        beneficiary: true,
        institution: true,
      },
    })

    return NextResponse.json({
      ...updated,
      status: fromDbStatus(updated.status),
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      const fieldErrors: any = {}
      e.issues.forEach((i) => {
        fieldErrors[i.path[0]] = i.message
      })

      return NextResponse.json(
        { message: 'فشل التحقق', fieldErrors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

/* ============================= */
/* 🗑️ DELETE */
/* ============================= */

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const all = req.nextUrl.searchParams.get('all')

  try {
    if (all === 'true') {
      await prisma.contact.deleteMany()
      return NextResponse.json({ ok: true })
    }

    if (!id) {
      return NextResponse.json(
        { message: 'معرّف التواصل مفقود' },
        { status: 400 }
      )
    }

    await prisma.contact.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}