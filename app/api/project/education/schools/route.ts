import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(schools);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // تأكد أن الحقول تطابق ما هو موجود في schema.prisma
    const newSchool = await prisma.school.create({
      data: {
        name: body.schoolName,
        type: body.schoolType,
        status: body.status,
        phone: body.phone || "",
        notes: body.notes || "",
      }
    });

    return NextResponse.json(newSchool, { status: 201 });
  } catch (error: any) {
    console.error("Database Error:", error.message);
    return NextResponse.json({ error: "فشل الحفظ في قاعدة البيانات" }, { status: 500 });
  }
}