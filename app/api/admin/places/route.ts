import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const place = await prisma.place.create({
      data: {
        name: body.name,
        type: body.type,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        status: body.status ?? "AVAILABLE",
        isActive: body.isActive ?? true,
        isTrashed: false,
        isProtected: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Place created",
      data: place,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create place",
      },
      { status: 500 }
    )
  }
}