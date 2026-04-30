import { NextResponse } from 'next/server'
import  prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const students = await prisma.student.findMany({
      where: { isTrashed: false, OR: [{ name: { contains: q } }, { nationalId: { contains: q } }] },
      orderBy: { createdAt: 'desc' },
    })
    const formatted = students.map((s) => ({
      id: s.id, studentName: s.name, nationalId: s.nationalId, gradeLevel: s.level,
      birthDate: s.birthDate.toISOString().split('T')[0], parentName: s.guardianName, parentPhone: s.guardianPhone,
    }))
    return NextResponse.json(formatted)
  } catch (err) { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const b = await request.json()
    const s = await prisma.student.create({
      data: { name: b.studentName, nationalId: b.nationalId, level: b.gradeLevel, birthDate: new Date(b.birthDate), guardianName: b.parentName, guardianPhone: b.parentPhone }
    })
    return NextResponse.json(s, { status: 201 })
  } catch (err) { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const b = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    const u = await prisma.student.update({
      where: { id },
      data: { name: b.studentName, nationalId: b.nationalId, level: b.gradeLevel, birthDate: new Date(b.birthDate), guardianName: b.parentName, guardianPhone: b.parentPhone }
    })
    return NextResponse.json(u)
  } catch (err) { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}