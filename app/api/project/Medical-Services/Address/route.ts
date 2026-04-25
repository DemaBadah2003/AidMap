import prisma from "@/lib/prisma"; 
import { NextResponse } from "next/server";

// جلب العناوين
export async function GET() {
  try {
    const data = await prisma.address.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "فشل جلب البيانات" }, { status: 500 });
  }
}

// إضافة عنوان جديد
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // التحقق من وجود البيانات المطلوبة حسب السكيما
    if (!body.title || !body.description) {
      return NextResponse.json({ error: "الحقول مطلوبة" }, { status: 400 });
    }

    const newItem = await prisma.address.create({
      data: {
        title: body.title,        // الموقع العام
        description: body.description, // الموقع التفصيلي
      },
    });
    
    return NextResponse.json(newItem);
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "فشل إضافة الموقع" }, { status: 500 });
  }
}

// تعديل عنوان
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: "المعرف مطلوب" }, { status: 400 });
    }

    if (!body.title || !body.description) {
      return NextResponse.json({ error: "الحقول مطلوبة" }, { status: 400 });
    }

    const updatedItem = await prisma.address.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: "فشل تحديث الموقع" }, { status: 500 });
  }
}

// حذف عنوان
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "المعرف مطلوب" }, { status: 400 });
    }

    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "فشل حذف الموقع" }, { status: 500 });
  }
}