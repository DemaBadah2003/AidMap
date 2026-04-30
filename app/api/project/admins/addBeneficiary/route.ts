import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'

// إعداد Prisma Client
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

// تعريف أنواع البيانات المتوقعة بناءً على موديل Citizens
type CreateCitizenBody = {
  name?: unknown
  phone?: unknown
  numberOfFamily?: unknown
  campId?: unknown
}

const ARABIC_NAME_REGEX = /^[\u0600-\u06FF\s]+$/
const PHONE_REGEX = /^(056|059)\d{7}$/
const FAMILY_REGEX = /^\d{1,2}$/
const NAME_MIN_LENGTH = 2
const MAX_CAMP_LENGTH = 100

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function parseOptionalText(value: unknown, maxLength: number): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return null
  const normalized = normalizeSpaces(value)
  return normalized.length <= maxLength ? normalized : null
}

/**
 * GET: جلب جميع المواطنين (المستفيدين)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campId = searchParams.get('campId')

    const where: Prisma.CitizensWhereInput = {
      isTrashed: false // جلب غير المحذوفين فقط بناءً على السكيما
    }
    
    if (campId) {
      where.campId = campId
    }

    const citizens = await prisma.citizens.findMany({
      where,
      include: {
        camp: true, // تضمين بيانات المخيم
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(
      { success: true, count: citizens.length, data: citizens },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ success: false, message: 'فشل في جلب البيانات' }, { status: 500 })
  }
}

/**
 * POST: تسجيل مواطن (مستفيد) جديد
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateCitizenBody
    const { name, phone, numberOfFamily, campId } = body

    // 1. التحقق من الاسم
    if (typeof name !== 'string') {
      return NextResponse.json({ success: false, message: 'الاسم مطلوب' }, { status: 400 })
    }
    const normalizedName = normalizeSpaces(name)
    if (normalizedName.length < NAME_MIN_LENGTH || !ARABIC_NAME_REGEX.test(normalizedName)) {
      return NextResponse.json({ success: false, message: 'الاسم يجب أن يكون بالعربية' }, { status: 400 })
    }

    // 2. التحقق من الهاتف
    if (typeof phone !== 'string' || !PHONE_REGEX.test(phone)) {
      return NextResponse.json({ success: false, message: 'رقم الهاتف غير صالح' }, { status: 400 })
    }

    // 3. التحقق من عدد أفراد الأسرة
    const familyValue = typeof numberOfFamily === 'number' ? String(numberOfFamily) : (numberOfFamily as string)
    if (!familyValue || !FAMILY_REGEX.test(familyValue)) {
      return NextResponse.json({ success: false, message: 'عدد أفراد الأسرة غير صالح' }, { status: 400 })
    }

    // 4. منع تكرار الهاتف (Unique Constraint في السكيما)
    const existingCitizen = await prisma.citizens.findUnique({
      where: { phone },
    })

    if (existingCitizen) {
      return NextResponse.json({ success: false, message: 'رقم الهاتف مسجل مسبقاً' }, { status: 409 })
    }

    // 5. محاولة ربط المخيم
    let resolvedCampId: string | null = null
    const campInput = parseOptionalText(campId, MAX_CAMP_LENGTH)
    
    if (campInput) {
      const existingCamp = await prisma.camps.findFirst({
        where: {
          OR: [
            { id: campInput },
            { name: campInput }
          ],
        },
      })
      if (existingCamp) resolvedCampId = existingCamp.id
    }

    // 6. إنشاء السجل في جدول Citizens
    const newCitizen = await prisma.citizens.create({
      data: {
        name: normalizedName,
        phone,
        numberOfFamily: Number(familyValue),
        campId: resolvedCampId,
        role: "CITIZEN", // القيمة الافتراضية في السكيما
        isActive: true,
        priority: "NORMAL"
      },
      include: {
        camp: true,
      },
    })

    return NextResponse.json(
      { success: true, message: 'تم تسجيل البيانات بنجاح', data: newCitizen },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST Error Detailed:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'حدث خطأ أثناء حفظ البيانات',
        error: error instanceof Error ? error.message : 'Unknown DB Error'
      },
      { status: 500 }
    )
  }
}