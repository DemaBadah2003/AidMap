import { NextRequest, NextResponse } from 'next/server'
import { Prisma, DistributionStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import { generateAidReferenceCode } from '@/lib/reference-code'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. استخراج البيانات وتحويل الأنواع بدقة لتطابق السكيما
    const fullName = String(body.fullName || '').trim()
    const nationalId = String(body.nationalId || '').trim()
    const phone = String(body.phone || '').trim()
    const address = String(body.address || '').trim()
    const aidType = String(body.aidType || '').trim()
    const notes = body.notes ? String(body.notes).trim() : null
    
    // السكيما تطلب Int، لذا نتأكد من التحويل
    const familyCount = parseInt(String(body.familyCount), 10)

    // 2. فحص أولي للبيانات قبل إرسالها لقاعدة البيانات
    if (!fullName || !nationalId || !phone || isNaN(familyCount)) {
      return NextResponse.json(
        { success: false, message: 'تأكد من إدخال جميع الحقول: الاسم، الهوية، الهاتف، وعدد أفراد الأسرة' },
        { status: 400 }
      )
    }

    // 3. التحقق من التكرار (منع Duplicate Key Error قبل حدوثه)
    const existingRequest = await prisma.requestAid.findFirst({
      where: {
        OR: [
          { nationalId: nationalId },
          { phone: phone }
        ]
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { success: false, message: 'هذا الشخص (رقم الهوية أو الهاتف) مسجل بالفعل في النظام' },
        { status: 409 }
      )
    }

    // 4. محاولة الإضافة الفعلية
    let newRequest = null
    try {
      const referenceCode = generateAidReferenceCode()
      
      newRequest = await prisma.requestAid.create({
        data: {
          referenceCode,
          fullName,
          nationalId,
          phone,
          aidType,
          familyCount,
          address,
          notes,
          status: 'PENDING', // التأكد من كتابتها كـ String ليقوم Prisma بمطابقتها مع Enum
        },
      })
    } catch (dbError: any) {
      console.error('DATABASE_INSERT_ERROR:', dbError)
      
      // هنا السر: سنعيد الخطأ التقني لك لتعرفه
      return NextResponse.json({
        success: false,
        message: 'فشل الإدخال في قاعدة البيانات',
        technicalDetails: dbError.message,
        errorCode: dbError.code // مثلاً P2002 أو P2003
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'تمت إضافة طلب المساعدة بنجاح',
      data: newRequest
    }, { status: 201 })

  } catch (error: any) {
    console.error('GENERAL_SERVER_ERROR:', error)
    return NextResponse.json({
      success: false,
      message: 'خطأ داخلي في الخادم',
      error: error.message
    }, { status: 500 })
  }
}