import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'hospitals') {
      const hospitals = await prisma.hospital.findMany({ select: { id: true, name: true } });
      return NextResponse.json(hospitals);
    }

    if (type === 'departments') {
      const departments = await prisma.department.findMany({ select: { id: true, name: true } });
      return NextResponse.json(departments);
    }

    // جلب جميع الأطباء مع المستشفى والقسم لضمان عرض البيانات كاملة
    const doctors = await prisma.doctor.findMany({
      include: { 
        hospital: true,
        department: true // أضفنا تضمين القسم
      },
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

    // التحقق من الحقول بما في ذلك departmentId لضمان سلامة العلاقات
    if (!body.name || !body.hospitalId || !body.departmentId || !body.phone || !body.workSchedule) {
      return NextResponse.json({ message: 'يرجى ملء جميع الحقول الإجبارية' }, { status: 400 });
    }

    const newDoctor = await prisma.doctor.create({
      data: {
        name: body.name,
        specialty: body.specialty,
        phone: body.phone,
        workSchedule: body.workSchedule,
        description: body.description || "",
        hospitalId: body.hospitalId,
        departmentId: body.departmentId, // ربط القسم في قاعدة البيانات
      },
      include: { hospital: true, department: true }
    });
    return NextResponse.json(newDoctor, { status: 201 });
  } catch (error) {
    console.error("Prisma POST Error:", error);
    return NextResponse.json({ message: 'فشل في حفظ بيانات الطبيب' }, { status: 400 });
  }
}

// إضافة وظيفة التعديل (PUT) لتتوافق مع زر التعديل في الفرونت إند
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ message: 'معرف الطبيب غير موجود' }, { status: 400 });
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: id },
      data: {
        name: updateData.name,
        specialty: updateData.specialty,
        phone: updateData.phone,
        workSchedule: updateData.workSchedule,
        description: updateData.description || "",
        hospitalId: updateData.hospitalId,
        departmentId: updateData.departmentId,
      },
      include: { hospital: true, department: true }
    });

    return NextResponse.json(updatedDoctor);
  } catch (error) {
    console.error("Prisma PUT Error:", error);
    return NextResponse.json({ message: 'فشل في تحديث بيانات الطبيب' }, { status: 500 });
  }
}