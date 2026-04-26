import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1. خرائط التحويل (Mapping)
const typeMap: Record<string, any> = { 
  'خاص': 'PRIVATE', 
  'وكالة': 'UNRWA', 
  'حكومي': 'GOVERNMENT',
};

const regionMap: Record<string, any> = { 
  'شمال': 'NORTH', 
  'جنوب': 'SOUTH', 
  'شرق': 'EAST', 
  'غرب': 'WEST', 
  'وسطى': 'CENTRAL',
  'عام': 'NORTH' 
};

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

// GET: جلب البيانات
export async function GET() {
  try {
    const hospitals = await prisma.hospital.findMany({
      orderBy: { createdAt: 'desc' },
      include: { address: true }
    });

    const formattedHospitals = hospitals.map(h => ({
      id: h.id,
      hospitalName: h.name,
      hospitalType: typeRevMap[h.type as string] || h.type,
      region: regionRevMap[h.region as string] || h.region,
      phone: h.phone,
      addressTitle: h.address?.title || 'غير محدد'
    }));

    return NextResponse.json({ hospitals: formattedHospitals });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch hospitals' }, { status: 500 });
  }
}

// POST: إضافة مستشفى جديد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dbType = typeMap[body.hospitalType] || 'GOVERNMENT';
    const dbRegion = regionMap[body.region] || 'NORTH';

    let address = await prisma.address.findFirst({ where: { region: dbRegion } });

    if (!address) {
        address = await prisma.address.findFirst() || await prisma.address.create({
            data: { title: 'المركز الرئيسي', region: dbRegion }
        });
    }

    const newHospital = await prisma.hospital.create({
      data: {
        name: body.hospitalName,
        type: dbType,
        region: dbRegion,
        phone: String(body.phone || ''),
        addressId: address.id,
      }
    });

    return NextResponse.json(newHospital, { status: 201 });
  } catch (error: any) {
    console.error("POST ERROR:", error);
    return NextResponse.json({ error: 'فشل في الحفظ' }, { status: 500 });
  }
}

// PATCH: تعديل مستشفى موجود
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, hospitalName, hospitalType, region, phone } = body;

    if (!id || !hospitalName || !hospitalType || !phone) {
        return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
    }

    const updated = await prisma.hospital.update({
      where: { id },
      data: {
        name: hospitalName,
        type: typeMap[hospitalType] || 'GOVERNMENT',
        region: regionMap[region] || 'NORTH',
        phone: String(phone || ''),
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH ERROR:", error);
    return NextResponse.json({ error: 'فشل في التعديل' }, { status: 400 });
  }
}