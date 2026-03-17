import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/app/api/project/helpers/api-guards";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

async function getOrCreateDefaultSupervisorId() {
  const existing = await prisma.supervisor.findFirst({
    where: { isTrashed: false },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (existing?.id) return existing.id;

  const created = await prisma.supervisor.create({
    data: {
      name: "Default Supervisor",
      status: "ACTIVE",
    },
    select: { id: true },
  });

  return created.id;
}

export async function POST(req: NextRequest) {
  const unauthorized = requireAdminApi(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();

    const name = body?.name?.trim();
    const phone = body?.phone?.trim();
    const numberOfFamily = body?.numberOfFamily;
    const selectedCampName = body?.campId?.trim() || null;

    if (!name) {
      return NextResponse.json(
        { message: "الاسم مطلوب" },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { message: "رقم الهاتف مطلوب" },
        { status: 400 }
      );
    }

    if (
      numberOfFamily === undefined ||
      numberOfFamily === null ||
      numberOfFamily === ""
    ) {
      return NextResponse.json(
        { message: "عدد أفراد الأسرة مطلوب" },
        { status: 400 }
      );
    }

    const parsedNumberOfFamily = Number(numberOfFamily);

    if (Number.isNaN(parsedNumberOfFamily) || parsedNumberOfFamily <= 0) {
      return NextResponse.json(
        { message: "عدد أفراد الأسرة غير صحيح" },
        { status: 400 }
      );
    }

    let realCampId: string | null = null;

    if (selectedCampName) {
      const existingCamp = await prisma.camps.findFirst({
        where: {
          isTrashed: false,
          name: selectedCampName,
        },
        select: {
          id: true,
        },
      });

      if (existingCamp) {
        realCampId = existingCamp.id;
      } else {
        const supervisorId = await getOrCreateDefaultSupervisorId();

        const createdCamp = await prisma.camps.create({
          data: {
            name: selectedCampName,
            area: null,
            capacity: 0,
            status: "NOT_FULL",
            supervisorId,
          },
          select: {
            id: true,
          },
        });

        realCampId = createdCamp.id;
      }
    }

    const beneficiary = await prisma.beneficiary.create({
      data: {
        name,
        phone,
        numberOfFamily: parsedNumberOfFamily,
        campId: realCampId,
      },
      include: {
        camp: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "تمت إضافة المستفيد بنجاح",
        beneficiary,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/adminBeneficiary error:", error);

    return NextResponse.json(
      {
        message: "حدث خطأ في السيرفر",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}