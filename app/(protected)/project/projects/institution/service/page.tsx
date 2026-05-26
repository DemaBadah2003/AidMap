'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Plus, ArrowRight, Pencil } from 'lucide-react'
import { requireAdmin } from '@/app/(protected)/project/helpers/route-guards'

// ─── الأنواع (Types) ──────────────────────────────────────────────────────────
type Hospital = { id: string; hospitalName: string; hospitalType: string; region: string; phone: string; latitude: number | null; longitude: number | null }
type Department = { id: string; name: string; deptType: string; status: string; description: string | null; doctorCount: number; serviceCount: number }
type Doctor = { id: string; name: string; specialty: string; phone: string; workSchedule: string; description: string | null; departmentId: string | null }
type Service = { id: string; name: string; price: number; isAvailable: boolean; departmentId: string; departmentName: string }

export default function HospitalDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    // ─── States ───────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'departments' | 'services' | 'doctors'>('doctors')
    const [hospital, setHospital] = useState<Hospital | null>(null)
    const [departments, setDepartments] = useState<Department[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [services, setServices] = useState<Service[]>([])
    
    // States الخاصة بإضافة طبيب
    const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [newDoctor, setNewDoctor] = useState({ 
        name: '', specialty: '', phone: '', workSchedule: '', departmentId: '' 
    })

    // ─── العمليات ─────────────────────────────────────────────────────────────
    const fetchHospital = useCallback(async () => {
        if (!id) return
        try {
            const res = await fetch(`/api/project/Medical-Services/hospitals/${id}`)
            if (res.ok) {
                const data = await res.json()
                setHospital(data)
                setDepartments(data.departments || [])
                setDoctors(data.doctors || [])
                setServices(data.services || [])
            }
        } finally { setLoading(false) }
    }, [id])

    useEffect(() => { fetchHospital() }, [fetchHospital])

    const handleAddDoctor = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newDoctor.name.trim() || !newDoctor.departmentId) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/project/Medical-Services/hospitals/${id}/doctors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDoctor),
            })

            if (res.ok) {
                const createdDoctor = await res.json()
                setDoctors((prev) => [createdDoctor, ...prev])
                setNewDoctor({ name: '', specialty: '', phone: '', workSchedule: '', departmentId: '' })
                setIsDoctorDialogOpen(false)
            }
        } catch (error) {
            console.error('Error adding doctor:', error)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>

    return (
        <div className="w-full px-4 py-6 space-y-6" dir="rtl">
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted"><ArrowRight /></button>
                <h1 className="text-2xl font-bold">{hospital?.hospitalName}</h1>
            </div>

            <div className="flex gap-1 border-b">
                {[{key: 'departments', label: 'الأقسام'}, {key: 'services', label: 'الخدمات'}, {key: 'doctors', label: 'الأطباء'}].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-5 py-3 text-sm font-semibold border-b-2 ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* TAB: الأطباء */}
            {tab === 'doctors' && (
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-0">
                        <div className="p-4 flex items-center justify-between border-b bg-slate-50/50">
                            <p className="font-semibold text-sm text-muted-foreground">إجمالي الأطباء: {doctors.length}</p>
                            
                            <Dialog open={isDoctorDialogOpen} onOpenChange={setIsDoctorDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-bold rounded-lg px-4 py-2">
                                        <Plus className="w-4 h-4" /> إضافة طبيب
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                                    <DialogHeader><DialogTitle>إضافة طبيب جديد</DialogTitle></DialogHeader>
                                    <form onSubmit={handleAddDoctor} className="space-y-4 py-4 text-right">
                                        <Input placeholder="اسم الطبيب" value={newDoctor.name} onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})} required />
                                        <Input placeholder="التخصص" value={newDoctor.specialty} onChange={(e) => setNewDoctor({...newDoctor, specialty: e.target.value})} />
                                        <Input placeholder="رقم الهاتف" value={newDoctor.phone} onChange={(e) => setNewDoctor({...newDoctor, phone: e.target.value})} />
                                        <Input placeholder="جدول العمل" value={newDoctor.workSchedule} onChange={(e) => setNewDoctor({...newDoctor, workSchedule: e.target.value})} />
                                        
                                        <Select onValueChange={(val) => setNewDoctor({...newDoctor, departmentId: val})}>
                                            <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                                            <SelectContent>
                                                {departments.map(dept => (
                                                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <DialogFooter>
                                            <Button type="submit" disabled={submitting} className="w-full bg-blue-600">
                                                {submitting ? <Loader2 className="animate-spin w-4 h-4 ml-2" /> : 'حفظ بيانات الطبيب'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-muted/40 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold">اسم الطبيب</th>
                                        <th className="p-4 font-semibold">التخصص</th>
                                        <th className="p-4 font-semibold">الهاتف</th>
                                        <th className="p-4 font-semibold">جدول العمل</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {doctors.map(doc => (
                                        <tr key={doc.id} className="hover:bg-muted/30">
                                            <td className="p-4">{doc.name}</td>
                                            <td className="p-4">{doc.specialty}</td>
                                            <td className="p-4" dir="ltr">{doc.phone}</td>
                                            <td className="p-4">{doc.workSchedule}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}