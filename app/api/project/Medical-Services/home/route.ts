import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    // 1. جلب المواقع (مثلاً: المحافظات) من جدول العناوين
    if (type === 'locations') {
      const addresses = await prisma.address.findMany({
        distinct: ['title'],
        select: { title: true },
        where: { title: { not: null } }
      })
      // إرجاع مصفوفة نصوص بسيطة
      return NextResponse.json(addresses.map(a => a.title))
    }

    // 2. جلب المناطق بناءً على الموقع المختار
    if (type === 'regions') {
      const locationTitle = searchParams.get('location')
      const regions = await prisma.address.findMany({
        where: { 
          title: locationTitle as string,
          description: { not: null } 
        },
        distinct: ['description'],
        select: { description: true }
      })
      return NextResponse.json(regions.map(r => r.description))
    }

    // 3. جلب المستشفيات بناءً على المنطقة (الواردة من الـ description)
    if (type === 'hospitals') {
      const regionName = searchParams.get('region')
      const hospitals = await prisma.hospital.findMany({
        where: { 
          // تأكد أن حقل location في جدول المستشفيات يخزن "اسم المنطقة"
          location: regionName as string 
        },
        select: { id: true, name: true }
      })
      return NextResponse.json(hospitals)
    }

    // 4. جلب تفاصيل المستشفى كاملة
    if (type === 'details') {
      const hospitalId = searchParams.get('hospitalId')
      if (!hospitalId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

      const hospitalFullData = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        include: {
          departments: {
            include: { 
              services: true, 
              doctors: true 
            }
          }
        }
      })
      
      if (!hospitalFullData) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
      return NextResponse.json(hospitalFullData)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: 'Database Error' }, { status: 500 })
  }
}