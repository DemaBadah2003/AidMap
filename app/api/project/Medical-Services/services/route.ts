import { NextResponse } from 'next/server';

// بيانات تجريبية (يجب استبدالها بـ Prisma أو قاعدة بياناتك)
let mockServices = [
  { id: '1', serviceName: 'تخطيط قلب ECG', cost: 7, status: 'غير متوفرة' },
  { id: '2', serviceName: 'تثبيت كسور عاجل', cost: 8, status: 'متاحة' },
];

export async function GET() {
  return NextResponse.json(mockServices);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newService = {
      id: Math.random().toString(36).substr(2, 9),
      serviceName: body.serviceName,
      cost: Number(body.cost),
      status: body.status,
    };
    mockServices.push(newService);
    return NextResponse.json(newService, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "خطأ في الإضافة" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, serviceName, cost, status } = body;
    const index = mockServices.findIndex(s => s.id === id);
    if (index !== -1) {
      mockServices[index] = { id, serviceName, cost: Number(cost), status };
      return NextResponse.json(mockServices[index]);
    }
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: "خطأ في التعديل" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  mockServices = mockServices.filter(s => s.id !== id);
  return NextResponse.json({ success: true });
}