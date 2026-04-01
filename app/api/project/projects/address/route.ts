import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

const createSchema = z.object({
  governorate: z.string().trim().min(1, 'المحافظة مطلوبة'),
  city: z.string().trim().min(1, 'المدينة مطلوبة'),
  campId: z.string().uuid('معرّف المخيم غير صالح'),
})

const updateSchema = z
  .object({
    governorate: z.string().trim().min(1, 'المحافظة مطلوبة').optional(),
    city: z.string().trim().min(1, 'المدينة مطلوبة').optional(),
    campId: z.string().uuid('معرّف المخيم غير صالح').optional(),
  })
  .strict()

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

type AddressInput = {
  governorate: string
  city: string
  campId: string
}

async function readAddresses() {
  return prisma.address.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      camp: true,
    },
  })
}

function findDuplicateAddress(
  addresses: Array<{
    id: string
    governorate: string | null
    city: string | null
    campId: string | null
  }>,
  input: AddressInput,
  excludeId?: string
) {
  const normalizedGovernorate = normalizeText(input.governorate)
  const normalizedCity = normalizeText(input.city)
  const normalizedCampId = input.campId.trim()

  const duplicate = addresses.find(
    (a) =>
      a.id !== excludeId &&
      normalizeText(a.governorate ?? '') === normalizedGovernorate &&
      normalizeText(a.city ?? '') === normalizedCity &&
      (a.campId ?? '') === normalizedCampId
  )

  if (duplicate) {
    return 'العنوان موجود بالفعل (بيانات مكررة).'
  }

  return ''
}

async function assertAddressBusinessValidation(
  input: AddressInput,
  excludeId?: string
) {
  const normalizedGovernorate = normalizeText(input.governorate)
  const normalizedCity = normalizeText(input.city)
  const normalizedCampId = input.campId.trim()

  if (!normalizedGovernorate) {
    throw new Error('المحافظة مطلوبة')
  }

  if (!normalizedCity) {
    throw new Error('المدينة مطلوبة')
  }

  if (!normalizedCampId) {
    throw new Error('المخيم مطلوب')
  }

  const campExists = await prisma.camps.findUnique({
    where: { id: normalizedCampId },
    select: { id: true },
  })

  if (!campExists) {
    throw new Error('المخيم المحدد غير موجود')
  }

  const current = await readAddresses()
  const duplicateMessage = findDuplicateAddress(current, input, excludeId)

  if (duplicateMessage) {
    throw new Error(duplicateMessage)
  }
}

export async function GET(req: NextRequest) {
  try {
    const campId = req.nextUrl.searchParams.get('campId')

    const addresses = await prisma.address.findMany({
      where: campId ? { campId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        camp: true,
      },
    })

    return NextResponse.json(addresses)
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

    await assertAddressBusinessValidation({
      governorate: body.governorate,
      city: body.city,
      campId: body.campId,
    })

    const created = await prisma.address.create({
      data: {
        governorate: body.governorate,
        city: body.city,
        campId: body.campId,
      },
      include: {
        camp: true,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: e.issues[0]?.message ?? 'فشل التحقق من صحة البيانات',
          issues: e.issues,
        },
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
    return NextResponse.json(
      { message: 'معرّف العنوان مفقود' },
      { status: 400 }
    )
  }

  try {
    const body = updateSchema.parse(await req.json())

    const currentAddress = await prisma.address.findUnique({
      where: { id },
      select: {
        id: true,
        governorate: true,
        city: true,
        campId: true,
      },
    })

    if (!currentAddress) {
      return NextResponse.json(
        { message: 'العنوان غير موجود' },
        { status: 404 }
      )
    }

    const merged = {
      governorate: body.governorate ?? currentAddress.governorate ?? '',
      city: body.city ?? currentAddress.city ?? '',
      campId: body.campId ?? currentAddress.campId ?? '',
    }

    await assertAddressBusinessValidation(merged, id)

    const updated = await prisma.address.update({
      where: { id },
      data: {
        governorate: body.governorate,
        city: body.city,
        campId: body.campId,
      },
      include: {
        camp: true,
      },
    })

    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: e.issues[0]?.message ?? 'فشل التحقق من صحة البيانات',
          issues: e.issues,
        },
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
      await prisma.address.deleteMany()
      return NextResponse.json({ ok: true })
    }

    if (!id) {
      return NextResponse.json(
        { message: 'معرّف العنوان مفقود' },
        { status: 400 }
      )
    }

    await prisma.address.delete({
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