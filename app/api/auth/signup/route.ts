import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import {
  getSignupSchema,
  SignupSchemaType,
} from '@/app/(auth)/forms/signup-schema';
import { UserStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = getSignupSchema().safeParse(body);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { message: 'البيانات غير صالحة.', fieldErrors },
        { status: 400 },
      );
    }

    const { email, password, name }: SignupSchemaType = result.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { message: 'البريد الإلكتروني مسجّل بالفعل.' },
        { status: 409 },
      );
    }

    const defaultRole = await prisma.userRole.findFirst({
      where: { isDefault: true },
    });

    if (!defaultRole) {
      return NextResponse.json(
        { message: 'إعداد الخادم ناقص: لا يوجد دور افتراضي للمستخدم.' },
        { status: 500 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        roleId: defaultRole.id,
      },
    });

    return NextResponse.json(
      { message: 'تم التسجيل بنجاح. يمكنك تسجيل الدخول الآن.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Signup:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء التسجيل.' },
      { status: 500 },
    );
  }
}
