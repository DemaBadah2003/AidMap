import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const camps = await prisma.Camps.findMany({
    where: { isTrashed: false },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(camps)
}

export async function POST(req: Request) {
  const body = await req.json()

  // ✅ يدعم كود الفرونت (nameAr/areaAr) + يدعم name/area
  const name = String(body?.name ?? body?.nameAr ?? '').trim()
  const areaRaw = body?.area ?? body?.areaAr
  const area = areaRaw === undefined || areaRaw === null ? null : String(areaRaw).trim()
  const capacity = body?.capacity

  // ✅ fillStatus من الفرونت (Full/Not Full) -> status enum (FULL/NOT_FULL)
  const fillStatus: 'Full' | 'Not Full' | undefined = body?.fillStatus
  const status: 'FULL' | 'NOT_FULL' =
    fillStatus === 'Full' ? 'FULL' : fillStatus === 'Not Full' ? 'NOT_FULL' : body?.status ?? 'NOT_FULL'

  if (!name || !Number.isInteger(capacity) || capacity <= 0) {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
  }

  // supervisorId إجباري بالـ schema
  // ✅ إذا ما أرسله الفرونت: بنجيب أول Supervisor موجود (حل مؤقت)
  let supervisorId: string | undefined = body?.supervisorId
  if (!supervisorId) {
    const sup = await prisma.supervisor.findFirst({
      where: { isTrashed: false },
      orderBy: { createdAt: 'asc' },
    })
    if (!sup) {
      return NextResponse.json(
        { message: 'No supervisor found. Create a supervisor first.' },
        { status: 400 }
      )
    }
    supervisorId = sup.id
  }

  const created = await prisma.camps.create({
    data: {
      name,
      area: area && area.length ? area : null,
      capacity,
      status,
      supervisorId,
    },
  })

  return NextResponse.json(created, { status: 201 })
}

// ✅ Delete all (Soft delete)
export async function DELETE() {
  await prisma.camps.updateMany({
    where: { isTrashed: false },
    data: { isTrashed: true },
  })
  return NextResponse.json({ ok: true })
}