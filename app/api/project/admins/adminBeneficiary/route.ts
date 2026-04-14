import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'
// تم إيقاف استيراد requireAdminApi لفتح الصلاحيات للجميع

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

type CreateBeneficiaryBody = {
  name?: unknown
  phone?: unknown
  numberOfFamily?: unknown
  campId?: unknown
  role?: unknown
}

const ARABIC_NAME_REGEX = /^[\u0600-\u06FF\s]+$/
const PHONE_REGEX = /^(056|059)\d{7}$/
const FAMILY_REGEX = /^\d{1,2}$/

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 100
const MAX_CAMP_LENGTH = 100

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function parseOptionalText(
  value: unknown,
  maxLength: number
): string | null | 'INVALID' {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value !== 'string') {
    return 'INVALID'
  }

  const normalized = normalizeSpaces(value)

  if (!normalized) {
    return null
  }

  if (normalized.length > maxLength) {
    return 'INVALID'
  }

  return normalized
}

// جلب المستفيدين (مفتوح للجميع حالياً)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campId = searchParams.get('campId')

    const where: Prisma.BeneficiaryWhereInput = {}

    if (campId) {
      where.campId = campId
    }

    const beneficiaries = await prisma.beneficiary.findMany({
      where,
      include: {
        camp: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(
      {
        success: true,
        count: beneficiaries.length,
        data: beneficiaries,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET /api/project/admins/adminBeneficiary error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'فشل في جلب المستفيدين',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// إضافة مستفيد جديد (تم إزالة قيود الأدمن)
export async function POST(req: NextRequest) {
  try {
    /* تم إزالة فحص الصلاحيات هنا:
       const unauthorized = await requireAdminApi(req)
       if (unauthorized) return unauthorized
    */

    const body = (await req.json()) as CreateBeneficiaryBody
    const { name, phone, numberOfFamily, campId } = body

    // 1. التحقق من الاسم
    if (typeof name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'الاسم مطلوب' },
        { status: 400 }
      )
    }

    const normalizedName = normalizeSpaces(name)

    if (!normalizedName || normalizedName.length < NAME_MIN_LENGTH) {
      return NextResponse.json(
        { success: false, message: 'الاسم غير صالح أو قصير جداً' },
        { status: 400 }
      )
    }

    if (!ARABIC_NAME_REGEX.test(normalizedName)) {
      return NextResponse.json(
        { success: false, message: 'الاسم يجب أن يكون باللغة العربية فقط' },
        { status: 400 }
      )
    }

    // 2. التحقق من رقم الهاتف
    if (typeof phone !== 'string' || !PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف غير صالح (يجب أن يبدأ بـ 056 أو 059)' },
        { status: 400 }
      )
    }

    // 3. التحقق من عدد أفراد الأسرة
    const familyAsString = typeof numberOfFamily === 'number' ? String(numberOfFamily) : (numberOfFamily as string)
    if (!familyAsString || !FAMILY_REGEX.test(familyAsString)) {
      return NextResponse.json(
        { success: false, message: 'عدد أفراد الأسرة يجب أن يكون بين 1 و 99' },
        { status: 400 }
      )
    }

    const parsedNumberOfFamily = Number(familyAsString)

    // 4. فحص التكرار (منع تسجيل نفس الهاتف مرتين)
    const existingBeneficiary = await prisma.beneficiary.findFirst({
      where: { phone },
    })

    if (existingBeneficiary) {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف مسجل مسبقًا في النظام' },
        { status: 409 }
      )
    }

    // 5. ربط المخيم إذا وجد
    let resolvedCampId: string | null = null
    const parsedCampName = parseOptionalText(campId, MAX_CAMP_LENGTH)
    
    if (parsedCampName && parsedCampName !== 'INVALID') {
      const existingCamp = await prisma.camps.findFirst({
        where: {
          OR: [{ name: parsedCampName }, { area: parsedCampName }],
        },
      })
      if (existingCamp) resolvedCampId = existingCamp.id
    }

    // 6. إنشاء السجل
    const newBeneficiary = await prisma.beneficiary.create({
      data: {
        name: normalizedName,
        phone,
        numberOfFamily: parsedNumberOfFamily,
        campId: resolvedCampId,
      },
      include: {
        camp: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'تم تسجيل بياناتك بنجاح',
        data: newBeneficiary,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء حفظ البيانات' },
      { status: 500 }
    )
  }
}