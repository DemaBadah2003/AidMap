import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// دالة جلب البيانات (GET)
export async function GET(req: NextRequest) {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        hospital: true, // جلب بيانات المستشفى المرتبط
      },
      orderBy: { createdAt: 'desc' },
    });

    // تنسيق البيانات لتناسب أسماء الحقول في الفرونت إند (Frontend)
    const formattedDoctors = doctors.map(doc => ({
      id: doc.id,
      name: doc.name,
      specialization: doc.specialty, // مطابقة specialty في السكيما مع specialization في الواجهة
      hospitalName: doc.hospital?.name || "غير محدد",
      hospitalId: doc.hospitalId,
      phone: doc.phone,
      workSchedule: doc.schedule, // مطابقة schedule في السكيما مع workSchedule في الواجهة
      description: doc.description,
    }));

    return NextResponse.json({ doctors: formattedDoctors });
  } catch (error) {
    console.error("Fetch Doctors Error:", error);
    return NextResponse.json({ message: 'خطأ في جلب بيانات الأطباء' }, { status: 500 });
  }
}

// دالة إضافة طبيب جديد (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // التحقق من الحقول المطلوبة لضمان عدم حدوث خطأ 400
    if (!body.name || !body.hospitalId || !body.phone) {
      return NextResponse.json(
        { message: 'الاسم، المستشفى، ورقم الهاتف حقول مطلوبة' }, 
        { status: 400 }
      );
    }

    // إنشاء السجل في قاعدة البيانات باستخدام أسماء حقول السكيما
    const newDoctor = await prisma.doctor.create({
      data: {
        name: body.name,
        specialty: body.specialization || "عام",
        phone: body.phone,
        schedule: body.workSchedule || "غير محدد",
        description: body.description || "",
        hospitalId: body.hospitalId, // يجب أن يكون معرف UUID صحيح لمستشفى موجود
      },
      include: {
        hospital: true
      }
    });

    return NextResponse.json(newDoctor, { status: 201 });
  } catch (error: any) {
    console.error("Prisma POST Error:", error);
    // رسالة الخطأ التي تظهر عند فشل الربط أو وجود بيانات غير صحيحة
    return NextResponse.json(
      { message: 'فشل إضافة الطبيب: تأكد من صحة البيانات وجودة الربط بالمستشفى' }, 
      { status: 400 }
    );
  }
}

// دالة تحديث بيانات طبيب (PATCH)
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    if (!id) return NextResponse.json({ message: 'ID مفقود' }, { status: 400 });

    const updated = await prisma.doctor.update({
      where: { id },
      data: {
        name: body.name,
        specialty: body.specialization,
        phone: body.phone,
        schedule: body.workSchedule,
        description: body.description,
        hospitalId: body.hospitalId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ message: 'فشل تعديل بيانات الطبيب' }, { status: 400 });
  }
}

// دالة حذف طبيب (DELETE)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ message: 'ID مفقود' }, { status: 400 });

    await prisma.doctor.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'تم حذف الطبيب بنجاح' });
  } catch (error) {
    return NextResponse.json({ message: 'فشل عملية الحذف' }, { status: 500 });
  }
}