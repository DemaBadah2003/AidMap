import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const doctorQuery = searchParams.get('doctorQuery');

  try {
    if (doctorQuery) {
      const doctors = await prisma.doctor.findMany({
        where: {
          OR: [
            { name: { contains: doctorQuery, mode: 'insensitive' } },
            { specialty: { contains: doctorQuery, mode: 'insensitive' } }
          ]
        },
        include: {
          hospital: {
            select: { name: true } // جلب اسم المستشفى من علاقة الـ Foreign Key
          }
        }
      });
      return NextResponse.json(doctors);
    }
    
    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}