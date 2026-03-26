import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma, DistributionStatus } from '@prisma/client'

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

type CreateRequestAidBody = {
  fullName?: unknown
  nationalId?: unknown
  phone?: unknown
  aidType?: unknown
  familyCount?: unknown
  address?: unknown
  notes?: unknown
}

const ARABIC_NAME_REGEX = /^[\u0600-\u06FF\s]+$/
const PHONE_REGEX = /^(056|059)\d{7}$/
const NATIONAL_ID_REGEX = /^\d{9}$/
const REPEATED_DIGITS_REGEX = /^(\d)\1+$/
const FAMILY_REGEX = /^\d{1,2}$/

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 100
const ADDRESS_MAX_LENGTH = 200
const NOTES_MAX_LENGTH = 1000

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const nationalId = searchParams.get('nationalId')

    const where: Prisma.RequestAidWhereInput = {}

    if (
      status &&
      Object.values(DistributionStatus).includes(status as DistributionStatus)
    ) {
      where.status = status as DistributionStatus
    }

    if (nationalId) {
      where.nationalId = nationalId
    }

    const requests = await prisma.requestAid.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(
      {
        success: true,
        count: requests.length,
        data: requests,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET /api/project/users/requestAid error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'فشل في جلب طلبات المساعدة',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateRequestAidBody

    const {
      fullName,
      nationalId,
      phone,
      aidType,
      familyCount,
      address,
      notes,
    } = body

    if (typeof fullName !== 'string') {
      return NextResponse.json(
        { success: false, message: 'الاسم الكامل مطلوب' },
        { status: 400 }
      )
    }

    const normalizedFullName = normalizeSpaces(fullName)

    if (!normalizedFullName) {
      return NextResponse.json(
        { success: false, message: 'الاسم الكامل مطلوب' },
        { status: 400 }
      )
    }

    if (normalizedFullName.length < NAME_MIN_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `الاسم الكامل يجب أن يكون على الأقل ${NAME_MIN_LENGTH} أحرف`,
        },
        { status: 400 }
      )
    }

    if (normalizedFullName.length > NAME_MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `الاسم الكامل يجب ألا يزيد عن ${NAME_MAX_LENGTH} حرفًا`,
        },
        { status: 400 }
      )
    }

    if (!ARABIC_NAME_REGEX.test(normalizedFullName)) {
      return NextResponse.json(
        {
          success: false,
          message: 'الاسم الكامل يجب أن يكون باللغة العربية فقط',
        },
        { status: 400 }
      )
    }

    if (/\s{2,}/.test(fullName)) {
      return NextResponse.json(
        {
          success: false,
          message: 'لا يمكن وضع أكثر من مسافة بين الكلمات',
        },
        { status: 400 }
      )
    }

    if (typeof nationalId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'رقم الهوية مطلوب' },
        { status: 400 }
      )
    }

    if (!/^\d+$/.test(nationalId)) {
      return NextResponse.json(
        { success: false, message: 'رقم الهوية يجب أن يحتوي على أرقام فقط' },
        { status: 400 }
      )
    }

    if (!NATIONAL_ID_REGEX.test(nationalId)) {
      return NextResponse.json(
        { success: false, message: 'رقم الهوية يجب أن يحتوي على 9 أرقام' },
        { status: 400 }
      )
    }

    if (nationalId === '000000000' || REPEATED_DIGITS_REGEX.test(nationalId)) {
      return NextResponse.json(
        { success: false, message: 'رقم الهوية غير صالح' },
        { status: 400 }
      )
    }

    if (typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف مطلوب' },
        { status: 400 }
      )
    }

    if (!/^\d+$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف يجب أن يحتوي على أرقام فقط' },
        { status: 400 }
      )
    }

    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          message: 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام',
        },
        { status: 400 }
      )
    }

    if (typeof aidType !== 'string' || !aidType.trim()) {
      return NextResponse.json(
        { success: false, message: 'نوع المساعدة مطلوب' },
        { status: 400 }
      )
    }

    const allowedAidTypes = ['food', 'medical', 'financial', 'shelter']

    if (!allowedAidTypes.includes(aidType.trim())) {
      return NextResponse.json(
        { success: false, message: 'نوع المساعدة غير صالح' },
        { status: 400 }
      )
    }

    const familyAsString =
      typeof familyCount === 'number'
        ? String(familyCount)
        : typeof familyCount === 'string'
          ? familyCount
          : ''

    if (!familyAsString) {
      return NextResponse.json(
        { success: false, message: 'عدد أفراد الأسرة مطلوب' },
        { status: 400 }
      )
    }

    if (!/^\d+$/.test(familyAsString)) {
      return NextResponse.json(
        {
          success: false,
          message: 'عدد أفراد الأسرة يجب أن يحتوي على أرقام فقط',
        },
        { status: 400 }
      )
    }

    if (!FAMILY_REGEX.test(familyAsString)) {
      return NextResponse.json(
        {
          success: false,
          message: 'عدد أفراد الأسرة يجب أن يكون من رقم أو رقمين فقط',
        },
        { status: 400 }
      )
    }

    const parsedFamilyCount = Number(familyAsString)

    if (!Number.isInteger(parsedFamilyCount) || parsedFamilyCount < 1) {
      return NextResponse.json(
        { success: false, message: 'عدد أفراد الأسرة غير صالح' },
        { status: 400 }
      )
    }

    if (parsedFamilyCount > 20) {
      return NextResponse.json(
        {
          success: false,
          message: 'عدد أفراد الأسرة يجب أن يكون بين 1 و 20',
        },
        { status: 400 }
      )
    }

    if (typeof address !== 'string') {
      return NextResponse.json(
        { success: false, message: 'العنوان مطلوب' },
        { status: 400 }
      )
    }

    const normalizedAddress = normalizeSpaces(address)

    if (!normalizedAddress) {
      return NextResponse.json(
        { success: false, message: 'العنوان مطلوب' },
        { status: 400 }
      )
    }

    if (normalizedAddress.length > ADDRESS_MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `العنوان يجب ألا يزيد عن ${ADDRESS_MAX_LENGTH} حرفًا`,
        },
        { status: 400 }
      )
    }

    const parsedNotes = parseOptionalText(notes, NOTES_MAX_LENGTH)
    if (parsedNotes === 'INVALID') {
      return NextResponse.json(
        { success: false, message: 'الملاحظات غير صالحة' },
        { status: 400 }
      )
    }

    const existingRequest = await prisma.requestAid.findFirst({
      where: {
        OR: [{ nationalId }, { phone }],
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          message: 'يوجد طلب سابق بنفس رقم الهوية أو رقم الهاتف',
        },
        { status: 409 }
      )
    }

    const now = new Date()

    const newRequest = await prisma.requestAid.create({
      data: {
        fullName: normalizedFullName,
        nationalId,
        phone,
        aidType: aidType.trim(),
        familyCount: parsedFamilyCount,
        address: normalizedAddress,
        notes: parsedNotes,
        status: DistributionStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'تم إرسال طلب المساعدة بنجاح',
        data: newRequest,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/project/requestAid error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'فشل في إرسال طلب المساعدة',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}