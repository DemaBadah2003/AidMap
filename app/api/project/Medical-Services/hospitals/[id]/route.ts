import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const typeRevMap: Record<string, string> = { PRIVATE: 'خاص', UNRWA: 'وكالة', GOVERNMENT: 'حكومية' }
const regionRevMap: Record<string, string> = { NORTH: 'شمال', SOUTH: 'جنوب', EAST: 'شرق', WEST: 'غرب' }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        departments: {
          include: {
            doctors: true,
            services: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        doctors: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!hospital) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Flatten all services across all departments
    const services = hospital.departments.flatMap(d =>
      d.services.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        isAvailable: s.isAvailable,
        departmentId: s.departmentId,
        departmentName: d.name,
        hospitalId: hospital.id,
        hospitalName: hospital.name,
      }))
    )

    return NextResponse.json({
      id: hospital.id,
      hospitalName: hospital.name,
      hospitalType: typeRevMap[hospital.type] || hospital.type,
      region: regionRevMap[hospital.region] || hospital.region,
      phone: hospital.phone,
      latitude: hospital.latitude,
      longitude: hospital.longitude,
      departments: hospital.departments.map(d => ({
        id: d.id,
        name: d.name,
        deptType: d.deptType,
        status: d.status,
        description: d.description,
        doctorCount: d.doctors.length,
        serviceCount: d.services.length,
      })),
      doctors: hospital.doctors.map(d => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty,
        phone: d.phone,
        workSchedule: d.workSchedule,
        description: d.description,
        departmentId: d.departmentId,
      })),
      services,
    })
  } catch (e) {
    console.error('GET /hospitals/[id] error:', e)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
