'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowRight, Stethoscope, Activity, Users, Plus, Pencil, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { requireAdmin } from '@/app/(protected)/project/helpers/route-guards'

// ─── Types ───────────────────────────────────────────────────────────────────
type Hospital = { id: string; hospitalName: string; hospitalType: string; region: string; phone: string; latitude: number | null; longitude: number | null }
type Department = { id: string; name: string; deptType: string; status: string; description: string | null; doctorCount: number; serviceCount: number }
type Doctor = { id: string; name: string; specialty: string; phone: string; workSchedule: string; description: string | null; departmentId: string | null }
type Service = { id: string; name: string; price: number; isAvailable: boolean; departmentId: string; departmentName: string }

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPT_TYPES = ['الاستقبال والطوارئ', 'الجراحة العامة', 'طب الأطفال', 'النسائية والتوليد', 'العناية المركزة والتخدير', 'الأمراض الباطنية', 'العظام والكسور', 'المختبر الطبي', 'الأشعة والتصوير الطبي', 'الأنف والأذن والحنجرة', 'العيون (الرمد)', 'العلاج الطبيعي والتأهيل', 'القلب والأوعية الدموية', 'الأعصاب وجراحة المخ']
const DEPT_STATUSES = ['يعمل بكفاءة', 'مزدحم', 'خارج الخدمة']
const SPECIALIZATIONS = ['طب باطني', 'طب أطفال', 'جراحة عامة', 'نسائية وتوليد', 'طب طوارئ', 'طب عظام', 'طب أعصاب', 'طب قلب', 'طب عيون', 'أنف وأذن وحنجرة', 'تخدير وعناية مركزة', 'أشعة', 'مختبر طبي', 'علاج طبيعي']
const SCHEDULES = ['السبت، الاثنين، الأربعاء', 'الأحد، الثلاثاء، الخميس', 'يومياً (السبت - الخميس)', 'طوارئ 24 ساعة']
const sel = 'w-full rounded-lg border border-input bg-background px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50'
const phoneValid = (p: string) => /^(056|059)\d{7}$/.test(p)

const STATUS_COLORS: Record<string, string> = {
    'يعمل بكفاءة': 'bg-green-50 text-green-700 border-green-200',
    'مزدحم': 'bg-amber-50 text-amber-700 border-amber-200',
    'خارج الخدمة': 'bg-red-50 text-red-700 border-red-200',
}

// ─── Forms ────────────────────────────────────────────────────────────────────
function DeptForm({ form, setForm }: { form: any; setForm: (v: any) => void }) {
    return (
        <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1.5 text-start">
                <label className="text-sm font-semibold block">نوع التخصص</label>
                <select className={sel} value={form.deptType} onChange={e => setForm({ ...form, deptType: e.target.value })}>
                    <option value="">اختر التخصص</option>
                    {DEPT_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div className="space-y-1.5 text-start">
                <label className="text-sm font-semibold block">اسم القسم</label>
                <Input className="h-11" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم القسم" />
            </div>
            <div className="space-y-1.5 text-start">
                <label className="text-sm font-semibold block">الحالة التشغيلية</label>
                <select className={sel} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {DEPT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        </div>
    )
}

function DoctorForm({ form, setForm, departments }: { form: any; setForm: (v: any) => void; departments: Department[] }) {
    const isPhoneInvalid = form.phone.length > 0 && !phoneValid(form.phone)
    return (
        <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1.5 text-start">
                <label className="text-sm font-semibold block">اسم الطبيب</label>
                <Input className="h-11" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم الطبيب" />
            </div>
            <div className="space-y-1.5 text-start">
                <label className="text-sm font-semibold block">التخصص</label>
                <select className={sel} value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}>
                    <option value="">اختر التخصص</option>
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="space-y-1.5 text-start">
                <label className="text-sm font-semibold block">رقم الهاتف</label>
                <Input className={`h-11 ${isPhoneInvalid ? 'border-red-500' : ''}`} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^\d]/g, '').slice(0, 10) })} placeholder="05XXXXXXXX" />
                {isPhoneInvalid && <p className="text-[10px] text-red-500">يجب أن يبدأ بـ 056 أو 059 ويتكون من 10 أرقام</p>}
            </div>
            <div className="space-y-1.5 text-start">
                <label className="text-sm font-semibold block">جدول العمل</label>
                <select className={sel} value={form.workSchedule} onChange={e => setForm({ ...form, workSchedule: e.target.value })}>
                    <option value="">اختر الجدول</option>
                    {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="space-y-1.5 text-start">
                <label className="text-sm font-semibold block">القسم</label>
                <select className={sel} value={form.departmentId || ''} onChange={e => setForm({ ...form, departmentId: e.target.value || null })}>
                    <option value="">بدون قسم</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>
        </div>
    )
}

function ServiceForm({ form, setForm, departments }: { form: any; setForm: (v: any) => void; departments: Department[] }) {
    return (
        <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1.5 text-start">
                <label className="text-sm font-semibold block">اسم الخدمة</label>
                <Input className="h-11" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم الخدمة" />
            </div>
            <div className="space-y-1.5 text-start">
                <label className="text-sm font-semibold block">السعر (₪)</label>
                <Input className="h-11" type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
            </div>
            <div className="space-y-1.5 text-start">
                <label className="text-sm font-semibold block">القسم</label>
                <select className={sel} value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                    <option value="">اختر القسم</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>
            <div className="space-y-1.5 text-start">
                <label className="text-sm font-semibold block">الحالة</label>
                <select className={sel} value={form.isAvailable ? 'true' : 'false'} onChange={e => setForm({ ...form, isAvailable: e.target.value === 'true' })}>
                    <option value="true">متاحة</option>
                    <option value="false">غير متاحة</option>
                </select>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HospitalDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [isVerifying, setIsVerifying] = useState(true)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'departments' | 'services' | 'doctors'>('departments')
    const [hospital, setHospital] = useState<Hospital | null>(null)
    const [departments, setDepartments] = useState<Department[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [services, setServices] = useState<Service[]>([])

    // ─── Dept State ───────────────────────────────────────────────────────────
    const emptyDept = { name: '', deptType: '', status: 'يعمل بكفاءة' }
    const [deptAddOpen, setDeptAddOpen] = useState(false)
    const [deptAddForm, setDeptAddForm] = useState(emptyDept)
    const [deptAddLoading, setDeptAddLoading] = useState(false)
    const [deptEditOpen, setDeptEditOpen] = useState(false)
    const [deptEditId, setDeptEditId] = useState('')
    const [deptEditForm, setDeptEditForm] = useState(emptyDept)
    const [deptEditLoading, setDeptEditLoading] = useState(false)

    // ─── Doctor State ─────────────────────────────────────────────────────────
    const emptyDoctor = { name: '', specialty: '', phone: '', workSchedule: '', departmentId: null as string | null }
    const [docAddOpen, setDocAddOpen] = useState(false)
    const [docAddForm, setDocAddForm] = useState(emptyDoctor)
    const [docAddLoading, setDocAddLoading] = useState(false)
    const [docEditOpen, setDocEditOpen] = useState(false)
    const [docEditId, setDocEditId] = useState('')
    const [docEditForm, setDocEditForm] = useState(emptyDoctor)
    const [docEditLoading, setDocEditLoading] = useState(false)

    // ─── Service State ────────────────────────────────────────────────────────
    const emptyService = { name: '', price: '', departmentId: '', isAvailable: true }
    const [svcAddOpen, setSvcAddOpen] = useState(false)
    const [svcAddForm, setSvcAddForm] = useState(emptyService)
    const [svcAddLoading, setSvcAddLoading] = useState(false)
    const [svcEditOpen, setSvcEditOpen] = useState(false)
    const [svcEditId, setSvcEditId] = useState('')
    const [svcEditForm, setSvcEditForm] = useState(emptyService)
    const [svcEditLoading, setSvcEditLoading] = useState(false)

    // ─── Auth ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        async function checkAccess() {
            try {
                const isAdmin = await requireAdmin()
                if (!isAdmin) router.push('/')
                else setIsVerifying(false)
            } catch { router.push('/') }
        }
        checkAccess()
    }, [router])

    // ─── Fetch ────────────────────────────────────────────────────────────────
    const fetchHospital = useCallback(async () => {
        if (!id) return
        setLoading(true)
        try {
            const res = await fetch(`/api/project/Medical-Services/hospitals/${id}`)
            if (res.ok) {
                const data = await res.json()
                setHospital(data)
                setDepartments(data.departments || [])
                setDoctors(data.doctors || [])
                setServices(data.services || [])
            }
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [id])

    useEffect(() => { if (!isVerifying) fetchHospital() }, [isVerifying, fetchHospital])

    if (isVerifying || loading) return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    )

    // ─── CRUD Helpers ─────────────────────────────────────────────────────────
    const BASE = `/api/project/Medical-Services/hospitals/${id}`

    const deptValid = (f: typeof emptyDept) => f.name.trim() !== '' && f.deptType !== ''
    const docValid = (f: typeof emptyDoctor) => f.name.trim() !== '' && f.specialty !== '' && phoneValid(f.phone) && f.workSchedule !== ''
    const svcValid = (f: typeof emptyService) => f.name.trim() !== '' && f.departmentId !== ''

    const onDeptAdd = async () => {
        if (!deptValid(deptAddForm)) return
        setDeptAddLoading(true)
        try {
            const res = await fetch(`${BASE}/departments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deptAddForm) })
            if (res.ok) { await fetchHospital(); setDeptAddOpen(false); setDeptAddForm(emptyDept) }
        } finally { setDeptAddLoading(false) }
    }

    const onDeptEdit = async () => {
        if (!deptValid(deptEditForm)) return
        setDeptEditLoading(true)
        try {
            const res = await fetch(`${BASE}/departments`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deptEditId, ...deptEditForm }) })
            if (res.ok) { await fetchHospital(); setDeptEditOpen(false) }
        } finally { setDeptEditLoading(false) }
    }

    const onDocAdd = async () => {
        if (!docValid(docAddForm)) return
        setDocAddLoading(true)
        try {
            const res = await fetch(`${BASE}/doctors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docAddForm) })
            if (res.ok) { await fetchHospital(); setDocAddOpen(false); setDocAddForm(emptyDoctor) }
        } finally { setDocAddLoading(false) }
    }

    const onDocEdit = async () => {
        if (!docValid(docEditForm)) return
        setDocEditLoading(true)
        try {
            const res = await fetch(`${BASE}/doctors`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: docEditId, ...docEditForm }) })
            if (res.ok) { await fetchHospital(); setDocEditOpen(false) }
        } finally { setDocEditLoading(false) }
    }

    const onSvcAdd = async () => {
        if (!svcValid(svcAddForm)) return
        setSvcAddLoading(true)
        try {
            const res = await fetch(`${BASE}/services`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...svcAddForm, price: Number(svcAddForm.price) }) })
            if (res.ok) { await fetchHospital(); setSvcAddOpen(false); setSvcAddForm(emptyService) }
        } finally { setSvcAddLoading(false) }
    }

    const onSvcEdit = async () => {
        if (!svcValid(svcEditForm)) return
        setSvcEditLoading(true)
        try {
            const res = await fetch(`${BASE}/services`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: svcEditId, ...svcEditForm, price: Number(svcEditForm.price) }) })
            if (res.ok) { await fetchHospital(); setSvcEditOpen(false) }
        } finally { setSvcEditLoading(false) }
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="w-full px-4 py-6 space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted"><ArrowRight /></button>
                <div>
                    <h1 className="text-2xl font-bold">{hospital?.hospitalName}</h1>
                    <p className="text-sm text-muted-foreground">{hospital?.hospitalType} · {hospital?.region}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b">
                {([
                    { key: 'departments', label: 'الأقسام', icon: Stethoscope },
                    { key: 'services', label: 'الخدمات', icon: Activity },
                    { key: 'doctors', label: 'الأطباء', icon: Users }
                ] as const).map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                TAB: الأقسام
            ════════════════════════════════════════════════════════════════ */}
            {tab === 'departments' && (
                <Card className="overflow-hidden rounded-xl border shadow-sm">
                    <CardContent className="p-0">
                        <div className="p-4 flex items-center justify-between border-b">
                            <p className="font-semibold text-sm text-muted-foreground">إجمالي الأقسام: {departments.length}</p>
                            <Button onClick={() => setDeptAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3 gap-2 text-sm">
                                <Plus className="w-4 h-4" /> إضافة قسم
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-muted/40 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-start">اسم القسم</th>
                                        <th className="p-4 font-semibold text-start">التخصص</th>
                                        <th className="p-4 font-semibold text-center">الحالة</th>
                                        <th className="p-4 font-semibold text-center">الأطباء</th>
                                        <th className="p-4 font-semibold text-center">الخدمات</th>
                                        <th className="p-4 font-semibold text-center">تعديل</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {departments.length === 0 ? (
                                        <tr><td colSpan={6} className="p-12 text-center text-muted-foreground italic">لا توجد أقسام مسجلة</td></tr>
                                    ) : departments.map(dept => (
                                        <tr key={dept.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-semibold">{dept.name}</td>
                                            <td className="p-4 text-muted-foreground">{dept.deptType}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${STATUS_COLORS[dept.status] || 'bg-gray-50 text-gray-600'}`}>
                                                    {dept.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-muted-foreground">{dept.doctorCount ?? 0}</td>
                                            <td className="p-4 text-center text-muted-foreground">{dept.serviceCount ?? 0}</td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => { setDeptEditId(dept.id); setDeptEditForm({ name: dept.name, deptType: dept.deptType, status: dept.status }); setDeptEditOpen(true) }} className="rounded-md border p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                TAB: الخدمات
            ════════════════════════════════════════════════════════════════ */}
            {tab === 'services' && (
                <Card className="overflow-hidden rounded-xl border shadow-sm">
                    <CardContent className="p-0">
                        <div className="p-4 flex items-center justify-between border-b">
                            <p className="font-semibold text-sm text-muted-foreground">إجمالي الخدمات: {services.length}</p>
                            <Button onClick={() => setSvcAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3 gap-2 text-sm">
                                <Plus className="w-4 h-4" /> إضافة خدمة
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-muted/40 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-start">اسم الخدمة</th>
                                        <th className="p-4 font-semibold text-start">القسم</th>
                                        <th className="p-4 font-semibold text-center">السعر</th>
                                        <th className="p-4 font-semibold text-center">الحالة</th>
                                        <th className="p-4 font-semibold text-center">تعديل</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {services.length === 0 ? (
                                        <tr><td colSpan={5} className="p-12 text-center text-muted-foreground italic">لا توجد خدمات مسجلة</td></tr>
                                    ) : services.map(svc => (
                                        <tr key={svc.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-semibold">{svc.name}</td>
                                            <td className="p-4 text-muted-foreground">{svc.departmentName}</td>
                                            <td className="p-4 text-center font-medium">{svc.price} ₪</td>
                                            <td className="p-4 text-center">
                                                {svc.isAvailable
                                                    ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-200"><CheckCircle className="w-3 h-3" />متاحة</span>
                                                    : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3 h-3" />غير متاحة</span>
                                                }
                                            </td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => { setSvcEditId(svc.id); setSvcEditForm({ name: svc.name, price: String(svc.price), departmentId: svc.departmentId, isAvailable: svc.isAvailable }); setSvcEditOpen(true) }} className="rounded-md border p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                TAB: الأطباء
            ════════════════════════════════════════════════════════════════ */}
            {tab === 'doctors' && (
                <Card className="overflow-hidden rounded-xl border shadow-sm">
                    <CardContent className="p-0">
                        <div className="p-4 flex items-center justify-between border-b">
                            <p className="font-semibold text-sm text-muted-foreground">إجمالي الأطباء: {doctors.length}</p>
                            <Button onClick={() => setDocAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3 gap-2 text-sm">
                                <Plus className="w-4 h-4" /> إضافة طبيب
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-muted/40 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold text-start">اسم الطبيب</th>
                                        <th className="p-4 font-semibold text-start">التخصص</th>
                                        <th className="p-4 font-semibold text-start">الهاتف</th>
                                        <th className="p-4 font-semibold text-start">جدول العمل</th>
                                        <th className="p-4 font-semibold text-start">القسم</th>
                                        <th className="p-4 font-semibold text-center">تعديل</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {doctors.length === 0 ? (
                                        <tr><td colSpan={6} className="p-12 text-center text-muted-foreground italic">لا يوجد أطباء مسجلون</td></tr>
                                    ) : doctors.map(doc => (
                                        <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-semibold">{doc.name}</td>
                                            <td className="p-4 text-muted-foreground">{doc.specialty}</td>
                                            <td className="p-4 text-muted-foreground" dir="ltr">{doc.phone}</td>
                                            <td className="p-4 text-muted-foreground">{doc.workSchedule}</td>
                                            <td className="p-4 text-muted-foreground">
                                                {departments.find(d => d.id === doc.departmentId)?.name || '—'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => { setDocEditId(doc.id); setDocEditForm({ name: doc.name, specialty: doc.specialty, phone: doc.phone, workSchedule: doc.workSchedule, departmentId: doc.departmentId }); setDocEditOpen(true) }} className="rounded-md border p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                DIALOGS - الأقسام
            ════════════════════════════════════════════════════════════════ */}
            <Dialog open={deptAddOpen} onOpenChange={setDeptAddOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-start">إضافة قسم جديد</DialogTitle></DialogHeader>
                    <DeptForm form={deptAddForm} setForm={setDeptAddForm} />
                    {!deptValid(deptAddForm) && deptAddForm.name !== '' && (
                        <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700"><AlertCircle className="w-3.5 h-3.5" />يرجى تعبئة جميع الحقول المطلوبة</div>
                    )}
                    <DialogFooter className="flex flex-row gap-3">
                        <Button onClick={onDeptAdd} disabled={!deptValid(deptAddForm) || deptAddLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            {deptAddLoading && <Loader2 className="animate-spin size-4 me-2" />} حفظ
                        </Button>
                        <Button variant="outline" onClick={() => setDeptAddOpen(false)} className="flex-1">إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deptEditOpen} onOpenChange={setDeptEditOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-start">تعديل القسم</DialogTitle></DialogHeader>
                    <DeptForm form={deptEditForm} setForm={setDeptEditForm} />
                    <DialogFooter className="flex flex-row gap-3">
                        <Button onClick={onDeptEdit} disabled={!deptValid(deptEditForm) || deptEditLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            {deptEditLoading && <Loader2 className="animate-spin size-4 me-2" />} حفظ
                        </Button>
                        <Button variant="outline" onClick={() => setDeptEditOpen(false)} className="flex-1">إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════
                DIALOGS - الأطباء
            ════════════════════════════════════════════════════════════════ */}
            <Dialog open={docAddOpen} onOpenChange={setDocAddOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-start">إضافة طبيب جديد</DialogTitle></DialogHeader>
                    <DoctorForm form={docAddForm} setForm={setDocAddForm} departments={departments} />
                    <DialogFooter className="flex flex-row gap-3">
                        <Button onClick={onDocAdd} disabled={!docValid(docAddForm) || docAddLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            {docAddLoading && <Loader2 className="animate-spin size-4 me-2" />} حفظ
                        </Button>
                        <Button variant="outline" onClick={() => setDocAddOpen(false)} className="flex-1">إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={docEditOpen} onOpenChange={setDocEditOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-start">تعديل بيانات الطبيب</DialogTitle></DialogHeader>
                    <DoctorForm form={docEditForm} setForm={setDocEditForm} departments={departments} />
                    <DialogFooter className="flex flex-row gap-3">
                        <Button onClick={onDocEdit} disabled={!docValid(docEditForm) || docEditLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            {docEditLoading && <Loader2 className="animate-spin size-4 me-2" />} حفظ
                        </Button>
                        <Button variant="outline" onClick={() => setDocEditOpen(false)} className="flex-1">إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════
                DIALOGS - الخدمات
            ════════════════════════════════════════════════════════════════ */}
            <Dialog open={svcAddOpen} onOpenChange={setSvcAddOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-start">إضافة خدمة جديدة</DialogTitle></DialogHeader>
                    <ServiceForm form={svcAddForm} setForm={setSvcAddForm} departments={departments} />
                    <DialogFooter className="flex flex-row gap-3">
                        <Button onClick={onSvcAdd} disabled={!svcValid(svcAddForm) || svcAddLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            {svcAddLoading && <Loader2 className="animate-spin size-4 me-2" />} حفظ
                        </Button>
                        <Button variant="outline" onClick={() => setSvcAddOpen(false)} className="flex-1">إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={svcEditOpen} onOpenChange={setSvcEditOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-start">تعديل الخدمة</DialogTitle></DialogHeader>
                    <ServiceForm form={svcEditForm} setForm={setSvcEditForm} departments={departments} />
                    <DialogFooter className="flex flex-row gap-3">
                        <Button onClick={onSvcEdit} disabled={!svcValid(svcEditForm) || svcEditLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            {svcEditLoading && <Loader2 className="animate-spin size-4 me-2" />} حفظ
                        </Button>
                        <Button variant="outline" onClick={() => setSvcEditOpen(false)} className="flex-1">إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}