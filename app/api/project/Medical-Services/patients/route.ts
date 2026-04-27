import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// --- 1. جلب البيانات (GET) ---
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // إذا كان الطلب لجلب قائمة المستشفيات فقط (لتعبئة الـ Select)
    if (type === 'hospitals') {
      const hospitals = await prisma.hospital.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      });
      return NextResponse.json(hospitals);
    }

    // جلب قائمة المرضى مع بيانات المستشفى المرتبط بكل مريض
    const patients = await prisma.patient.findMany({
      include: {
        hospital: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ patients });
  } catch (error) {
    console.error("GET_ERROR:", error);
    return NextResponse.json({ message: 'فشل في جلب البيانات' }, { status: 500 });
  }
}

// --- 2. إضافة مريض جديد (POST) ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // فحص أولي للبيانات لمنع أخطاء Prisma (خاصة الـ ID)
    if (!body.hospitalId || body.hospitalId.length < 10) {
      return NextResponse.json(
        { message: 'يرجى اختيار مستشفى صحيح من القائمة' },
        { status: 400 }
      );
    }

    // إنشاء السجل مع الربط الصحيح بالمستشفى
    const newPatient = await prisma.patient.create({
      data: {
        name: body.name,
        nationalId: body.nationalId,
        age: String(body.age || "0"), // تحويل العمر لنص ليتوافق مع السكيما
        address: body.address || "غير محدد",
        phone: body.phone || "",
        diseaseType: body.diseaseType || "",
        // الربط باستخدام الـ ID وليس الاسم
        hospital: {
          connect: { id: body.hospitalId }
        }
      },
      include: { hospital: true }
    });

    return NextResponse.json(newPatient, { status: 201 });

  } catch (error: any) {
    console.error("POST_ERROR:", error);

    // معالجة خطأ تكرار رقم الهوية (Unique Constraint)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'رقم الهوية هذا مسجل مسبقاً لمريض آخر' },
        { status: 400 }
      );
    }

    // معالجة خطأ عدم وجود الـ ID الخاص بالمستشفى
    if (error.code === 'P2025' || error.code === 'P2003') {
      return NextResponse.json(
        { message: 'عذراً، المستشفى المختار غير موجود في قاعدة البيانات' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'حدث خطأ داخلي أثناء حفظ البيانات' },
      { status: 500 }
    );
  }
}

// --- 3. تحديث بيانات مريض (PUT) ---
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ message: 'معرف المريض مفقود' }, { status: 400 });
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        name: updateData.name,
        nationalId: updateData.nationalId,
        age: String(updateData.age),
        address: updateData.address || "غير محدد",
        phone: updateData.phone,
        diseaseType: updateData.diseaseType,
        hospitalId: updateData.hospitalId,
      },
      include: { hospital: true }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT_ERROR:", error);
    return NextResponse.json(
      { message: 'فشل في تحديث البيانات' },
      { status: 500 }
    );
  }
}