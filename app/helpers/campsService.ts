// app/helpers/campsService.ts
import { z } from "zod";

export type FillStatus = "Full" | "Not Full";

export type CampApiItem = {
  id: string;
  name: string;
  area?: string | null;
  capacity: number;
  status: "FULL" | "NOT_FULL";
};

const BASE_URL = "/api/project/camps";

/* =========================
   1) التحقق من صحة البيانات باستخدام Zod
========================= */

// Create schema
const createCampSchema = z.object({
  nameAr: z.string().trim().min(1, "Camp name is required"),
  areaAr: z.string().trim().optional().default(""),
  capacity: z.coerce.number().int().positive("Capacity must be > 0"),
  fillStatus: z.enum(["Full", "Not Full"]),
});

// Update schema (partial)
const updateCampSchema = z
  .object({
    nameAr: z.string().trim().min(1).optional(),
    areaAr: z.string().trim().optional(),
    capacity: z.coerce.number().int().positive().optional(),
    fillStatus: z.enum(["Full", "Not Full"]).optional(),
  })
  .strict();

/* =========================
   Helper: request JSON + handle errors
========================= */
async function requestJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    const msg = data?.message ?? `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

/* =========================
   READ // قراءة جميع المخيمات
========================= */
export async function readCamps(): Promise<CampApiItem[]> {
  return requestJSON<CampApiItem[]>(BASE_URL);
}

/* =========================
   2) قراءة البيانات الحالية + 3) تحقق من التكرار (Business Validation)
========================= */
async function assertNoDuplicateCampName(nameAr: string) {
  const current = await readCamps();
  const exists = current.some(
    (c) => (c.name ?? "").trim().toLowerCase() === nameAr.trim().toLowerCase()
  );

  if (exists) {
    throw new Error("Camp already exists (duplicate name).");
  }
}

/* =========================
   4) CREATE // إنشاء Camp جديد
   - validate بـ Zod
   - read current
   - duplicate check
   - POST
========================= */
export async function createCamp(input: unknown): Promise<CampApiItem> {
  // ✅ validate using Zod
  const body = createCampSchema.parse(input);

  // ✅ Business validation
  await assertNoDuplicateCampName(body.nameAr);

  // ✅ Create (POST)
  return requestJSON<CampApiItem>(BASE_URL, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/* =========================
   UPDATE (مفيد لو تحتاجيه)
========================= */
export async function updateCamp(id: string, input: unknown): Promise<CampApiItem> {
  if (!id) throw new Error("Missing camp id");

  const body = updateCampSchema.parse(input);

  // لو الاسم انرسل، نعمل duplicate check ضد باقي العناصر
  if (body.nameAr) {
    const current = await readCamps();
    const exists = current.some(
      (c) =>
        c.id !== id &&
        (c.name ?? "").trim().toLowerCase() === body.nameAr!.trim().toLowerCase()
    );
    if (exists) throw new Error("Camp already exists (duplicate name).");
  }

  return requestJSON<CampApiItem>(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/* =========================
   DELETE
========================= */
export async function deleteCamp(id: string): Promise<void> {
  if (!id) throw new Error("Missing camp id");

  const res = await fetch(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Delete failed: ${res.status}`);
  }
}

/* =========================
   DELETEALL
========================= */
export async function deleteAllCamps(): Promise<void> {
  const res = await fetch(`${BASE_URL}?all=true`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Delete all failed: ${res.status}`);
  }
}

/* =========================
   واجهة موحدة (مثل استخدامك السابق)
========================= */
export const campsApi = {
  list: readCamps,
  create: createCamp,
  update: updateCamp,
  remove: deleteCamp,
  removeAll: deleteAllCamps,
};