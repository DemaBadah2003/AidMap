import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const nationalId = searchParams.get('nationalId')

    if (!nationalId) {
      return NextResponse.json({ message: 'رقم الهوية مطلوب' }, { status: 400 })
    }

    // 1. البحث في جدول Citizens (لاحظ استخدام idNumber بدلاً من nationalId)
    const citizen = await prisma.citizens.findFirst({
      where: { idNumber: nationalId }
    })

    if (!citizen) {
      return NextResponse.json({ 
        found: false, 
        message: 'رقم الهوية هذا غير مسجل في نظام المواطنين' 
      }, { status: 200 })
    }

    // 2. البحث في جدول RequestAid (تأكد من كتابة الاسم كما في الموديل تماماً)
    const request = await prisma.requestAid.findFirst({
      where: { nationalId: nationalId },
      orderBy: { createdAt: 'desc' },
    })

    // 3. دمج البيانات وإرسالها
    return NextResponse.json({
      found: true,
      beneficiaryName: citizen.name, // الحقل في موديل Citizens اسمه name
      address: request?.address || citizen.area || "غير محدد", 
      status: request ? request.status.toLowerCase() : 'no_request',
      notes: request?.notes || (request ? "لا توجد ملاحظات" : "لا يوجد طلب مقدم"),
      aidType: request?.aidType || 'N/A'
    }, { status: 200 })

  } catch (error) {
    console.error('Search Error:', error)
    return NextResponse.json({ message: 'حدث خطأ في السيرفر' }, { status: 500 })
  }
}