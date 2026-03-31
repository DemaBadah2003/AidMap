import {NextRequest, NextResponse} from 'next/server'
import {PrismaClient, GeneralStatus} from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

type ArabicStatus = 'نشط' | 'موقوف'

type SupervisorBody = {
  nameAr?: string
  phone?: string
  status?: ArabicStatus
}

const normalizePhone = (value: string) => value.replace(/[^\d+]/g, '').trim()

const toArabicStatus = (status: GeneralStatus): ArabicStatus => {
  return status === GeneralStatus.ACTIVE ? 'نشط' : 'موقوف'
}

const toPrismaStatus = (status?: ArabicStatus): GeneralStatus => {
  return status === 'نشط' ? GeneralStatus.ACTIVE : GeneralStatus.INACTIVE
}

const mapSupervisor = (item: {
  id: string
  name: string
  phone: string | null
  status: GeneralStatus
}) => ({
  id: item.id,
  nameAr: item.name,
  phone: item.phone ?? '',
  status: toArabicStatus(item.status),
})

export async function GET(req: NextRequest) {
  try {
    const {searchParams} = new URL(req.url)

    const id = searchParams.get('id')
    const q = searchParams.get('q')?.trim() || ''
    const status = searchParams.get('status') || 'all'

    if (id) {
      const item = await prisma.supervisor.findFirst({
        where: {
          id,
          isTrashed: false,
        },
      })

      if (!item) {
        return NextResponse.json({message: 'المشرف غير موجود'}, {status: 404})
      }

      return NextResponse.json(mapSupervisor(item), {status: 200})
    }

    const items = await prisma.supervisor.findMany({
      where: {
        isTrashed: false,
        ...(q
          ? {
              OR: [
                {id: {contains: q}},
                {name: {contains: q, mode: 'insensitive'}},
                {phone: {contains: q}},
              ],
            }
          : {}),
        ...(status === 'active'
          ? {status: GeneralStatus.ACTIVE}
          : status === 'blocked'
            ? {status: GeneralStatus.INACTIVE}
            : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(items.map(mapSupervisor), {status: 200})
  } catch (error) {
    console.error('GET /api/project/projects/supervisor error:', error)
    return NextResponse.json({message: 'حدث خطأ أثناء جلب البيانات'}, {status: 500})
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SupervisorBody

    const name = body.nameAr?.trim()
    const phone = body.phone ? normalizePhone(body.phone) : null
    const status = toPrismaStatus(body.status)

    if (!name) {
      return NextResponse.json({message: 'اسم المشرف مطلوب'}, {status: 400})
    }

    if (!phone) {
      return NextResponse.json({message: 'رقم الجوال مطلوب'}, {status: 400})
    }

    const created = await prisma.supervisor.create({
      data: {
        name,
        phone,
        status,
      },
    })

    return NextResponse.json(mapSupervisor(created), {status: 201})
  } catch (error) {
    console.error('POST /api/project/projects/supervisor error:', error)
    return NextResponse.json({message: 'حدث خطأ أثناء إضافة المشرف'}, {status: 500})
  }
}

export async function PUT(req: NextRequest) {
  try {
    const {searchParams} = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({message: 'id مطلوب'}, {status: 400})
    }

    const body = (await req.json()) as SupervisorBody

    const found = await prisma.supervisor.findFirst({
      where: {
        id,
        isTrashed: false,
      },
    })

    if (!found) {
      return NextResponse.json({message: 'المشرف غير موجود'}, {status: 404})
    }

    if (found.isProtected) {
      return NextResponse.json({message: 'لا يمكن تعديل هذا المشرف لأنه محمي'}, {status: 403})
    }

    const trimmedName = body.nameAr?.trim()
    const normalizedPhone = body.phone !== undefined ? normalizePhone(body.phone) : undefined

    if (body.nameAr !== undefined && !trimmedName) {
      return NextResponse.json({message: 'اسم المشرف مطلوب'}, {status: 400})
    }

    if (body.phone !== undefined && !normalizedPhone) {
      return NextResponse.json({message: 'رقم الجوال مطلوب'}, {status: 400})
    }

    const updated = await prisma.supervisor.update({
      where: {id},
      data: {
        ...(trimmedName !== undefined ? {name: trimmedName} : {}),
        ...(normalizedPhone !== undefined ? {phone: normalizedPhone} : {}),
        ...(body.status !== undefined ? {status: toPrismaStatus(body.status)} : {}),
      },
    })

    return NextResponse.json(mapSupervisor(updated), {status: 200})
  } catch (error) {
    console.error('PUT /api/project/projects/supervisor error:', error)
    return NextResponse.json({message: 'حدث خطأ أثناء تعديل المشرف'}, {status: 500})
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const {searchParams} = new URL(req.url)
    const id = searchParams.get('id')
    const all = searchParams.get('all')

    if (all === 'true') {
      await prisma.supervisor.updateMany({
        where: {
          isTrashed: false,
          isProtected: false,
        },
        data: {
          isTrashed: true,
        },
      })

      return NextResponse.json({message: 'تم حذف جميع المشرفين'}, {status: 200})
    }

    if (!id) {
      return NextResponse.json({message: 'يجب إرسال id أو all=true'}, {status: 400})
    }

    const found = await prisma.supervisor.findFirst({
      where: {
        id,
        isTrashed: false,
      },
    })

    if (!found) {
      return NextResponse.json({message: 'المشرف غير موجود'}, {status: 404})
    }

    if (found.isProtected) {
      return NextResponse.json({message: 'لا يمكن حذف هذا المشرف لأنه محمي'}, {status: 403})
    }

    await prisma.supervisor.update({
      where: {id},
      data: {
        isTrashed: true,
      },
    })

    return NextResponse.json({message: 'تم حذف المشرف بنجاح'}, {status: 200})
  } catch (error) {
    console.error('DELETE /api/project/projects/supervisor error:', error)
    return NextResponse.json({message: 'حدث خطأ أثناء الحذف'}, {status: 500})
  }
}