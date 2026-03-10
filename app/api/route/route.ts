import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams

    const fromLat = params.get("fromLat")
    const fromLng = params.get("fromLng")
    const toLat = params.get("toLat")
    const toLng = params.get("toLng")

    if (!fromLat || !fromLng || !toLat || !toLng) {
      return NextResponse.json(
        { success: false, message: "Missing coordinates" },
        { status: 400 }
      )
    }

    const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`

    const res = await fetch(url)
    const data = await res.json()

    const route = data.routes[0]

    return NextResponse.json({
      success: true,
      data: {
        distanceKm: route.distance / 1000,
        durationMin: route.duration / 60,
        geometry: route.geometry,
      },
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { success: false, message: "Route error" },
      { status: 500 }
    )
  }
}