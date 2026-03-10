import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma";
import { PlaceType } from "@prisma/client"

const ALLOWED_TYPES = Object.values(PlaceType)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const rawSearch = searchParams.get("search")?.trim() || ""
    const rawType = searchParams.get("type")?.trim() || ""

    const where: any = {
      isActive: true,
      isTrashed: false,
    }

    if (rawSearch) {
      where.OR = [
        {
          name: {
            contains: rawSearch,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: rawSearch,
            mode: "insensitive",
          },
        },
      ]
    }

    if (rawType && ALLOWED_TYPES.includes(rawType as PlaceType)) {
      where.type = rawType as PlaceType
    }

    const places = await prisma.place.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      count: places.length,
      filters: {
        search: rawSearch || null,
        type: rawType || null,
      },
      data: places.map((place) => ({
        id: place.id,
        name: place.name,
        type: place.type,
        description: place.description,
        lat: Number(place.latitude),
        lng: Number(place.longitude),
        status: place.status,
        isActive: place.isActive,
      })),
    })
  } catch (error) {
    console.error("GET /api/places error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load places",
      },
      { status: 500 }
    )
  }
}