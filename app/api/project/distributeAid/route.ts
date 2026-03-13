import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { DistributeAidFormStatus } from "@prisma/client";

const distributeSchema = z.object({
  beneficiaryName: z.string().trim().min(1, "اسم المستفيد مطلوب"),
  aidType: z.string().trim().min(1, "نوع المساعدة مطلوب"),
  quantity: z.number().int("الكمية يجب أن تكون رقمًا صحيحًا").positive("الكمية يجب أن تكون أكبر من 0"),
  distributionDate: z.string().min(1, "تاريخ التوزيع مطلوب"),
  institutionId: z.string().optional().nullable(),
  status: z.nativeEnum(DistributeAidFormStatus).optional(),
  notes: z.string().optional().nullable(),
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

    const body = distributeSchema.parse(jsonBody);

    const parsedDate = new Date(body.distributionDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { message: "تاريخ التوزيع غير صالح" },
        { status: 400 }
      );
    }

    const distribution = await prisma.distributeAidForm.create({
      data: {
        beneficiaryName: body.beneficiaryName,
        aidType: body.aidType,
        quantity: body.quantity,
        distributionDate: parsedDate,
        institutionId: body.institutionId?.trim() ? body.institutionId.trim() : null,
        status: body.status ?? DistributeAidFormStatus.SCHEDULED,
        notes: body.notes?.trim() ? body.notes.trim() : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم حفظ توزيع المساعدة بنجاح",
        distribution,
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

export async function GET() {
  try {
    const distributions = await prisma.distributeAidForm.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(distributions, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      {
        message: e instanceof Error ? e.message : "حدث خطأ أثناء جلب البيانات",
      },
      { status: 500 }
    );
  }
}