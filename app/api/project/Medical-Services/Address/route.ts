import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma' 

// 1. جلب كافة المواقع (GET)
export async function GET() {
  try {
    const addresses = await prisma.address.findMany({
      orderBy: { createdAt: 'desc' },
    })
    
    // تحويل الأسماء لتتوافق مع واجهة الفرونت إند (location/region)
    const formattedAddresses = addresses.map(addr => ({
      id: addr.id,
      location: addr.title,
      region: addr.description
    }))

    return NextResponse.json({ addresses: formattedAddresses })
  } catch (error) {
    console.error("GET Error:", error)
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 })
  }
}

// 2. إضافة موقع جديد (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const newAddress = await prisma.address.create({
      data: {
        title: body.location,       // الربط مع location
        description: body.region,   // الربط مع region
      }
    })
    
    return NextResponse.json(newAddress)
  } catch (error) {
    console.error("POST Error:", error)
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 })
  }
}

// 3. تحديث موقع (PATCH)
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const body = await req.json()
    
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        title: body.location,      // تحديث location
        description: body.region,  // تحديث region
      }
    })
    
    return NextResponse.json(updatedAddress)
  } catch (error) {
    console.error("PATCH Error:", error)
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 })
  }
}

// 4. حذف موقع (DELETE)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.address.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE Error:", error)
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
  }
}