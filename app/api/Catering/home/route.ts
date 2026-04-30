import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// نمط Singleton لـ Prisma لتجنب خطأ 500 بسبب كثرة الاتصالات
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

function normalizeArabic(text: string): string {
    if (!text) return "";
    return text
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/\s+/g, " ")
        .trim();
}

function getMajorRegion(subRegion: string): string {
    if (!subRegion) return "أخرى";
    const normalizedInput = normalizeArabic(subRegion);
    
    const regionsMap: Record<string, string[]> = {
        "شمال": ["بيت لاهيا", "جباليا", "بيت حانون", "التوام", "العطاطرة", "الصفطاوي", "شمال"],
        "غرب": ["شاطئ", "رمال", "نصر", "تل الهوى", "شيخ عجلين", "غرب", "ميناء"],
        "شرق": ["شجاعية", "تفاح", "درج", "زيتون", "شرق", "شعف"],
        "جنوب": ["خانيونس", "رفح", "وسطى", "دير البلح", "نصيرات", "جنوب", "مغازي", "بريج"]
    };

    for (const [major, subs] of Object.entries(regionsMap)) {
        if (subs.some(sub => normalizedInput.includes(normalizeArabic(sub)))) {
            return major;
        }
    }
    return "أخرى";
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const regionFilter = searchParams.get('region');
        const typeFilter = searchParams.get('type');

        // جلب البيانات مع التأكد من وجود الجداول
        const [waterPoints, foodPoints] = await Promise.all([
            typeFilter !== 'نقاط طعام فقط' 
                ? prisma.waterPoint.findMany({ include: { place: true } }) 
                : Promise.resolve([]),
            typeFilter !== 'نقاط مياه فقط' 
                ? prisma.foodPoint.findMany() 
                : Promise.resolve([])
        ]);

        const allPoints = [
            ...waterPoints.map(wp => ({
                id: `w-${wp.id}`,
                majorRegion: getMajorRegion(wp.place?.name || ""),
                subRegion: wp.place?.name || "غير محدد",
                type: 'ماء',
                status: wp.status === 'OPERATIONAL' ? 'متوفر' : 'غير متوفر'
            })),
            ...foodPoints.map(fp => ({
                id: `f-${fp.id}`,
                majorRegion: getMajorRegion(fp.region || fp.location || ""),
                subRegion: fp.region || fp.location || "غير محدد",
                type: 'طعام',
                status: fp.status === 'OPERATIONAL' ? 'متوفر' : 'غير متوفر'
            }))
        ];

        let filtered = allPoints;
        if (regionFilter && regionFilter !== 'كل المناطق') {
            filtered = allPoints.filter(p => p.majorRegion === regionFilter);
        }

        return NextResponse.json(filtered);
    } catch (error: any) {
        console.error("CRITICAL ERROR:", error);
        // إرجاع رسالة خطأ واضحة بدل الانهيار الصامت
        return NextResponse.json({ 
            error: 'حدث خطأ في السيرفر', 
            details: error.message 
        }, { status: 500 });
    }
}