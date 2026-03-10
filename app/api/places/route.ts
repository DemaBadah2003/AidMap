import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

type AdminPlaceType = 'shelter' | 'hospital' | 'water' | 'food'

type AdminPlace = {
  id: string
  name: string
  type: AdminPlaceType
  lng: number
  lat: number
  operator?: string
  capacity?: number | null
  occupancy?: number | null
  availableBeds?: number | null
  statusText?: string
  createdAt?: string
  updatedAt?: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'places.json')

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })

  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, '[]', 'utf-8')
  }
}

async function readPlaces(): Promise<AdminPlace[]> {
  await ensureDataFile()
  const raw = await fs.readFile(DATA_FILE, 'utf-8')

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    let places = await readPlaces()

    if (type && ['shelter', 'hospital', 'water', 'food'].includes(type)) {
      places = places.filter((p) => p.type === type)
    }

    return NextResponse.json({
      success: true,
      count: places.length,
      data: places,
    })
  } catch (error) {
    console.error('GET /api/places error:', error)
    return NextResponse.json(
      { success: false, message: 'فشل في جلب الأماكن للخريطة' },
      { status: 500 }
    )
  }
}