import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.psychologicalSupport.findMany({
      where: { isTrashed: false },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'تعذر جلب البيانات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. التحقق من ملء الحقول
    if (!body.name || !body.phone || !body.service || !body.spec || !body.appts || body.cap === undefined || body.count === undefined) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 });
    }

    // 2. منع التكرار (اسم المركز أو رقم الهاتف)
    const existingEntry = await prisma.psychologicalSupport.findFirst({
      where: {
        OR: [
          { centerName: body.name },
          { phoneNumber: body.phone }
        ],
        isTrashed: false
      }
    });

    if (existingEntry) {
      return NextResponse.json({ error: 'اسم المركز أو رقم الهاتف موجود مسبقاً' }, { status: 400 });
    }

    const newEntry = await prisma.psychologicalSupport.create({
      data: {
        centerName: body.name,
        serviceType: body.service,
        specialist: body.spec,
        phoneNumber: body.phone,
        appointments: body.appts,
        capacity: parseInt(body.cap) || 0,
        currentCount: parseInt(body.count) || 0,
        status: body.status,
      },
    });

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في حفظ البيانات', details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    if (!id) return NextResponse.json({ error: 'ID مطلوب' }, { status: 400 });

    // منع التكرار عند التعديل (مع استثناء السجل الحالي نفسه)
    const duplicate = await prisma.psychologicalSupport.findFirst({
      where: {
        OR: [
          { centerName: body.name },
          { phoneNumber: body.phone }
        ],
        NOT: { id: id },
        isTrashed: false
      }
    });

    if (duplicate) {
      return NextResponse.json({ error: 'البيانات الجديدة (الاسم أو الهاتف) مستخدمة في مركز آخر' }, { status: 400 });
    }

    const updated = await prisma.psychologicalSupport.update({
      where: { id },
      data: {
        centerName: body.name,
        specialist: body.spec,
        phoneNumber: body.phone,
        capacity: parseInt(body.cap) || 0,
        currentCount: parseInt(body.count) || 0,
        status: body.status,
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في التحديث' }, { status: 500 });
  }
}