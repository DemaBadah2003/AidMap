import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const arabicNameRegex = /^[\u0600-\u06FF\s]+$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
const phoneRegex = /^(056|059)\d{7}$/;
const twoDigitsRegex = /^\d{2}$/;

const createSchema = z.object({
  name: z
    .string()
    .min(1, "الاسم مطلوب")
    .refine((value) => value.trim().length > 0, {
      message: "الاسم مطلوب",
    })
    .refine((value) => value === value.trim(), {
      message: "الاسم لا يجب أن يبدأ أو ينتهي بمسافة",
    })
    .refine((value) => arabicNameRegex.test(value), {
      message: "الاسم يجب أن يكون باللغة العربية فقط",
    })
    .refine((value) => !/\s{2,}/.test(value), {
      message: "لا يمكن وضع أكثر من مسافة بين الكلمات",
    }),

  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .refine((value) => value === value.trim(), {
      message: "البريد الإلكتروني لا يجب أن يبدأ أو ينتهي بمسافة",
    })
    .refine((value) => emailRegex.test(value), {
      message:
        "البريد الإلكتروني يجب أن يكون بالإنجليزية قبل @، ويحتوي على @، وينتهي بـ .com",
    }),

  password: z
    .string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .refine((value) => value.trim().length > 0, {
      message: "كلمة المرور مطلوبة",
    }),

  phone: z
    .string()
    .min(1, "رقم الجوال مطلوب")
    .refine((value) => /^\d+$/.test(value), {
      message: "رقم الجوال يجب أن يحتوي على أرقام فقط",
    })
    .refine((value) => phoneRegex.test(value), {
      message: "رقم الجوال يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام",
    }),

  numberOfFamily: z
    .string()
    .min(1, "عدد أفراد الأسرة مطلوب")
    .refine((value) => /^\d+$/.test(value), {
      message: "عدد أفراد الأسرة يجب أن يحتوي على أرقام فقط",
    })
    .refine((value) => twoDigitsRegex.test(value), {
      message: "عدد أفراد الأسرة يجب أن يكون مكونًا من رقمين فقط",
    })
    .transform((value) => Number(value)),
});

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Beneficiary register API is working",
  });
}

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

    const body = createSchema.parse(jsonBody);

    const normalizedName = body.name.trim();
    const normalizedEmail = body.email.trim().toLowerCase();
    const normalizedPhone = body.phone.trim();

    const existingEmailUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingEmailUser) {
      return NextResponse.json(
        { field: "email", message: "هذا البريد الإلكتروني مستخدم بالفعل" },
        { status: 409 }
      );
    }

    const existingPhoneBeneficiary = await prisma.beneficiary.findFirst({
      where: { phone: normalizedPhone },
      select: { id: true },
    });

    if (existingPhoneBeneficiary) {
      return NextResponse.json(
        { field: "phone", message: "رقم الجوال مستخدم بالفعل" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(body.password);

    const result = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          role: "beneficiary",
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      const createdBeneficiary = await tx.beneficiary.create({
        data: {
          name: normalizedName,
          phone: normalizedPhone,
          numberOfFamily: body.numberOfFamily,
          userId: createdUser.id,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          numberOfFamily: true,
          userId: true,
          createdAt: true,
        },
      });

      return {
        user: createdUser,
        beneficiary: createdBeneficiary,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم تسجيل المستفيد بنجاح",
        data: result,
      },
      { status: 201 }
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