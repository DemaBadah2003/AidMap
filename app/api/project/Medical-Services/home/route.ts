import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const doctorQuery = searchParams.get('doctorQuery');

  try {
    // إذا كان هناك طلب بحث عن طبيب
    if (doctorQuery) {
      const doctors = await prisma.doctor.findMany({
        where: {
          OR: [
            { 
              name: { 
                contains: doctorQuery, 
                mode: 'insensitive' 
              } 
            },
            { 
              specialty: { 
                contains: doctorQuery, 
                mode: 'insensitive' 
              } 
            }
          ]
        },
        include: {
          // جلب بيانات المستشفى المرتبط بالطبيب (حسب الـ Schema عندك)
          hospital: {
            select: {
              name: true,
            }
          }
        }
      });

      return NextResponse.json(doctors);
    }

    // منطق جلب المستشفيات الافتراضي (إذا لم يوجد بحث)
    const hospitals = await prisma.hospital.findMany();
    return NextResponse.json(hospitals);

  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}