import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// خرائط التحويل للتعامل مع الأسماء بالعربي في الواجهة والانجليزي في القاعدة
const statusMap: Record<string, string> = {
  'جديدة': 'NEW',
  'قيد المعالجة': 'IN_PROGRESS',
  'مغلقة': 'CLOSED'
};

const levelMap: Record<string, string> = {
  'منخفض': 'LOW',
  'متوسط': 'MEDIUM',
  'مرتفع': 'HIGH'
};

const statusRevMap: Record<string, string> = {
  'NEW': 'جديدة',
  'IN_PROGRESS': 'قيد المعالجة',
  'CLOSED': 'مغلقة'
};

const levelRevMap: Record<string, string> = {
  'LOW': 'منخفض',
  'MEDIUM': 'متوسط',
  'HIGH': 'مرتفع'
};

// 1. جلب البيانات
export async function GET() {
  try {
    const emergencies = await prisma.emergency.findMany({
      orderBy: { id: 'desc' },
    });

    const formatted = emergencies.map(item => ({
      ...item,
      status: statusRevMap[item.status] || item.status,
      level: levelRevMap[item.level] || item.level,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ message: 'خطأ في جلب البيانات' }, { status: 500 });
  }
}

// 2. إضافة بلاغ جديد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.emergencyType || !body.level || !body.status) {
      return NextResponse.json({ message: 'الحقول المطلوبة ناقصة' }, { status: 400 });
    }

    const camp = await prisma.camps.findFirst();
    const supervisor = await prisma.supervisor.findFirst();

    if (!camp || !supervisor) {
      return NextResponse.json({ 
        message: 'يجب إضافة مخيم ومشرف واحد على الأقل في قاعدة البيانات أولاً' 
      }, { status: 400 });
    }

    const newEmergency = await prisma.emergency.create({
      data: {
        emergencyType: body.emergencyType,
        description: body.description || "",
        status: (statusMap[body.status] as any) || 'NEW',
        level: (levelMap[body.level] as any) || 'MEDIUM',
        campId: camp.id,
        supervisorId: supervisor.id,
      }
    });

    return NextResponse.json(newEmergency, { status: 201 });
  } catch (error: any) {
    console.error("Prisma Error:", error.message);
    return NextResponse.json({ message: 'فشل في الحفظ بقاعدة البيانات' }, { status: 500 });
  }
}

// 3. تعديل بلاغ (هذا الجزء الذي كان ناقصاً ويسبب خطأ 405)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, emergencyType, level, status } = body;

    if (!id) {
      return NextResponse.json({ message: 'المعرف (ID) مطلوب للتعديل' }, { status: 400 });
    }

    const updatedEmergency = await prisma.emergency.update({
      where: { id: id },
      data: {
        emergencyType: emergencyType,
        // تحويل القيمة العربية القادمة من الـ Frontend إلى القيمة التي يفهمها الـ Enum في Prisma
        level: (levelMap[level] as any) || undefined, 
        status: (statusMap[status] as any) || undefined,
      },
    });

    return NextResponse.json(updatedEmergency);
  } catch (error: any) {
    console.error("Update Error:", error.message);
    return NextResponse.json({ message: 'فشل في تحديث البيانات' }, { status: 500 });
  }
}

// 4. حذف بلاغ
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID missing' }, { status: 400 });
    await prisma.emergency.delete({ where: { id } });
    return NextResponse.json({ message: 'تم الحذف' });
  } catch (error) {
    return NextResponse.json({ message: 'فشل الحذف' }, { status: 400 });
  }
}