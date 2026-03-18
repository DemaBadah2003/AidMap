import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireCitizenApi } from '../helpers/api-guards'

const nationalIdRegex = /^\d{9}$/
const repeatedDigitsRegex = /^(\d)\1+$/

function validateNationalId(value: string) {
  if (!value) return 'رقم الهوية مطلوب'
  if (!/^\d+$/.test(value)) return 'رقم الهوية يجب أن يحتوي على أرقام فقط'
  if (!nationalIdRegex.test(value)) return 'رقم الهوية يجب أن يحتوي على 9 أرقام'
  if (value === '000000000') return 'رقم الهوية غير صالح'
  if (repeatedDigitsRegex.test(value)) return 'رقم الهوية غير صالح'
  return ''
}

export async function GET(req: NextRequest) {
  const unauthorized = requireCitizenApi(req)
  if (unauthorized) return unauthorized

  try {
    const nationalId = req.nextUrl.searchParams.get('nationalId')?.trim() || ''

    const validationError = validateNationalId(nationalId)
    if (validationError) {
      return NextResponse.json(
        { message: validationError },
        { status: 400 }
      )
    }

    const aidRequest = await prisma.requestAid.findFirst({
      where: {
        nationalId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!aidRequest) {
      return NextResponse.json({
        found: false,
      })
    }

    return NextResponse.json({
      found: true,
      beneficiaryName: aidRequest.fullName,
      nationalId: aidRequest.nationalId,
      phone: aidRequest.phone,
      aidType: aidRequest.aidType,
      numberOfFamily: aidRequest.familyCount,
      address: aidRequest.address,
      notes: aidRequest.notes,
      status: aidRequest.status,
      requestNumber: aidRequest.requestNumber,
      distributionDate: null,
      pickupLocation: null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'حدث خطأ في الخادم',
      },
      { status: 500 }
    )
  }
}