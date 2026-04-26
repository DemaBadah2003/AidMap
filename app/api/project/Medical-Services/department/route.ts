import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { HospitalType, Region } from '@prisma/client';

// 1. جلب البيانات (GET)
export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { createdAt: 'desc' },
      include: { hospital: true } // لجلب اسم المستشفى التابع له إذا لزم الأمر
    });
    return NextResponse.json(departments);
  } catch (error: any) {
    return NextResponse.json({ error: "فشل في جلب الأقسام" }, { status: 500 });
  }
}

// 2. إضافة قسم (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, deptType, status, description } = body;

    // التحقق من المدخلات الأساسية
    if (!name || !deptType) {
      return NextResponse.json({ error: "التخصص واسم القسم مطلوبان" }, { status: 400 });
    }

    // البحث عن مستشفى لربط القسم به (لأن السكيما تفرضه حالياً)
    let hospital = await prisma.hospital.findFirst();

    // إذا لم يوجد أي مستشفى في النظام، ننشئ واحداً "افتراضياً"
    if (!hospital) {
      hospital = await prisma.hospital.create({
        data: {
          name: "المستشفى الرئيسي (تلقائي)",
          type: HospitalType.GOVERNMENT,
          region: Region.NORTH,
          phone: "00000000",
          // إنشاء سجل عنوان فارغ لكسر القيود
          address: {
            create: { title: "عنوان افتراضي", region: Region.NORTH }
          }
        }
      });
    }

    // إنشاء القسم وربطه بالمستشفى
    const newDept = await prisma.department.create({
      data: {
        name,
        deptType,
        status: status || "يعمل بكفاءة",
        description: description || '',
        hospitalId: hospital.id, // الربط الإلزامي
      },
    });

    return NextResponse.json(newDept, { status: 201 });
  } catch (error: any) {
    console.error("DETAILED ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. تعديل قسم (PUT)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, deptType, status, description } = body;

    const updatedDept = await prisma.department.update({
      where: { id },
      data: {
        name,
        deptType,
        status,
        description,
      },
    });

    return NextResponse.json(updatedDept);
  } catch (error: any) {
    return NextResponse.json({ error: "فشل في تحديث البيانات" }, { status: 500 });
  }
}

// 4. حذف قسم (DELETE)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID مطلوب" }, { status: 400 });

    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ message: "تم الحذف بنجاح" });
  } catch (error: any) {
    return NextResponse.json({ error: "فشل في الحذف" }, { status: 500 });
  }
}