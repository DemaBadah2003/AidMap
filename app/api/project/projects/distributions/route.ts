import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';



/**

 * دالة مساعدة لتنسيق البيانات المرسلة للفرونت إند.

 * تضمن إرجاع الأسماء والمعرفات بشكل منفصل لتسهيل عملية التعديل.

 */

function formatDistribution(dist: any) {

  return {

    id: dist.id,

    quantity: dist.quantity || 0,

    status: dist.status,

    institutionName: dist.institution?.name || 'غير محدد',

    productName: dist.product?.nameAr || dist.product?.name || 'غير معروف',

    beneficiaryName: dist.beneficiary?.name || dist.beneficiary?.fullName || 'غير محدد',

    beneficiaryId: dist.beneficiaryId, // المعرف الضروري لعملية التعديل

    productId: dist.productId,         // المعرف الضروري لعملية التعديل

  };

}



// 1. جلب البيانات (GET)

export async function GET() {

  try {

    const data = await prisma.distribution.findMany({

      orderBy: { id: 'desc' },

      include: {

        beneficiary: true,

        product: true,

        institution: true,

      },

    });

    return NextResponse.json(data.map(formatDistribution));

  } catch (error: any) {

    console.error("GET Error:", error);

    return NextResponse.json({ message: 'خطأ في جلب البيانات' }, { status: 500 });

  }

}



// 2. تحديث التوزيع عند الضغط على زر الحفظ (PUT)

export async function PUT(req: NextRequest) {

  try {

    const { searchParams } = new URL(req.url);

    const idFromQuery = searchParams.get('id'); // المعرف من الرابط

    const body = await req.json();

   

    // الأولوية للمعرف القادم من الرابط، ثم الموجود في جسم الطلب

    const targetId = idFromQuery || body.id;



    if (!targetId) {

      return NextResponse.json({ message: 'المعرف (ID) مفقود' }, { status: 400 });

    }



    // التحديث: نستخدم المعرفات (IDs) فقط لتجنب أخطاء الربط في Prisma

    const updated = await prisma.distribution.update({

      where: { id: targetId },

      data: {

        // نستخدم القيم القادمة من الـ Select في الفرونت إند (وهي الـ IDs)

        quantity: body.quantity !== undefined ? Number(body.quantity) : undefined,

        status: body.status,

        beneficiaryId: body.beneficiaryId, // ربط المستفيد الجديد بالـ ID

        productId: body.productId,         // ربط المنتج الجديد بالـ ID

      },

      include: {

        beneficiary: true,

        product: true,

        institution: true,

      }

    });



    return NextResponse.json(formatDistribution(updated));

  } catch (error: any) {

    console.error("PUT Error (Internal):", error);

    return NextResponse.json({

      message: 'فشل حفظ التعديلات في السيرفر',

      details: error.message

    }, { status: 500 });

  }

}



// 3. إضافة توزيع جديد (POST)

export async function POST(req: NextRequest) {

  try {

    const body = await req.json();

    const inst = await prisma.institution.findFirst();

   

    if (!inst) {

      return NextResponse.json({ message: 'يجب إضافة مؤسسة أولاً' }, { status: 400 });

    }



    const created = await prisma.distribution.create({

      data: {

        quantity: Number(body.quantity) || 0,

        status: body.status || 'PENDING',

        institutionId: inst.id,

        productId: body.productId,

        beneficiaryId: body.beneficiaryId,

      },

      include: {

        beneficiary: true,

        product: true,

        institution: true,

      }

    });



    return NextResponse.json(formatDistribution(created), { status: 201 });

  } catch (error: any) {

    console.error("POST Error:", error);

    return NextResponse.json({ message: 'فشل الإضافة', details: error.message }, { status: 400 });

  }

}



// 4. حذف التوزيع (DELETE)

export async function DELETE(req: NextRequest) {

  try {

    const { searchParams } = new URL(req.url);

    const id = searchParams.get('id');



    if (!id) return NextResponse.json({ message: 'المعرف مفقود' }, { status: 400 });



    await prisma.distribution.delete({ where: { id } });

    return NextResponse.json({ message: 'تم الحذف بنجاح' });

  } catch (error: any) {

    return NextResponse.json({ message: 'فشل الحذف' }, { status: 500 });

  }

}