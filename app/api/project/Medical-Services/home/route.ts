import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // 1. جلب المواقع العامة (المحافظات) من جدول العناوين
    if (type === 'locations') {
      const locations = await prisma.address.findMany({
        distinct: ['title'],
        select: { title: true },
        where: { title: { not: "" } }
      });
      return NextResponse.json(locations.map(l => l.title));
    }

    // 2. جلب المناطق التفصيلية بناءً على الموقع العام المختار
    if (type === 'regions') {
      const locationTitle = searchParams.get('location');
      const regions = await prisma.address.findMany({
        where: { 
          title: locationTitle as string,
          description: { not: "" } 
        },
        distinct: ['description'],
        select: { description: true }
      });
      return NextResponse.json(regions.map(r => r.description));
    }

    // 3. جلب المستشفيات المرتبطة بالمنطقة المختارة
    if (type === 'hospitals') {
      const regionName = searchParams.get('region');
      const hospitals = await prisma.hospital.findMany({
        where: { 
          // هنا السر: لازم حقل location في جدول Hospital يكون مخزن فيه قيمة 
          // تطابق الـ description اللي جاي من جدول Address
          location: regionName as string 
        },
        select: { id: true, name: true }
      });
      return NextResponse.json(hospitals);
    }

    // 4. جلب تفاصيل المستشفى (أقسام، أطباء، خدمات)
    if (type === 'details') {
      const hospitalId = searchParams.get('hospitalId');
      const data = await prisma.hospital.findUnique({
        where: { id: hospitalId as string },
        include: {
          departments: {
            include: { services: true, doctors: true }
          }
        }
      });
      return NextResponse.json(data);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json({ error: 'Database Error' }, { status: 500 });
  }
}