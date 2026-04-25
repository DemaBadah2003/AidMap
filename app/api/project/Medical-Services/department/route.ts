import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1. جلب الأقسام
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get('hospitalId');

    const departments = await prisma.department.findMany({
      where: hospitalId ? { hospitalId } : {},
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json({ error: 'فشل في جلب البيانات' }, { status: 500 });
  }
}

// 2. إضافة قسم جديد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // استخدام name ليتطابق مع السكيما والفرونت
    const { name, deptType, status, description, hospitalId } = body;

    if (!name || !hospitalId) {
      return NextResponse.json({ error: 'الاسم والمستشفى مطلوبان' }, { status: 400 });
    }

    const newDept = await prisma.department.create({
      data: { name, deptType, status, description, hospitalId }
    });

    return NextResponse.json(newDept, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}