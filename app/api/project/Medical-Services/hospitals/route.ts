import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';

const typeMap: Record<string, string> = { 'خاص': 'PRIVATE', 'وكالة': 'UNRWA', 'حكومية': 'GOVERNMENT' };
const regionMap: Record<string, string> = { 'شمال': 'NORTH', 'جنوب': 'SOUTH', 'شرق': 'EAST', 'غرب': 'WEST' };
const typeRevMap: Record<string, string> = Object.fromEntries(Object.entries(typeMap).map(([k, v]) => [v, k]));
const regionRevMap: Record<string, string> = Object.fromEntries(Object.entries(regionMap).map(([k, v]) => [v, k]));

export async function GET() {
  try {
    const hospitals = await prisma.hospital.findMany({
      include: { doctors: true },
      orderBy: { createdAt: 'desc' },
    });

    const formattedHospitals = hospitals.map(h => ({
      id: h.id,
      hospitalName: h.name,
      hospitalType: typeRevMap[h.type] || h.type,
      region: regionRevMap[h.region] || h.region,
      phone: h.phone,
      latitude: h.latitude,
      longitude: h.longitude,
      doctorNames: h.doctors.map(d => d.name).join('، '),
    }));

    return NextResponse.json({ hospitals: formattedHospitals });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const type = typeMap[body.hospitalType];
    const region = regionMap[body.region] as 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';

    if (!type || !region || !body.hospitalName || !body.phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const addressId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "Address" (id, title, region, "createdAt")
      VALUES (${addressId}, ${body.hospitalName}, ${region}::"Region", NOW())
    `;

    const newHospital = await prisma.hospital.create({
      data: {
        name: body.hospitalName,
        type: type as any,
        region: region as any,
        phone: body.phone,
        addressId,
        latitude: body.latitude ? parseFloat(body.latitude) : undefined,
        longitude: body.longitude ? parseFloat(body.longitude) : undefined,
      },
    });

    return NextResponse.json(newHospital, { status: 201 });
  } catch (error) {
    console.error('POST /hospitals error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, hospitalName, hospitalType, region, phone, latitude, longitude } = body;

    const type = typeMap[hospitalType];
    const regionVal = regionMap[region];

    if (!id || !type || !regionVal || !hospitalName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updated = await prisma.hospital.update({
      where: { id },
      data: {
        name: hospitalName,
        type: type as any,
        region: regionVal as any,
        phone,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /hospitals error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 400 });
  }
}
