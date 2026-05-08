import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaffApi } from '@/lib/api/auth';

function formatDistribution(dist: {
  id: string;
  quantity: number | null;
  status: string;
  beneficiaryId: string | null;
  productId: string | null;
  institution: { name: string } | null;
  product: { nameAr: string } | null;
  beneficiary: { name: string } | null;
}) {
  return {
    id: dist.id,
    quantity: dist.quantity || 0,
    status: dist.status,
    institutionName: dist.institution?.name || 'غير محدد',
    productName: dist.product?.nameAr || 'غير معروف',
    beneficiaryName: dist.beneficiary?.name || 'غير محدد',
    beneficiaryId: dist.beneficiaryId,
    productId: dist.productId,
  };
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireStaffApi(req);
  if (unauthorized) return unauthorized;

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
  } catch (error: unknown) {
    console.error('GET Error:', error);
    return NextResponse.json({ message: 'خطأ في جلب البيانات' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const unauthorized = await requireStaffApi(req);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(req.url);
    const idFromQuery = searchParams.get('id');
    const body = await req.json();
    const targetId = idFromQuery || body.id;

    if (!targetId) {
      return NextResponse.json({ message: 'المعرف (ID) مفقود' }, { status: 400 });
    }

    const updated = await prisma.distribution.update({
      where: { id: targetId },
      data: {
        quantity: body.quantity !== undefined ? Number(body.quantity) : undefined,
        status: body.status,
        beneficiaryId: body.beneficiaryId,
        productId: body.productId,
      },
      include: {
        beneficiary: true,
        product: true,
        institution: true,
      },
    });

    return NextResponse.json(formatDistribution(updated));
  } catch (error: unknown) {
    console.error('PUT Error:', error);
    return NextResponse.json(
      { message: 'فشل حفظ التعديلات في السيرفر', details: error instanceof Error ? error.message : '' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireStaffApi(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const institutionId = typeof body.institutionId === 'string' ? body.institutionId : null;

    const inst = institutionId
      ? await prisma.institution.findUnique({ where: { id: institutionId } })
      : await prisma.institution.findFirst();

    if (!inst) {
      return NextResponse.json(
        { message: 'لم يتم العثور على مؤسسة صالحة. أضف institutionId أو أنشئ مؤسسة.' },
        { status: 400 },
      );
    }

    const created = await prisma.distribution.create({
      data: {
        quantity: Number(body.quantity) || 0,
        status: body.status ?? 'PENDING',
        institutionId: inst.id,
        productId: body.productId ?? null,
        beneficiaryId: body.beneficiaryId ?? null,
        aidId: body.aidId ?? null,
      },
      include: {
        beneficiary: true,
        product: true,
        institution: true,
      },
    });

    return NextResponse.json(formatDistribution(created), { status: 201 });
  } catch (error: unknown) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { message: 'فشل الإضافة', details: error instanceof Error ? error.message : '' },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireStaffApi(req);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ message: 'المعرف مفقود' }, { status: 400 });

    await prisma.distribution.delete({ where: { id } });
    return NextResponse.json({ message: 'تم الحذف بنجاح' });
  } catch (error: unknown) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ message: 'فشل الحذف' }, { status: 500 });
  }
}
