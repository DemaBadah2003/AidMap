import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // جلب قائمة المستشفيات للقائمة المنسدلة
    if (type === 'hospitals') {
      const hospitals = await prisma.hospital.findMany({ select: { id: true, name: true } });
      return NextResponse.json(hospitals);
    }

    // جلب قائمة الأقسام لاستخدامها في التخصصات
    if (type === 'departments') {
      const departments = await prisma.department.findMany({ select: { id: true, name: true } });
      return NextResponse.json(departments);
    }

    // جلب جميع الأطباء مع بيانات المستشفى المرتبط بهم
    const doctors = await prisma.doctor.findMany({
      include: { hospital: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ doctors });
  } catch (error) {
    return NextResponse.json({ message: 'خطأ في جلب البيانات من السيرفر' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // التحقق الصارم من وجود الحقول لمنع خطأ 400
    if (!body.name || !body.hospitalId || !body.specialty || !body.phone || !body.workSchedule) {
      return NextResponse.json({ message: 'يرجى ملء جميع الحقول الإجبارية' }, { status: 400 });
    }

    const newDoctor = await prisma.doctor.create({
      data: {
        name: body.name,
        specialty: body.specialty,
        phone: body.phone,
        workSchedule: body.workSchedule, //
        description: body.description || "",
        hospitalId: body.hospitalId,
      },
      include: { hospital: true }
    });
    return NextResponse.json(newDoctor, { status: 201 });
  } catch (error) {
    console.error("Prisma POST Error:", error);
    return NextResponse.json({ message: 'فشل في حفظ بيانات الطبيب في القاعدة' }, { status: 400 });
  }
}