import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1. دالة جلب البيانات (GET)
export async function GET(req: NextRequest) {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        hospital: true, // جلب بيانات المستشفى المرتبط
      },
      orderBy: { createdAt: 'desc' },
    });

    // تنسيق البيانات لتناسب واجهة الفرونت إند
    const formattedDoctors = doctors.map(doc => ({
      id: doc.id,
      name: doc.name,
      specialty: doc.specialty, 
      hospitalName: doc.hospital?.name || "غير محدد",
      hospitalId: doc.hospitalId,
      phone: doc.phone,
      workSchedule: doc.workSchedule,
      description: doc.description,
    }));

    return NextResponse.json({ doctors: formattedDoctors });
  } catch (error) {
    console.error("Fetch Doctors Error:", error);
    return NextResponse.json({ message: 'خطأ في جلب بيانات الأطباء' }, { status: 500 });
  }
}

// 2. دالة إضافة طبيب جديد (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // التحقق من الحقول الأساسية
    if (!body.name || !body.hospitalId || !body.phone) {
      return NextResponse.json(
        { message: 'الاسم، المستشفى، ورقم الهاتف حقول مطلوبة' }, 
        { status: 400 }
      );
    }

    const newDoctor = await prisma.doctor.create({
      data: {
        name: body.name,
        specialty: body.specialization || "عام", // استخدام التخصص المرسل من الفرونت
        phone: body.phone,
        workSchedule: body.workSchedule || "غير محدد",
        description: body.description || "",
        hospitalId: body.hospitalId,
      },
      include: {
        hospital: true
      }
    });

    return NextResponse.json(newDoctor, { status: 201 });
  } catch (error: any) {
    console.error("Prisma POST Error:", error);
    return NextResponse.json(
      { message: 'فشل إضافة الطبيب: تأكد من صحة البيانات' }, 
      { status: 400 }
    );
  }
}

// 3. دالة تحديث بيانات طبيب (PATCH) - تم الإصلاح هنا لتقرأ الـ ID من الجسم المرسل
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, specialization, phone, workSchedule, description, hospitalId } = body;

    // التأكد من وصول المعرف (ID) لتنفيذ التحديث
    if (!id) {
      return NextResponse.json({ message: 'المعرف (ID) مفقود' }, { status: 400 });
    }

    const updated = await prisma.doctor.update({
      where: { id: id },
      data: {
        name: name,
        specialty: specialization, // التحويل من اسم الحقل في الفرونت إلى السكيما
        phone: phone,
        workSchedule: workSchedule,
        description: description,
        hospitalId: hospitalId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ message: 'فشل تعديل بيانات الطبيب' }, { status: 400 });
  }
}

// 4. دالة حذف طبيب (DELETE)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ message: 'ID مفقود' }, { status: 400 });

    await prisma.doctor.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'تم حذف الطبيب بنجاح' });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ message: 'فشل عملية الحذف' }, { status: 500 });
  }
}