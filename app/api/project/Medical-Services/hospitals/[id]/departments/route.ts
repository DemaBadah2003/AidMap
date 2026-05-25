import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// دالة GET لجلب البيانات
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 1. فك الـ Promise
) {
  const { id } = await params; 
  try {
    const departments = await prisma.department.findMany({
      where: { hospitalId: id },
      include: { 
        hospital: { select: { id: true, name: true } } // 2. استخدم name فقط
      },
    });
    return NextResponse.json(departments);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// دالة POST لإضافة قسم جديد
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 1. فك الـ Promise
) {
  const { id } = await params;
  try {
    const body = await req.json();
    
    // 3. التحقق فقط من الحقول التي ترسلها من الـ Frontend
    if (!body.name || !body.deptType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const dept = await prisma.department.create({
      data: {
        name: body.name,
        deptType: body.deptType,
        status: body.status || 'يعمل بكفاءة',
        description: body.description || null,
        hospitalId: id, // استخدام الـ ID المستخرج من الرابط
      },
    });
    return NextResponse.json(dept, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}