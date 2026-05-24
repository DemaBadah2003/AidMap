'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowRight, Stethoscope, Activity, Users, Plus, Pencil, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { requireAdmin } from '@/app/(protected)/project/helpers/route-guards'

// ─── الأنواع (Types) ──────────────────────────────────────────────────────────
type Hospital = { id: string; hospitalName: string; hospitalType: string; region: string; phone: string; latitude: number | null; longitude: number | null }
type Department = { id: string; name: string; deptType: string; status: string; description: string | null; doctorCount: number; serviceCount: number }
type Doctor = { id: string; name: string; specialty: string; phone: string; workSchedule: string; description: string | null; departmentId: string | null }
type Service = { id: string; name: string; price: number; isAvailable: boolean; departmentId: string; departmentName: string }

// ─── الثوابت ────────────────────────────────────────────────────────────────
const DEPT_TYPES = ['الاستقبال والطوارئ', 'الجراحة العامة', 'طب الأطفال', 'النسائية والتوليد', 'العناية المركزة والتخدير', 'الأمراض الباطنية', 'العظام والكسور', 'المختبر الطبي', 'الأشعة والتصوير الطبي', 'الأنف والأذن والحنجرة', 'العيون (الرمد)', 'العلاج الطبيعي والتأهيل', 'القلب والأوعية الدموية', 'الأعصاب وجراحة المخ']
const DEPT_STATUSES = ['يعمل بكفاءة', 'مزدحم', 'خارج الخدمة']
const SPECIALIZATIONS = ['طب باطني', 'طب أطفال', 'جراحة عامة', 'نسائية وتوليد', 'طب طوارئ', 'طب عظام', 'طب أعصاب', 'طب قلب', 'طب عيون', 'أنف وأذن وحنجرة', 'تخدير وعناية مركزة', 'أشعة', 'مختبر طبي', 'علاج الطبيعي']
const SCHEDULES = ['السبت، الاثنين، الأربعاء', 'الأحد، الثلاثاء، الخميس', 'يومياً (السبت - الخميس)', 'طوارئ 24 ساعة']
const sel = 'w-full rounded-lg border border-input bg-background px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
const phoneValid = (p: string) => /^(056|059)\d{7}$/.test(p)

// ─── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function HospitalDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'departments' | 'services' | 'doctors'>('doctors')
    const [hospital, setHospital] = useState<Hospital | null>(null)
    const [departments, setDepartments] = useState<Department[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [services, setServices] = useState<Service[]>([])

    // Doctor State
    const emptyDoctor = { name: '', specialty: '', phone: '', workSchedule: '', departmentId: null }
    const [docAddOpen, setDocAddOpen] = useState(false)
    const [docAddForm, setDocAddForm] = useState(emptyDoctor)
    const [docEditOpen, setDocEditOpen] = useState(false)
    const [docEditId, setDocEditId] = useState('')
    const [docEditForm, setDocEditForm] = useState(emptyDoctor)

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

            {/* TAB: الأطباء - الجزء المطلوب */}
            {tab === 'doctors' && (
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-0">
                        <div className="p-4 flex items-center justify-between border-b">
                            <p className="font-semibold text-sm text-muted-foreground">إجمالي الأطباء: {doctors.length}</p>
                            <Button onClick={() => setDocAddOpen(true)} className="bg-blue-600 h-9 px-3 gap-2 text-sm"><Plus className="w-4 h-4" /> إضافة طبيب</Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-muted/40 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-start">اسم الطبيب</th>
                                        <th className="p-4 font-semibold text-start">التخصص</th>
                                        <th className="p-4 font-semibold text-start">الهاتف</th>
                                        <th className="p-4 font-semibold text-start">جدول العمل</th>
                                        <th className="p-4 font-semibold text-center">تعديل</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {doctors.length === 0 ? (
                                        <tr><td colSpan={5} className="p-12 text-center text-muted-foreground italic">لا يوجد أطباء مسجلون</td></tr>
                                    ) : (
                                        doctors.map(doc => (
                                            <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-4 font-semibold text-slate-800">{doc.name}</td>
                                                <td className="p-4 text-slate-600">{doc.specialty}</td>
                                                <td className="p-4 font-mono text-blue-600 font-bold" dir="ltr">{doc.phone}</td>
                                                <td className="p-4 text-slate-600">{doc.workSchedule}</td>
                                                <td className="p-4 text-center">
                                                    <button 
                                                        onClick={() => { setDocEditId(doc.id); setDocEditForm(doc); setDocEditOpen(true) }} 
                                                        className="border p-2 rounded-md hover:bg-blue-50 text-slate-500 hover:text-blue-600"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
      {/* نافذة الإضافة */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-right">إضافة خدمة جديدة</DialogTitle>
            <DialogDescription className="text-right">أدخل تفاصيل الخدمة أدناه ليتم حفظها في النظام.</DialogDescription>
          </DialogHeader>

          {dialogError && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              {dialogError}
            </div>
          )}

          <div className="grid gap-5 py-6 text-right">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">نوع الخدمة *</label>
              <select 
                className="h-11 px-3 border rounded-md border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" 
                value={serviceType} 
                onChange={(e) => setServiceType(e.target.value)}
              >
                {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-slate-700">حالة الخدمة *</label>
              <select 
                className="h-11 px-3 border rounded-md border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" 
                value={status} 
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="نشط">نشط</option>
                <option value="مغلق">مغلق</option>
              </select>
            </div>
          </div>

          <DialogFooter className="flex flex-row-reverse gap-3 border-t pt-4">
            <Button onClick={onAdd} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-10">
              {submitting ? 'جارٍ الحفظ...' : 'حفظ الخدمة'}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-slate-200 text-slate-600 h-10 px-6">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}