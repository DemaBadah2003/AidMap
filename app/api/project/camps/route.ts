// app/api/camps/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

/**
 * تحويل fillStatus القادم من الفرونت إلى enum الموجود في Prisma
 */
function toDbStatus(fillStatus: "Full" | "Not Full") {
  return fillStatus === "Full" ? "FULL" : "NOT_FULL";
}

/**
 * Zod Schemas
 */
const createSchema = z.object({
  nameAr: z.string().trim().min(1, "Camp name is required"),
  areaAr: z.string().trim().optional().default(""),
  capacity: z.coerce.number().int().positive("Capacity must be > 0"),
  fillStatus: z.enum(["Full", "Not Full"]).default("Not Full"),
  // optional: لو حابة تبعتيه من الفرونت لاحقًا
  supervisorId: z.string().uuid().optional(),
});

const updateSchema = z.object({
  nameAr: z.string().trim().min(1).optional(),
  areaAr: z.string().trim().optional(),
  capacity: z.coerce.number().int().positive().optional(),
  fillStatus: z.enum(["Full", "Not Full"]).optional(),
  supervisorId: z.string().uuid().optional(),
});

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

/**
 * GET /api/camps
 * يرجع كل المخيمات (مع supervisor)
 *
 * ✅ إضافة خاصة بالمستفيد:
 * GET /api/camps?forBeneficiary=true
 * يرجع فقط id + name لاستخدامها في dropdown
 */
export async function GET(req: NextRequest) {
  const forBeneficiary = req.nextUrl.searchParams.get("forBeneficiary");

  // ✅ هذا الجزء مضاف للمستفيد فقط
  if (forBeneficiary === "true") {
    const camps = await prisma.camps.findMany({
      where: { isTrashed: false },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json(camps);
  }

  const camps = await prisma.camps.findMany({
    where: { isTrashed: false },
    orderBy: { createdAt: "desc" },
    include: {
      supervisor: true,
    },
  });

  return NextResponse.json(camps);
}

/**
 * POST /api/camps
 * إنشاء مخيم
 */
export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json());

    // ✅ تحقق تكرار (Business validation)
    const exists = await prisma.camps.findFirst({
      where: {
        isTrashed: false,
        name: body.nameAr,
      },
      select: { id: true },
    });

    if (exists) {
      return NextResponse.json(
        { message: "Camp already exists (duplicate name)." },
        { status: 409 }
      );
    }

    // ✅ supervisorId إجباري في الجدول → نحلها تلقائيًا
    const supervisorId =
      body.supervisorId ?? (await getOrCreateDefaultSupervisorId());

    const created = await prisma.camps.create({
      data: {
        name: body.nameAr,
        area: body.areaAr || null,
        capacity: body.capacity,
        status: toDbStatus(body.fillStatus),
        supervisorId,
      },
      include: {
        supervisor: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    // Zod errors
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", issues: e.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/camps?id=...
 * تحديث مخيم
 */
export async function PUT(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }

  try {
    const body = updateSchema.parse(await req.json());

    // ✅ تحقق التكرار لو الاسم انبعت
    if (body.nameAr) {
      const exists = await prisma.camps.findFirst({
        where: {
          isTrashed: false,
          name: body.nameAr,
          NOT: { id },
        },
        select: { id: true },
      });

      if (exists) {
        return NextResponse.json(
          { message: "Camp already exists (duplicate name)." },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.camps.update({
      where: { id },
      data: {
        name: body.nameAr,
        area: body.areaAr,
        capacity: body.capacity,
        status: body.fillStatus ? toDbStatus(body.fillStatus) : undefined,
        supervisorId: body.supervisorId,
      },
      include: { supervisor: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", issues: e.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/camps?id=...  -> soft delete
 * DELETE /api/camps?all=true -> soft delete all
 */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const all = req.nextUrl.searchParams.get("all");

  try {
    if (all === "true") {
      await prisma.camps.updateMany({
        where: { isTrashed: false },
        data: { isTrashed: true },
      });
      return NextResponse.json({ ok: true });
    }

    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }

    await prisma.camps.update({
      where: { id },
      data: { isTrashed: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}