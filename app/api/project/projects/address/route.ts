import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

const createSchema = z.object({
  governorate: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  campId: z.string().uuid().optional().nullable(),
})

const updateSchema = z.object({
  governorate: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  campId: z.string().uuid().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const campId = req.nextUrl.searchParams.get('campId')

    const addresses = await prisma.address.findMany({
      where: campId
        ? {
            campId,
          }
        : undefined,
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

    if (body.campId) {
      const campExists = await prisma.camps.findUnique({
        where: { id: body.campId },
        select: { id: true },
      })

      if (!campExists) {
        return NextResponse.json(
          { message: 'المخيم المحدد غير موجود' },
          { status: 400 }
        )
      }
    }

    const exists = await prisma.address.findFirst({
      where: {
        governorate: body.governorate || null,
        city: body.city || null,
        campId: body.campId || null,
      },
      select: { id: true },
    })

    if (exists) {
      return NextResponse.json(
        { message: 'العنوان موجود بالفعل (بيانات مكررة).' },
        { status: 409 }
      )
    }

    const created = await prisma.address.create({
      data: {
        governorate: body.governorate || null,
        city: body.city || null,
        campId: body.campId || null,
      },
      include: {
        camp: true,
      },
    })

    return NextResponse.json(created, { status: 201 })
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

    const nextGovernorate =
      body.governorate !== undefined ? body.governorate || null : currentAddress.governorate

    const nextCity =
      body.city !== undefined ? body.city || null : currentAddress.city

    const nextCampId =
      body.campId !== undefined ? body.campId || null : currentAddress.campId

    if (nextCampId) {
      const campExists = await prisma.camps.findUnique({
        where: { id: nextCampId },
        select: { id: true },
      })

      if (!campExists) {
        return NextResponse.json(
          { message: 'المخيم المحدد غير موجود' },
          { status: 400 }
        )
      }
    }

    const exists = await prisma.address.findFirst({
      where: {
        NOT: { id },
        governorate: nextGovernorate,
        city: nextCity,
        campId: nextCampId,
      },
      select: { id: true },
    })

    if (exists) {
      return NextResponse.json(
        { message: 'العنوان موجود بالفعل (بيانات مكررة).' },
        { status: 409 }
      )
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        governorate: body.governorate !== undefined ? body.governorate || null : undefined,
        city: body.city !== undefined ? body.city || null : undefined,
        campId: body.campId !== undefined ? body.campId || null : undefined,
      },
      include: {
        camp: true,
      },
    })

    return NextResponse.json(updated)
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