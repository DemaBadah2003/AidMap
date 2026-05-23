'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  ArrowRight, Building2, Phone, MapPin, Stethoscope, Activity, Users,
  Plus, Pencil, Loader2, AlertCircle,
} from 'lucide-react'

import { requireAdmin } from '@/app/(protected)/project/helpers/route-guards'

// ─── Types ───────────────────────────────────────────────────────────────────
type Hospital = {
  id: string; hospitalName: string; hospitalType: string; region: string
  phone: string; latitude: number | null; longitude: number | null
}
type Department = {
  id: string; name: string; deptType: string; status: string
  description: string | null; doctorCount: number; serviceCount: number
}
type Doctor = {
  id: string; name: string; specialty: string; phone: string
  workSchedule: string; description: string | null; departmentId: string | null
}
type Service = {
  id: string; name: string; price: number; isAvailable: boolean
  departmentId: string; departmentName: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPT_TYPES = [
  'الاستقبال والطوارئ','الجراحة العامة','طب الأطفال','النسائية والتوليد',
  'العناية المركزة والتخدير','الأمراض الباطنية','العظام والكسور',
  'المختبر الطبي','الأشعة والتصوير الطبي','الأنف والأذن والحنجرة',
  'العيون (الرمد)','العلاج الطبيعي والتأهيل','القلب والأوعية الدموية','الأعصاب وجراحة المخ',
]
const DEPT_STATUSES = ['يعمل بكفاءة','مزدحم','خارج الخدمة']
const SPECIALIZATIONS = [
  'طب باطني','طب أطفال','جراحة عامة','نسائية وتوليد','طب طوارئ',
  'طب عظام','طب أعصاب','طب قلب','طب عيون','أنف وأذن وحنجرة',
  'تخدير وعناية مركزة','أشعة','مختبر طبي','علاج طبيعي',
]
const SCHEDULES = [
  'السبت، الاثنين، الأربعاء',
  'الأحد، الثلاثاء، الخميس',
  'يومياً (السبت - الخميس)',
  'طوارئ 24 ساعة',
]

const sel = 'w-full rounded-lg border border-input bg-background px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50'
const phoneValid = (p: string) => /^(056|059)\d{7}$/.test(p)

// ─── Shared Form Components ──────────────────────────────────────────────────

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
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold block">ملاحظات</label>
        <textarea
          className="w-full text-start rounded-lg border border-input bg-background p-2 text-sm outline-none min-h-[70px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          value={form.description || ''}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
      </div>
    </div>
  )
}

function SvcForm({ form, setForm, departments }: { form: any; setForm: (v: any) => void; departments: Department[] }) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold block">القسم</label>
        <select className={sel} value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
          <option value="">اختر القسم</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold block">اسم الخدمة</label>
        <Input className="h-11" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم الخدمة الطبية" />
      </div>
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold block">التكلفة (₪)</label>
        <Input className="h-11" type="number" min="0" step="any" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
      </div>
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold block">حالة التوفر</label>
        <select className={sel} value={form.isAvailable ? 'true' : 'false'} onChange={e => setForm({ ...form, isAvailable: e.target.value === 'true' })}>
          <option value="true">متاحة</option>
          <option value="false">غير متوفرة</option>
        </select>
      </div>
    </div>
  )
}

function DocForm({ form, setForm, departments }: { form: any; setForm: (v: any) => void; departments: Department[] }) {
  const isPhoneError = form.phone && !phoneValid(form.phone)
  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold block">اسم الطبيب</label>
        <Input className="h-11" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="أدخل اسم الطبيب" />
      </div>
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold block">القسم (اختياري)</label>
        <select className={sel} value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
          <option value="">بدون قسم</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
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
        <Input
          className={`h-11 text-left ${isPhoneError ? 'border-red-500' : ''}`}
          dir="ltr"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
          placeholder="05XXXXXXXX"
        />
        {isPhoneError && (
          <p className="text-[11px] text-red-600 font-bold flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3" /> يبدأ بـ 056/059 ويتكون من 10 أرقام
          </p>
        )}
      </div>
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold block">مواعيد العمل</label>
        <select className={sel} value={form.workSchedule} onChange={e => setForm({ ...form, workSchedule: e.target.value })}>
          <option value="">اختر المواعيد</option>
          {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold block">ملاحظات</label>
        <textarea
          className="w-full text-start rounded-lg border border-input bg-background p-2 text-sm outline-none min-h-[70px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          value={form.description || ''}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [isVerifying, setIsVerifying] = useState(true)
  const [tab, setTab] = useState<'departments' | 'services' | 'doctors'>('departments')
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  // 1. حماية الصفحة - أول شي ينشغل
  useEffect(() => {
    async function checkAccess() {
      await requireAdmin(router)
      setIsVerifying(false)
    }
    checkAccess()
  }, [router])

  const fetchHospital = async () => {
    try {
      const res = await fetch(`/api/project/Medical-Services/hospitals/${id}`)
      const data = await res.json()
      setHospital(data)
      setDepartments(data.departments || [])
      setDoctors(data.doctors || [])
      setServices(data.services || [])
    } catch (e) { console.error(e) }
  }

  // 2. جلب البيانات بس بعد ما تنتهي الحماية
  useEffect(() => {
    if (isVerifying) return
    setLoading(true)
    fetchHospital().finally(() => setLoading(false))
  }, [id, isVerifying])

  const refresh = async () => { await fetchHospital() }

  // 3. شاشة التحقق
  if (isVerifying) return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  )

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Loader2 className="animate-spin size-8 text-blue-500" />
    </div>
  )

  if (!hospital) return (
    <div className="p-10 text-center text-muted-foreground">المستشفى غير موجود</div>
  )

  return (
    <div className="w-full px-4 py-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="text-start">
          <h1 className="text-2xl font-bold text-foreground">{hospital.hospitalName}</h1>
          <p className="text-sm text-muted-foreground">{hospital.hospitalType} · {hospital.region}</p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="rounded-2xl border shadow-sm">
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-start">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-muted-foreground">النوع:</span>
            <span className="font-semibold">{hospital.hospitalType}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-muted-foreground">المنطقة:</span>
            <span className="font-semibold">{hospital.region}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-muted-foreground">الهاتف:</span>
            <span className="font-semibold" dir="ltr">{hospital.phone}</span>
          </div>
          {hospital.latitude && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-mono text-xs" dir="ltr">
                {Number(hospital.latitude).toFixed(4)}, {Number(hospital.longitude).toFixed(4)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: 'departments', label: 'الأقسام', icon: Stethoscope, count: departments.length },
          { key: 'services',    label: 'الخدمات', icon: Activity,    count: services.length },
          { key: 'doctors',     label: 'الأطباء', icon: Users,       count: doctors.length },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'departments' && <DepartmentsTab hospitalId={id} departments={departments} onRefresh={refresh} />}
      {tab === 'services'    && <ServicesTab    hospitalId={id} departments={departments} services={services} onRefresh={refresh} />}
      {tab === 'doctors'     && <DoctorsTab     hospitalId={id} departments={departments} doctors={doctors}   onRefresh={refresh} />}
    </div>
  )
}

// ─── Sub-Tabs ─────────────────────────────────────────────────────────────────

function DepartmentsTab({ hospitalId, departments, onRefresh }: any) {
  const blank = { name: '', deptType: '', status: 'يعمل بكفاءة', description: '' }
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(blank)
  const [addSub,  setAddSub]  = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editId,   setEditId]   = useState('')
  const [editForm, setEditForm] = useState(blank)
  const [editSub,  setEditSub]  = useState(false)

  const isValid = (f: any) => f.name.trim() !== '' && f.deptType !== ''

  const onAdd = async () => {
    setAddSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/departments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, hospitalId }),
      })
      if (res.ok) { await onRefresh(); setAddOpen(false); setAddForm(blank) }
    } finally { setAddSub(false) }
  }

  const onEdit = async () => {
    setEditSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/departments', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...editForm, hospitalId }),
      })
      if (res.ok) { await onRefresh(); setEditOpen(false) }
    } finally { setEditSub(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 gap-2">
          <Plus className="h-4 w-4" /> إضافة قسم
        </Button>
      </div>

      <Card className="rounded-xl border shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="p-4 font-semibold text-muted-foreground text-center">نوع التخصص</th>
                <th className="p-4 font-semibold text-muted-foreground text-center">اسم القسم</th>
                <th className="p-4 font-semibold text-muted-foreground text-center">الحالة</th>
                <th className="p-4 text-center font-semibold text-muted-foreground">أطباء</th>
                <th className="p-4 text-center font-semibold text-muted-foreground">خدمات</th>
                <th className="p-4 text-center font-semibold text-muted-foreground">تعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {departments.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-muted-foreground italic">لا توجد أقسام مسجلة</td></tr>
              ) : departments.map((d: any) => (
                <tr key={d.id} className="hover:bg-muted/30 text-center transition-colors">
                  <td className="p-4 text-muted-foreground">{d.deptType}</td>
                  <td className="p-4 font-semibold">{d.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      d.status === 'يعمل بكفاءة'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>{d.status}</span>
                  </td>
                  <td className="p-4">{d.doctorCount}</td>
                  <td className="p-4">{d.serviceCount}</td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        setEditId(d.id)
                        setEditForm({ name: d.name, deptType: d.deptType, status: d.status, description: d.description || '' })
                        setEditOpen(true)
                      }}
                      className="rounded-md border p-2 text-muted-foreground hover:text-blue-600 transition-colors mx-auto block"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-start">إضافة قسم</DialogTitle></DialogHeader>
          <DeptForm form={addForm} setForm={setAddForm} />
          <DialogFooter className="flex flex-row gap-3">
            <Button onClick={onAdd} disabled={!isValid(addForm) || addSub} className="flex-1 bg-blue-600 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-start">تعديل القسم</DialogTitle></DialogHeader>
          <DeptForm form={editForm} setForm={setEditForm} />
          <DialogFooter className="flex flex-row gap-3">
            <Button onClick={onEdit} disabled={!isValid(editForm) || editSub} className="flex-1 bg-blue-600 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ServicesTab({ hospitalId, departments, services, onRefresh }: any) {
  const blank = { name: '', price: '', isAvailable: true, departmentId: '' }
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(blank)
  const [addSub,  setAddSub]  = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editId,   setEditId]   = useState('')
  const [editForm, setEditForm] = useState(blank)
  const [editSub,  setEditSub]  = useState(false)

  const onAdd = async () => {
    setAddSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/services', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, hospitalId }),
      })
      if (res.ok) { await onRefresh(); setAddOpen(false); setAddForm(blank) }
    } finally { setAddSub(false) }
  }

  const onEdit = async () => {
    setEditSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/services', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...editForm }),
      })
      if (res.ok) { await onRefresh(); setEditOpen(false) }
    } finally { setEditSub(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 gap-2">
          <Plus className="h-4 w-4" /> إضافة خدمة
        </Button>
      </div>

      <Card className="rounded-xl border shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="p-4 font-semibold text-muted-foreground text-center">القسم</th>
                <th className="p-4 font-semibold text-muted-foreground text-center">الخدمة</th>
                <th className="p-4 font-semibold text-muted-foreground text-center">التكلفة</th>
                <th className="p-4 font-semibold text-muted-foreground text-center">الحالة</th>
                <th className="p-4 text-center font-semibold text-muted-foreground">تعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {services.map((s: any) => (
                <tr key={s.id} className="hover:bg-muted/30 text-center">
                  <td className="p-4">{s.departmentName}</td>
                  <td className="p-4 font-semibold">{s.name}</td>
                  <td className="p-4 font-mono text-blue-600 font-bold">{s.price} ₪</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      s.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>{s.isAvailable ? 'متاحة' : 'غير متوفرة'}</span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        setEditId(s.id)
                        setEditForm({ name: s.name, price: String(s.price), isAvailable: s.isAvailable, departmentId: s.departmentId })
                        setEditOpen(true)
                      }}
                      className="rounded-md border p-2 text-muted-foreground hover:text-blue-600 transition-colors mx-auto block"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-start">إضافة خدمة</DialogTitle></DialogHeader>
          <SvcForm form={addForm} setForm={setAddForm} departments={departments} />
          <DialogFooter className="flex flex-row gap-3">
            <Button onClick={onAdd} disabled={addSub} className="flex-1 bg-blue-600 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-start">تعديل الخدمة</DialogTitle></DialogHeader>
          <SvcForm form={editForm} setForm={setEditForm} departments={departments} />
          <DialogFooter className="flex flex-row gap-3">
            <Button onClick={onEdit} disabled={editSub} className="flex-1 bg-blue-600 text-white">حفظ التعديلات</Button>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DoctorsTab({ hospitalId, departments, doctors, onRefresh }: any) {
  const blank = { name: '', departmentId: '', specialty: '', phone: '', workSchedule: '', description: '' }
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(blank)
  const [addSub,  setAddSub]  = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editId,   setEditId]   = useState('')
  const [editForm, setEditForm] = useState(blank)
  const [editSub,  setEditSub]  = useState(false)

  const canSave = (f: any) => f.name.trim() !== '' && f.specialty !== '' && phoneValid(f.phone)

  const onAdd = async () => {
    if (!canSave(addForm)) return
    setAddSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/doctors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, hospitalId, specialization: addForm.specialty }),
      })
      if (res.ok) { await onRefresh(); setAddOpen(false); setAddForm(blank) }
    } finally { setAddSub(false) }
  }

  const onEdit = async () => {
    if (!canSave(editForm)) return
    setEditSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/doctors', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...editForm, hospitalId, specialization: editForm.specialty }),
      })
      if (res.ok) { await onRefresh(); setEditOpen(false) }
    } finally { setEditSub(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 gap-2">
          <Plus className="h-4 w-4" /> إضافة طبيب
        </Button>
      </div>

      <Card className="rounded-xl border shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="p-4 font-semibold text-muted-foreground text-center">الطبيب</th>
                <th className="p-4 font-semibold text-muted-foreground text-center">التخصص</th>
                <th className="p-4 font-semibold text-muted-foreground text-center">الهاتف</th>
                <th className="p-4 font-semibold text-muted-foreground text-center">المواعيد</th>
                <th className="p-4 text-center font-semibold text-muted-foreground">تعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {doctors.map((d: any) => (
                <tr key={d.id} className="hover:bg-muted/30 text-center">
                  <td className="p-4 font-semibold">{d.name}</td>
                  <td className="p-4">{d.specialty}</td>
                  <td className="p-4 font-mono font-bold" dir="ltr">{d.phone}</td>
                  <td className="p-4 text-blue-600 font-medium text-xs">{d.workSchedule}</td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        setEditId(d.id)
                        setEditForm({
                          name: d.name,
                          departmentId: d.departmentId || '',
                          specialty: d.specialty,
                          phone: d.phone,
                          workSchedule: d.workSchedule,
                          description: d.description || '',
                        })
                        setEditOpen(true)
                      }}
                      className="rounded-md border p-2 text-muted-foreground hover:text-blue-600 transition-colors mx-auto block"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-start">إضافة طبيب</DialogTitle></DialogHeader>
          <DocForm form={addForm} setForm={setAddForm} departments={departments} />
          <DialogFooter className="flex flex-row gap-3">
            <Button onClick={onAdd} disabled={!canSave(addForm) || addSub} className="flex-1 bg-blue-600 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-start">تعديل بيانات الطبيب</DialogTitle></DialogHeader>
          <DocForm form={editForm} setForm={setEditForm} departments={departments} />
          <DialogFooter className="flex flex-row gap-3">
            <Button onClick={onEdit} disabled={!canSave(editForm) || editSub} className="flex-1 bg-blue-600 text-white">حفظ التعديلات</Button>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}