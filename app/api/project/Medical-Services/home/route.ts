import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    // 1. جلب المواقع
    if (type === 'locations') {
      const addresses = await prisma.address.findMany({ select: { title: true } })
      const uniqueLocations = Array.from(new Set(addresses.map(a => a.title).filter(Boolean)))
      return NextResponse.json(uniqueLocations)
    }

    // 2. جلب المناطق بناءً على الموقع
    if (type === 'regions') {
      const locationTitle = searchParams.get('location')
      const regions = await prisma.address.findMany({
        where: { title: locationTitle as string },
        select: { description: true }
      })
      const uniqueRegions = Array.from(new Set(regions.map(r => r.description).filter(Boolean)))
      return NextResponse.json(uniqueRegions)
    }

    // 3. جلب المستشفيات بناءً على المنطقة
    if (type === 'hospitals') {
      const regionName = searchParams.get('region')
      const hospitals = await prisma.hospital.findMany({
        where: { location: regionName as string },
        select: { id: true, name: true }
      })
      return NextResponse.json(hospitals)
    }

    // 4. جلب تفاصيل المستشفى كاملة
    if (type === 'details') {
      const hospitalId = searchParams.get('hospitalId')
      const hospitalFullData = await prisma.hospital.findUnique({
        where: { id: hospitalId as string },
        include: {
          departments: {
            include: { services: true, doctors: true }
          }
        }
      })
      
      if (!hospitalFullData) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
      return NextResponse.json(hospitalFullData)
    }

    return NextResponse.json([])
  } catch (error) {
    return NextResponse.json({ error: 'Database Error' }, { status: 500 })
  }
}