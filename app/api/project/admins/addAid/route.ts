import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma' // تأكد من مسار بريزما عندك

function normalizeStatus(status?: string | null) {
  if (!status) return 'pending'
  const s = status.toUpperCase()
  if (s === 'PENDING') return 'pending'
  if (s === 'APPROVED') return 'approved'
  if (s === 'DELIVERED') return 'delivered'
  if (s === 'REJECTED') return 'rejected'
  return 'pending'
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const nationalId = searchParams.get('nationalId')

    if (!nationalId) {
      return NextResponse.json({ message: 'رقم الهوية مطلوب' }, { status: 400 })
    }

    // البحث في جدول aidRequest بناءً على رقم الهوية
    const request = await prisma.aidRequest.findFirst({
      where: { nationalId: nationalId },
      orderBy: { createdAt: 'desc' }, // جلب أحدث طلب للمواطن
    })

    if (!request) {
      return NextResponse.json({ found: false, message: 'رقم الهوية هذا غير موجود في كشوفات المساعدات' }, { status: 200 })
    }

    // إرجاع البيانات كما يتوقعها الفرونت إند
    return NextResponse.json({
      found: true,
      beneficiaryName: request.fullName,
      nationalId: request.nationalId,
      phone: request.phone,
      aidType: request.aidType,
      numberOfFamily: request.familyCount,
      address: request.address,
      notes: request.notes,
      status: normalizeStatus(request.status),
      requestNumber: request.id,
      distributionDate: null, // يمكن إضافتها لاحقاً من قاعدة البيانات
      pickupLocation: null,   // يمكن إضافتها لاحقاً من قاعدة البيانات
    }, { status: 200 })

  } catch (error) {
    console.error('Search Aid Error:', error)
    return NextResponse.json({ message: 'حدث خطأ أثناء فحص البيانات' }, { status: 500 })
  }
}