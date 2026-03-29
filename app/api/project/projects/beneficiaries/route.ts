import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BeneficiaryPriority } from '@prisma/client'
import prisma from '@/lib/prisma'

function toDbPriority(priority: 'مستعجل' | 'عادي' | 'حرج'): BeneficiaryPriority {
  if (priority === 'مستعجل') return BeneficiaryPriority.URGENT
  if (priority === 'حرج') return BeneficiaryPriority.IMPORTANT
  return BeneficiaryPriority.NORMAL
}

function fromDbPriority(priority: BeneficiaryPriority): 'مستعجل' | 'عادي' | 'حرج' {
  if (priority === BeneficiaryPriority.URGENT) return 'مستعجل'
  if (priority === BeneficiaryPriority.IMPORTANT) return 'حرج'
  return 'عادي'
}

const createSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم المستفيد مطلوب'),
  phone: z.string().trim().min(1, 'رقم الهاتف مطلوب'),
  familyCount: z.coerce.number().int().positive('يجب أن يكون عدد أفراد الأسرة أكبر من 0'),
  campId: z.string().trim().min(1, 'معرّف المخيم مطلوب'),
  priority: z.enum(['مستعجل', 'عادي', 'حرج']).default('عادي'),
})

const updateSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم المستفيد مطلوب').optional(),
  phone: z.string().trim().min(1, 'رقم الهاتف مطلوب').optional(),
  familyCount: z.coerce.number().int().positive('يجب أن يكون عدد أفراد الأسرة أكبر من 0').optional(),
  campId: z.string().trim().min(1, 'معرّف المخيم مطلوب').optional(),
  priority: z.enum(['مستعجل', 'عادي', 'حرج']).optional(),
})

export async function GET() {
  try {
    const beneficiaries = await prisma.beneficiary.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        numberOfFamily: true,
        campId: true,
        priority: true,
        camp: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(
      beneficiaries.map((b) => ({
        id: b.id,
        nameAr: b.name,
        phone: b.phone,
        familyCount: b.numberOfFamily,
        campId: b.campId ?? '',
        campName: b.camp?.name ?? '',
        priority: fromDbPriority(b.priority),
      }))
    )
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json())

    const existingCamp = await prisma.camps.findUnique({
      where: { id: body.campId },
      select: { id: true, name: true },
    })

    if (!existingCamp) {
      return NextResponse.json(
        { message: 'المخيم المحدد غير موجود' },
        { status: 404 }
      )
    }

    const duplicatePhone = await prisma.beneficiary.findFirst({
      where: {
        phone: body.phone,
      },
      select: { id: true },
    })

    if (duplicatePhone) {
      return NextResponse.json(
        { message: 'رقم الهاتف مستخدم بالفعل لمستفيد آخر.' },
        { status: 409 }
      )
    }

    const created = await prisma.beneficiary.create({
      data: {
        name: body.nameAr,
        phone: body.phone,
        numberOfFamily: body.familyCount,
        campId: body.campId,
        priority: toDbPriority(body.priority),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        numberOfFamily: true,
        campId: true,
        priority: true,
        camp: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        id: created.id,
        nameAr: created.name,
        phone: created.phone,
        familyCount: created.numberOfFamily,
        campId: created.campId ?? '',
        campName: created.camp?.name ?? '',
        priority: fromDbPriority(created.priority),
      },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'فشل التحقق من صحة البيانات', issues: e.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ message: 'معرّف المستفيد مفقود' }, { status: 400 })
  }

  try {
    const body = updateSchema.parse(await req.json())

    if (body.phone) {
      const duplicatePhone = await prisma.beneficiary.findFirst({
        where: {
          phone: body.phone,
          NOT: { id },
        },
        select: { id: true },
      })

      if (duplicatePhone) {
        return NextResponse.json(
          { message: 'رقم الهاتف مستخدم بالفعل لمستفيد آخر.' },
          { status: 409 }
        )
      }
    }

    if (body.campId) {
      const existingCamp = await prisma.camps.findUnique({
        where: { id: body.campId },
        select: { id: true },
      })

      if (!existingCamp) {
        return NextResponse.json(
          { message: 'المخيم المحدد غير موجود' },
          { status: 404 }
        )
      }
    }

    const updated = await prisma.beneficiary.update({
      where: { id },
      data: {
        name: body.nameAr,
        phone: body.phone,
        numberOfFamily: body.familyCount,
        campId: body.campId,
        priority: body.priority ? toDbPriority(body.priority) : undefined,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        numberOfFamily: true,
        campId: true,
        priority: true,
        camp: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: updated.id,
      nameAr: updated.name,
      phone: updated.phone,
      familyCount: updated.numberOfFamily,
      campId: updated.campId ?? '',
      campName: updated.camp?.name ?? '',
      priority: fromDbPriority(updated.priority),
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'فشل التحقق من صحة البيانات', issues: e.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const all = req.nextUrl.searchParams.get('all')

  try {
    if (all === 'true') {
      await prisma.beneficiary.deleteMany()
      return NextResponse.json({ ok: true })
    }

    if (!id) {
      return NextResponse.json({ message: 'معرّف المستفيد مفقود' }, { status: 400 })
    }

    await prisma.beneficiary.delete({
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