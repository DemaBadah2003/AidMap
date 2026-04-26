import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  try {
    // 1. جلب المناطق (شمال، جنوب، شرق، غرب) الموجودة في جدول Address
    if (type === 'locations') {
      const locations = await prisma.address.findMany({
        select: { region: true },
        distinct: ['region'],
      });
      // نرسل الـ Enum كما هو (NORTH, SOUTH, etc.) والفرونت سيقوم بالترجمة
      return NextResponse.json(locations.map(l => l.region));
    }

    // 2. جلب أنواع المنشآت (حكومي، خاص، وكالة) الموجودة فعلياً في جدول Hospital
    if (type === 'orgTypes') {
      const types = await prisma.hospital.findMany({
        select: { type: true },
        distinct: ['type'],
      });
      return NextResponse.json(types.map(t => t.type));
    }

    // 3. جلب المستشفيات بناءً على "المنطقة" و "النوع" المختارين
    if (type === 'hospitals') {
      const region = searchParams.get('region'); // NORTH, SOUTH...
      const orgType = searchParams.get('orgType'); // PRIVATE, GOVERNMENT...

      const hospitals = await prisma.hospital.findMany({
        where: {
          type: orgType as any,
          address: { region: region as any }
        },
        select: { id: true, name: true }
      });
      return NextResponse.json(hospitals);
    }

    // 4. جلب الأقسام (نفس الكود السابق)
    if (type === 'details') {
      const hospitalId = searchParams.get('hospitalId');
      const departments = await prisma.department.findMany({
        where: { hospitalId: hospitalId as string },
        include: { services: true, doctors: true }
      });
      return NextResponse.json(departments);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}