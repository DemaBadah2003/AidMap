import { NextRequest, NextResponse } from 'next/server';
import   prisma  from '@/lib/prisma'; // تأكد من صحة مسار ملف البريسما لديك

/**
 * 1. GET: جلب القضايا + جلب بيانات الطلاب والمدارس من جداولهم
 */
export async function GET() {
  try {
    // جلب القضايا التعليمية التي لم تحذف
    const cases = await prisma.studentIssue.findMany({
      where: { isTrashed: false },
      orderBy: { createdAt: 'desc' },
    });

    // جلب أسماء الطلاب من جدول الطلاب (students)
    const students = await prisma.student.findMany({
      select: { name: true },
      where: { isTrashed: false }
    });

    // جلب أسماء المدارس من جدول المدارس (schools)
    const schools = await prisma.school.findMany({
      select: { name: true },
      where: { isTrashed: false }
    });

    // تنسيق البيانات لتتوافق مع أسماء الحقول في الفرونت إند
    const formattedCases = cases.map((item) => ({
      id: item.id,
      caseType: item.issueType, //Mapping
      studyLevel: item.level,   //Mapping
      studentName: item.studentName,
      schoolName: item.schoolName,
      status: item.status,
    }));

    return NextResponse.json({
      cases: formattedCases,
      studentList: students.map(s => s.name), // مصفوفة أسماء الطلاب
      schoolList: schools.map(s => s.name)    // مصفوفة أسماء المدارس
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

/**
 * 2. POST: إضافة قضية جديدة
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseType, studyLevel, studentName, schoolName, status } = body;

    const newCase = await prisma.studentIssue.create({
      data: {
        issueType: caseType,
        level: studyLevel,
        studentName, // القيمة القادمة من قائمة الطلاب المختارة
        schoolName,  // القيمة القادمة من قائمة المدارس المختارة
        status: status || 'جديد',
      },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}

/**
 * 3. PATCH: تحديث بيانات قضية
 */
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id'); // الحصول على المعرف من الرابط
    const body = await req.json();

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updatedCase = await prisma.studentIssue.update({
      where: { id },
      data: {
        issueType: body.caseType,
        level: body.studyLevel,
        studentName: body.studentName,
        schoolName: body.schoolName,
        status: body.status,
      },
    });

    return NextResponse.json(updatedCase);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

/**
 * 4. DELETE: نقل للسلة (Soft Delete)
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.studentIssue.update({
      where: { id },
      data: { isTrashed: true }, // التحديث بدلاً من الحذف النهائي
    });

    return NextResponse.json({ message: 'Moved to trash' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}