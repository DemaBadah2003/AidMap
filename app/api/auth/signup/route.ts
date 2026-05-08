import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/services/send-email';
import {
  getSignupSchema,
  SignupSchemaType,
} from '@/app/(auth)/forms/signup-schema';
import { UserStatus, VerificationTokenPurpose } from '@prisma/client';

const VERIFY_TTL_MS = 60 * 60 * 1000;

async function sendVerificationEmail(
  userId: string,
  email: string,
  name: string | null | undefined,
  rawToken: string,
) {
  const base = process.env.NEXTAUTH_URL || '';
  const verificationUrl = `${base}/verify-email?token=${encodeURIComponent(rawToken)}`;

  await sendEmail({
    to: email,
    subject: 'تفعيل الحساب — AidMap',
    content: {
      title: `مرحبًا، ${name || 'مستخدم'}`,
      subtitle:
        'اضغط على الزر أدناه لتفعيل بريدك الإلكتروني وتفعيل الحساب.',
      buttonLabel: 'تفعيل الحساب',
      buttonUrl: verificationUrl,
      description:
        'الرابط صالح لمدة ساعة. إن لم تطلب هذا الرسالة يمكن تجاهله.',
    },
  });
}

async function createVerificationTokenRow(
  userId: string,
  purpose: VerificationTokenPurpose,
) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + VERIFY_TTL_MS);
  await prisma.verificationToken.deleteMany({
    where: { identifier: userId, purpose },
  });
  await prisma.verificationToken.create({
    data: {
      identifier: userId,
      token: rawToken,
      expires,
      purpose,
    },
  });
  return rawToken;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = getSignupSchema().safeParse(body);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          message: 'البيانات غير صالحة.',
          fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email, password, name }: SignupSchemaType = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (existingUser) {
      if (existingUser.status === UserStatus.INACTIVE) {
        const raw = await createVerificationTokenRow(
          existingUser.id,
          VerificationTokenPurpose.EMAIL_VERIFY,
        );
        await sendVerificationEmail(
          existingUser.id,
          existingUser.email,
          existingUser.name,
          raw,
        );
        return NextResponse.json(
          { message: 'تمت إعادة إرسال رسالة التفعيل. تحقق من بريدك.' },
          { status: 200 },
        );
      }
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

    let userId: string;
    let emailAddr: string;
    let dispName: string | null;

    try {
      const created = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            status: UserStatus.INACTIVE,
            roleId: defaultRole.id,
          },
          include: { role: true },
        });
        await tx.verificationToken.deleteMany({
          where: {
            identifier: user.id,
            purpose: VerificationTokenPurpose.EMAIL_VERIFY,
          },
        });
        const rawToken = crypto.randomBytes(32).toString('hex');
        await tx.verificationToken.create({
          data: {
            identifier: user.id,
            token: rawToken,
            expires: new Date(Date.now() + VERIFY_TTL_MS),
            purpose: VerificationTokenPurpose.EMAIL_VERIFY,
          },
        });
        return { userId: user.id, emailAddr: user.email, dispName: user.name };
      });

      ({ userId } = created);
      ({ emailAddr } = created);
      ({ dispName } = created);
    } catch (e) {
      console.error('Signup transaction:', e);
      return NextResponse.json(
        { message: 'فشل إنشاء الحساب.' },
        { status: 500 },
      );
    }

    try {
      const tokenRow = await prisma.verificationToken.findFirst({
        where: {
          identifier: userId,
          purpose: VerificationTokenPurpose.EMAIL_VERIFY,
        },
        select: { token: true },
      });
      if (tokenRow) {
        await sendVerificationEmail(
          userId,
          emailAddr,
          dispName,
          tokenRow.token,
        );
      }
    } catch (mailErr) {
      console.error('Signup email:', mailErr);
      await prisma.verificationToken.deleteMany({
        where: {
          identifier: userId,
          purpose: VerificationTokenPurpose.EMAIL_VERIFY,
        },
      });
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
      return NextResponse.json(
        { message: 'تعذر إرسال بريد التفعيل. أعد المحاولة لاحقًا.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message:
          'تم التسجيل. تحقق من بريدك لتفعيل الحساب.',
      },
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
