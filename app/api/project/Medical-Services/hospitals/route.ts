import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// خرائط التحويل من العربية للإنجليزية (لقاعدة البيانات)
const typeMap: Record<string, any> = { 
  'خاص': 'PRIVATE', 
  'وكالة': 'UNRWA', 
  'حكومي': 'GOVERNMENT',
  'حكومية': 'GOVERNMENT' 
};

const regionMap: Record<string, any> = { 
  'شمال': 'NORTH', 
  'جنوب': 'SOUTH', 
  'شرق': 'EAST', 
  'غرب': 'WEST', 
  'وسطى': 'CENTRAL' 
};

// خرائط التحويل العكسي من الإنجليزية للعربية (للعرض في الجدول)
const typeRevMap: Record<string, string> = {
  'PRIVATE': 'خاص',
  'UNRWA': 'وكالة',
  'GOVERNMENT': 'حكومي'
};

const regionRevMap: Record<string, string> = {
  'NORTH': 'شمال',
  'SOUTH': 'جنوب',
  'EAST': 'شرق',
  'WEST': 'غرب',
  'CENTRAL': 'وسطى'
};

// 1. دالة جلب البيانات (GET) - هي سبب المشكلة الأساسي في الصور
export async function GET() {
  try {
    const hospitals = await prisma.hospital.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // تحويل البيانات للعربية قبل إرسالها للفرونت إند
    const formattedHospitals = hospitals.map(h => ({
      id: h.id,
      hospitalName: h.name,
      hospitalType: typeRevMap[h.type] || h.type,
      region: regionRevMap[h.region] || h.region,
      location: h.location,
      phone: h.phone,
    }));

    return NextResponse.json({ hospitals: formattedHospitals });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// 2. دالة الإضافة (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const dbType = typeMap[body.hospitalType] || 'GOVERNMENT';
    const dbRegion = regionMap[body.region] || 'NORTH';

    if (!body.hospitalName) {
      return NextResponse.json({ error: 'اسم المنشأة مطلوب' }, { status: 400 });
    }

    const newHospital = await prisma.hospital.create({
      data: {
        name: body.hospitalName,
        type: dbType,
        region: dbRegion,
        location: body.location || body.region || 'غير محدد',
        phone: String(body.phone || ''), 
      }
    });

    return NextResponse.json(newHospital, { status: 201 });
  } catch (error: any) {
    console.error("PRISMA ERROR:", error);
    return NextResponse.json({ error: 'فشل في قاعدة البيانات', details: error.message }, { status: 500 });
  }
}

// 3. دالة التعديل (PATCH)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, hospitalName, hospitalType, region, location, phone } = body;

    const updated = await prisma.hospital.update({
      where: { id },
      data: {
        name: hospitalName,
        type: typeMap[hospitalType] || 'GOVERNMENT',
        region: regionMap[region] || 'NORTH',
        location: location,
        phone: String(phone || ''),
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 400 });
  }
}