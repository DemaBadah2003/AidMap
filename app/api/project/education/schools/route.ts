import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || ''; // استقبال كلمة البحث

    const schools = await prisma.school.findMany({
      where: {
        isTrashed: false,
        OR: [
          { name: { contains: query } },
          { region: { contains: query } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedSchools = schools.map((s: any) => ({
      id: s.id,
      schoolName: s.name,
      location: s.location || '',
      area: s.region || '',
      stage: s.level || '',
      studyDays: s.studyDays || '',
      shift: s.timing || '',
      feesStatus: Number(s.fees) > 0 ? 'فى رسوم' : 'لا يوجد رسوم',
    }));

    return NextResponse.json(formattedSchools);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newSchool = await prisma.school.create({
      data: {
        name: body.schoolName,
        location: body.location,
        region: body.area,
        level: body.stage,
        studyDays: body.studyDays,
        timing: body.shift,
        fees: body.feesStatus === 'فى رسوم' ? 1.0 : 0.0,
      },
    });
    return NextResponse.json(newSchool, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const updated = await prisma.school.update({
      where: { id },
      data: {
        name: data.schoolName,
        location: data.location,
        region: data.area,
        level: data.stage,
        studyDays: data.studyDays,
        timing: data.shift,
        fees: data.feesStatus === 'فى رسوم' ? 1.0 : 0.0,
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}