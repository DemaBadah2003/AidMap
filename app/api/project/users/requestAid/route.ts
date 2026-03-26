import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const phoneRegex = /^(056|059)\d{7}$/;
const nationalIdRegex = /^\d{9}$/;
const repeatedDigitsRegex = /^(\d)\1+$/;

function validateNationalId(id: string) {
  if (!id) return "رقم الهوية مطلوب";
  if (!/^\d+$/.test(id)) return "رقم الهوية يجب أن يحتوي على أرقام فقط";
  if (!nationalIdRegex.test(id)) return "رقم الهوية يجب أن يحتوي على 9 أرقام";
  if (id === "000000000") return "رقم الهوية غير صالح";
  if (repeatedDigitsRegex.test(id)) return "رقم الهوية غير صالح";
  return null;
}

function validatePhone(phone: string) {
  if (!phone) return "رقم الجوال مطلوب";
  if (!/^\d+$/.test(phone)) return "رقم الجوال يجب أن يحتوي على أرقام فقط";
  if (!phoneRegex.test(phone)) {
    return "رقم الجوال يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام";
  }
  return null;
}

function validateFamilyCount(count: number) {
  if (count === undefined || count === null || Number.isNaN(count)) {
    return "عدد أفراد الأسرة مطلوب";
  }

  if (!Number.isInteger(count)) {
    return "عدد أفراد الأسرة يجب أن يكون رقمًا صحيحًا";
  }

  if (count < 1) {
    return "عدد أفراد الأسرة يجب أن يكون أكبر من صفر";
  }

  if (count > 20) {
    return "عدد أفراد الأسرة يجب أن يكون بين 1 و 20";
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fullName = String(body.fullName ?? "").trim();
    const nationalId = String(body.nationalId ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const aidType = String(body.aidType ?? "").trim();
    const familyCount = Number(body.familyCount);
    const address = String(body.address ?? "").trim();
    const notes =
      body.notes !== undefined && body.notes !== null
        ? String(body.notes).trim()
        : "";

    if (!fullName) {
      return NextResponse.json(
        { message: "الاسم الكامل مطلوب" },
        { status: 400 }
      );
    }

    if (!aidType) {
      return NextResponse.json(
        { message: "نوع المساعدة مطلوب" },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { message: "العنوان / المخيم / المنطقة مطلوب" },
        { status: 400 }
      );
    }

    const nationalIdError = validateNationalId(nationalId);
    if (nationalIdError) {
      return NextResponse.json(
        { message: nationalIdError },
        { status: 400 }
      );
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      return NextResponse.json(
        { message: phoneError },
        { status: 400 }
      );
    }

    const familyCountError = validateFamilyCount(familyCount);
    if (familyCountError) {
      return NextResponse.json(
        { message: familyCountError },
        { status: 400 }
      );
    }

    const createdRequest = await prisma.requestAid.create({
      data: {
        fullName,
        nationalId,
        phone,
        aidType,
        familyCount,
        address,
        notes: notes || null,
        requestNumber: `REQ-${Date.now()}`,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم استلام طلب المساعدة بنجاح",
        data: createdRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}