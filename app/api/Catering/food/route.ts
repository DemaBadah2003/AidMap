import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { FoodServiceType, FoodPointStatus, PlaceType } from '@prisma/client'

// جلب البيانات مع ضمان قراءة الحقول الجديدة
export async function GET() {
  try {
    const points = await prisma.foodPoint.findMany({
      include: { place: true },
      orderBy: { createdAt: 'desc' }
    })
    
    const formatted = points.map(p => ({
      id: p.id,
      // نستخدم الحقول المباشرة التي كانت تظهر NULL في الصور
      location: p.location || p.place?.name || "",
      region: p.region || p.place?.description || "",
      foodType: p.serviceType === 'HOT_MEALS' ? 'وجبات مطبوخة' : 'طرود',
      status: p.status === 'OPERATIONAL' ? 'متاح' : 'انتهى',
      distDate: p.createdAt.toISOString().split('T')[0],
      distTime: p.createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    }))
    return NextResponse.json(formatted)
  } catch (error) { 
    return NextResponse.json({ error: "فشل في جلب البيانات" }, { status: 500 }) 
  }
}

// إضافة نقطة توزيع: الحل الجذري لمشكلة الـ NULL
export async function POST(req: NextRequest) {
  try {
    const { location, region, foodType, status } = await req.json()
    
    const newPoint = await prisma.foodPoint.create({
      data: {
        name: `${foodType} - ${region}`,
        // التعديل الضروري هنا: حفظ القيم في الأعمدة مباشرة
        location: location, 
        region: region,     
        serviceType: foodType === 'وجبات مطبوخة' ? FoodServiceType.HOT_MEALS : FoodServiceType.DRY_RATIONS,
        status: status === 'متاح' ? FoodPointStatus.OPERATIONAL : FoodPointStatus.STOPPED,
        place: {
          create: {
            name: location,
            description: region,
            type: PlaceType.FOOD_SUPPORT_CENTER,
            latitude: 0, 
            longitude: 0
          }
        }
      }
    })
    return NextResponse.json(newPoint)
  } catch (error) { 
    return NextResponse.json({ error: "فشل في الإضافة" }, { status: 500 }) 
  }
}

// تعديل نقطة توزيع قائمة
export async function PATCH(req: NextRequest) {
  try {
    const { id, location, region, foodType, status } = await req.json()
    const updated = await prisma.foodPoint.update({
      where: { id },
      data: {
        // تحديث الأعمدة المباشرة لضمان عدم بقائها NULL
        location: location,
        region: region,
        serviceType: foodType === 'وجبات مطبوخة' ? FoodServiceType.HOT_MEALS : FoodServiceType.DRY_RATIONS,
        status: status === 'متاح' ? FoodPointStatus.OPERATIONAL : FoodPointStatus.STOPPED,
        place: {
          update: {
            name: location,
            description: region
          }
        }
      }
    })
    return NextResponse.json(updated)
  } catch (error) { 
    return NextResponse.json({ error: "فشل في التعديل" }, { status: 500 }) 
  }
}