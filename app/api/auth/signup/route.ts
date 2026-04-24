import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/services/send-email';
import {
  getSignupSchema,
  SignupSchemaType,
} from '@/app/(auth)/forms/signup-schema';

// دالة محسنة لإرسال إيميل التفعيل
async function sendVerificationEmail(userId: string, userEmail: string, userName: string) {
  // إنشاء توكن عشوائي آمن (أفضل من الهاش الذي يحتوي على رموز غريبة)
  const tokenString = Math.random().toString(36).substring(2) + Date.now().toString(36);

  const token = await prisma.verificationToken.create({
    data: {
      identifier: userId,
      token: tokenString,
      expires: new Date(Date.now() + 1 * 60 * 60 * 1000), // ساعة واحدة
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/verify-email?token=${token.token}`;

  await sendEmail({
    to: userEmail,
    subject: 'تفعيل الحساب - نظام الإغاثة',
    content: {
      title: `أهلاً بك، ${userName}`,
      subtitle: 'يرجى الضغط على الزر أدناه لتفعيل حسابك والبدء في استخدام النظام.',
      buttonLabel: 'تفعيل الحساب',
      buttonUrl: verificationUrl,
      description: 'هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب هذا التسجيل، يمكنك تجاهل الرسالة.',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. التحقق من صحة البيانات باستخدام Zod
    const result = getSignupSchema().safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: 'البيانات المدخلة غير صالحة. يرجى التأكد من الحقول.' },
        { status: 400 }
      );
    }

    const { email, password, name }: SignupSchemaType = result.data;

    // 2. التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.status === 'INACTIVE') {
        // إذا كان الحساب موجوداً ولكنه غير مفعل، نحذف التوكنات القديمة ونرسل واحداً جديداً
        await prisma.verificationToken.deleteMany({ where: { identifier: existingUser.id } });
        await sendVerificationEmail(existingUser.id, existingUser.email, existingUser.name || 'مستخدم');
        return NextResponse.json(
          { message: 'هذا الحساب موجود مسبقاً ولكنه غير مفعل. تم إعادة إرسال بريد التفعيل.' },
          { status: 200 }
        );
      }
      return NextResponse.json({ message: 'هذا البريد الإلكتروني مسجل مسبقاً.' }, { status: 409 });
    }

    // 3. جلب الـ Role الافتراضي (المواطن)
    const defaultRole = await prisma.userRole.findFirst({
      where: { isDefault: true },
    });

    if (!defaultRole) {
      console.error("Critical Error: No default role found in database.");
      return NextResponse.json(
        { message: 'خطأ في إعدادات النظام: لم يتم العثور على الصلاحيات الافتراضية.' },
        { status: 500 }
      );
    }

    // 4. تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. إنشاء المستخدم في قاعدة البيانات
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        status: 'INACTIVE',
        roleId: defaultRole.id,
      },
    });

    // 6. إرسال بريد التفعيل
    try {
      await sendVerificationEmail(user.id, user.email, user.name || 'مستخدم');
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // لا نوقف العملية هنا، المستخدم أُنشئ بالفعل ويمكنه طلب إعادة الإرسال لاحقاً
    }

    return NextResponse.json(
      { message: 'تم التسجيل بنجاح! يرجى مراجعة بريدك الإلكتروني لتفعيل الحساب.' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { message: 'حدث خطأ داخلي أثناء التسجيل. يرجى المحاولة لاحقاً.' },
      { status: 500 }
    );
  }
}