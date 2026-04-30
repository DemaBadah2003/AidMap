import { NextRequest, NextResponse } from 'next/server';
import  prisma from '@/lib/prisma'; // تأكد من وجود ملف Prisma Singleton لديك
import { WaterType, WaterPointStatus, PlaceType } from '@prisma/client';

/**
 * دالة مساعدة لتحويل بيانات السكيما إلى التنسيق المتوافق مع الجدول في الفرونت إند
 */
const mapSchemaToFront = (item: any) => {
  return {
    id: item.id,
    pointName: item.name,
    waterType: item.type === 'SWEET' ? 'حلوة' : 'مالحة',
    status: item.status === 'OPERATIONAL' ? 'تعمل حالياً' : 'متوقفة',
    // عرض الموقع الجغرافي (شرق/غرب/شمال/جنوب) المخزن في حقل الوصف
    location: item.place?.description || '', 
    // عرض المحافظة/المنطقة (جباليا، النصر...) المخزن في حقل الاسم
    region: item.place?.name || '', 
  };
};

// GET: جلب جميع نقاط المياه مع بيانات المكان المرتبطة بها
export async function GET() {
  try {
    const points = await prisma.waterPoint.findMany({
      include: { place: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(points.map(mapSchemaToFront));
  } catch (error) {
    console.error('Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST: إضافة نقطة مياه جديدة مع ربطها بجدول المكان
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pointName, waterType, status, region, location } = body;

    const newPoint = await prisma.waterPoint.create({
      data: {
        name: pointName,
        type: waterType === 'حلوة' ? WaterType.SWEET : WaterType.SALTY,
        // تحويل الحالة للحفاظ على توافق Enums السكيما
        status: status === 'تعمل حالياً' ? WaterPointStatus.OPERATIONAL : WaterPointStatus.STOPPED,
        place: {
          create: {
            name: region,             // تخزين المحافظة
            description: location,    // تخزين الاتجاه الجغرافي في الوصف
            type: PlaceType.WATER_POINT, // القيمة الصحيحة من الـ Enum
            latitude: 31.5,           // قيم إجبارية في السكيما
            longitude: 34.4
          }
        }
      },
      include: { place: true }
    });

    return NextResponse.json(mapSchemaToFront(newPoint));
  } catch (error) {
    console.error('Create Error:', error);
    return NextResponse.json({ error: 'فشل في الإضافة' }, { status: 500 });
  }
}

// PUT: تحديث بيانات نقطة مياه (مع حل مشكلة الـ Record not found والـ Enum)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, pointName, waterType, status, region, location } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID مطلوب للتحديث' }, { status: 400 });
    }

    const updatedPoint = await prisma.waterPoint.update({
      where: { id: id },
      data: {
        name: pointName,
        type: waterType === 'حلوة' ? WaterType.SWEET : WaterType.SALTY,
        status: status === 'تعمل حالياً' ? WaterPointStatus.OPERATIONAL : WaterPointStatus.STOPPED,
        place: {
          // استخدام upsert يضمن التعديل حتى لو لم يكن للمكان سجل سابق
          upsert: {
            update: {
              name: region,
              description: location,
              type: PlaceType.WATER_POINT,
            },
            create: {
              name: region,
              description: location,
              type: PlaceType.WATER_POINT,
              latitude: 31.5,
              longitude: 34.4
            }
          }
        }
      },
      include: { place: true }
    });

    return NextResponse.json(mapSchemaToFront(updatedPoint));
  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ 
      error: 'فشل في التعديل',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}