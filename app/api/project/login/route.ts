import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صالح"),
  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة"),
});

export async function POST(req: NextRequest) {
  try {
    let jsonBody: unknown;

    try {
      jsonBody = await req.json();
    } catch {
      return NextResponse.json(
        { message: "البيانات المرسلة ليست JSON صالحًا" },
        { status: 400 }
      );
    }

    const body = loginSchema.parse(jsonBody);

    const email = body.email.trim().toLowerCase();
    const password = body.password;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    const hashedPassword = await hashPassword(password);

    if (user.password !== hashedPassword) {
      return NextResponse.json(
        { message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "تم تسجيل الدخول بنجاح",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "فشل التحقق من صحة البيانات",
          issues: e.issues.map((issue) => ({
            field: String(issue.path[0] ?? ""),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: e instanceof Error ? e.message : "حدث خطأ في الخادم",
      },
      { status: 500 }
    );
  }
}