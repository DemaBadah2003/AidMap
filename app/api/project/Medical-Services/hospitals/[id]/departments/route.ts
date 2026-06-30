import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// ======================================
// GET - جلب الأقسام الخاصة بمستشفى معين
// ======================================
export async function GET(
  req: NextRequest,
  context: any // استخدام any لتجنب أخطاء النوع أثناء الـ Build
) {
  try {
    const { id } = await context.params;
    const departments = await prisma.department.findMany({
      where: { hospitalId: id },
      include: { hospital: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = departments.map((d) => ({
      id: d.id,
      name: d.name,
      deptType: d.deptType,
      status: d.status,
      description: d.description,
      hospitalId: d.hospitalId,
      hospitalName: d.hospital?.name || '',
      createdAt: d.createdAt,
    }))

    return NextResponse.json(formatted)
  } catch (e) {
    console.error('GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
  }
}

// ======================================
// POST - إضافة قسم جديد
// ======================================
export async function POST(
  req: NextRequest,
  context: any // استخدام any
) {
  try {
    const { id } = await context.params;
    const body = await req.json()

    if (!body.name?.trim() || !body.deptType?.trim()) {
      return NextResponse.json({ error: 'name and deptType are required' }, { status: 400 })
    }

    const department = await prisma.department.create({
      data: {
        name: body.name.trim(),
        deptType: body.deptType.trim(),
        status: body.status || 'يعمل بكفاءة',
        description: body.description?.trim() || null,
        hospitalId: id,
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (e) {
    console.error('POST error:', e)
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 })
  }
}

// ======================================
// PATCH - تعديل بيانات القسم
// ======================================
export async function PATCH(
  request: Request,
  context: any // استخدام any هنا يحل المشكلة نهائياً
) {
  try {
    await context.params; 
    const body = await request.json();
    const { id, name, deptType, status, description } = body;

    const updatedDepartment = await prisma.department.update({
      where: { id: id },
      data: {
        name,
        deptType,
        status,
        description
      },
    });

    return NextResponse.json(updatedDepartment);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "فشل تحديث القسم" }, { status: 500 });
  }
}

// ======================================
// DELETE - حذف قسم نهائياً
// ======================================
export async function DELETE(
  req: NextRequest,
  context: any // استخدام any
) {
  try {
    await context.params;
    const { searchParams } = new URL(req.url)
    const deptId = searchParams.get('id')

    if (!deptId) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 })
    }

    await prisma.department.delete({
      where: { id: deptId },
    })

    return NextResponse.json({ success: true, message: 'Deleted successfully' })
  } catch (e) {
    console.error('DELETE error:', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}