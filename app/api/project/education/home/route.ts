import { NextRequest, NextResponse } from 'next/server'
import PrismaClientfrom  '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  
  // استخراج بارامترات البحث من الرابط
  const region = searchParams.get('region')
  const facility = searchParams.get('facility')
  const query = searchParams.get('query')

  try {
    const services = await prisma.educationService.findMany({
      where: {
        AND: [
          region ? { region: region } : {},
          facility ? { facilityName: facility } : {},
          query ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          } : {}
        ]
      }
    })

    return NextResponse.json(services)
  } catch (error) {
    return NextResponse.json({ error: 'فشل في جلب البيانات' }, { status: 500 })
  }
}