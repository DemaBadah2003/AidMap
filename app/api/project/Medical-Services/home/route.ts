import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Region, HospitalType } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  
  // الفلاتر القادمة من الطلب
  const region = searchParams.get('region') as Region;
  const orgType = searchParams.get('orgType') as HospitalType;
  const hospitalId = searchParams.get('hospitalId');
  const deptType = searchParams.get('deptType'); // التخصص المختار

  try {
    // 1. جلب المواقع (المناطق) الفريدة من جدول العناوين
    if (type === 'locations') {
      const data = await prisma.address.findMany({
        select: { region: true },
        distinct: ['region'],
      });
      return NextResponse.json(data.map(item => item.region).filter(Boolean));
    }

    // 2. جلب أنواع المستشفيات الفريدة (GOVERNMENT, PRIVATE, UNRWA)
    if (type === 'orgTypes') {
      const data = await prisma.hospital.findMany({
        select: { type: true },
        distinct: ['type'],
      });
      return NextResponse.json(data.map(item => item.type).filter(Boolean));
    }

    // 3. جلب المستشفيات بناءً على المنطقة والنوع
    if (type === 'hospitals') {
      const data = await prisma.hospital.findMany({
        where: {
          ...(region && { region }),
          ...(orgType && { type: orgType }),
        },
        select: { id: true, name: true },
      });
      return NextResponse.json(data);
    }

    // 4. جلب التخصصات (deptType) المتاحة في مستشفى معين (للقائمة المنسدلة الرابعة)
    if (type === 'specialties' && hospitalId) {
      const data = await prisma.department.findMany({
        where: { hospitalId },
        select: { deptType: true },
        distinct: ['deptType'],
      });
      return NextResponse.json(data.map(item => item.deptType).filter(Boolean));
    }

    // 5. جلب الأقسام مع (الخدمات + الأطباء) بناءً على التخصص المختار في المستشفى
    if (type === 'details' && hospitalId && deptType) {
      const data = await prisma.department.findMany({
        where: { 
          hospitalId: hospitalId,
          deptType: deptType 
        },
        include: { 
          services: {
            select: {
              id: true,
              name: true,
              isAvailable: true,
              price: true
            }
          }, 
          doctors: {
            select: {
              id: true,
              name: true,
              specialty: true,
              workSchedule: true,
              phone: true
            }
          } 
        },
      });
      return NextResponse.json(data);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "حدث خطأ في الاتصال بقاعدة البيانات" }, { status: 500 });
  }
}