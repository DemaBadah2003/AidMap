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