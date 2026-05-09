'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  ArrowRight, Building2, Phone, MapPin, Stethoscope, Activity, Users,
  Plus, Pencil, Loader2, AlertCircle,
} from 'lucide-react'

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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<'departments' | 'services' | 'doctors'>('departments')
  const [hospital, setHospital] = useState<Hospital | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHospital = async () => {
    try {
      const res = await fetch(`/api/project/Medical-Services/hospitals/${id}`)
      const data = await res.json()
      setHospital({ id: data.id, hospitalName: data.hospitalName, hospitalType: data.hospitalType, region: data.region, phone: data.phone, latitude: data.latitude, longitude: data.longitude })
      setDepartments(data.departments || [])
      setDoctors(data.doctors || [])
      setServices(data.services || [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    setLoading(true)
    fetchHospital().finally(() => setLoading(false))
  }, [id])

  const refresh = async () => { await fetchHospital() }

  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="animate-spin size-8 text-blue-500" /></div>
  if (!hospital) return <div className="p-10 text-center text-muted-foreground">المستشفى غير موجود</div>

  return (
    <div className="w-full px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{hospital.hospitalName}</h1>
          <p className="text-sm text-muted-foreground">{hospital.hospitalType} · {hospital.region}</p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="rounded-2xl border shadow-sm">
        <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
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
          {hospital.latitude && hospital.longitude && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-mono text-xs" dir="ltr">{Number(hospital.latitude).toFixed(4)}, {Number(hospital.longitude).toFixed(4)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: 'departments', label: 'الأقسام', icon: Stethoscope, count: departments.length },
          { key: 'services', label: 'الخدمات', icon: Activity, count: services.length },
          { key: 'doctors', label: 'الأطباء', icon: Users, count: doctors.length },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'departments' && <DepartmentsTab hospitalId={id} departments={departments} onRefresh={refresh} />}
      {tab === 'services' && <ServicesTab hospitalId={id} departments={departments} services={services} onRefresh={refresh} />}
      {tab === 'doctors' && <DoctorsTab hospitalId={id} departments={departments} doctors={doctors} onRefresh={refresh} />}
    </div>
  )
}

// ─── Departments Tab ───────────────────────────────────────────────────────────
function DepartmentsTab({ hospitalId, departments, onRefresh }: { hospitalId: string; departments: Department[]; onRefresh: () => void }) {
  const blank = { name: '', deptType: '', status: 'يعمل بكفاءة', description: '' }
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(blank)
  const [addSub, setAddSub] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [editForm, setEditForm] = useState(blank)
  const [editSub, setEditSub] = useState(false)

  const isValid = (f: typeof blank) => f.name.trim() !== '' && f.deptType !== ''

  const onAdd = async () => {
    if (!isValid(addForm)) return
    setAddSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/departments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, hospitalId }),
      })
      if (res.ok) { await onRefresh(); setAddOpen(false); setAddForm(blank) }
    } finally { setAddSub(false) }
  }

  const openEdit = (d: Department) => {
    setEditId(d.id); setEditForm({ name: d.name, deptType: d.deptType, status: d.status, description: d.description || '' }); setEditOpen(true)
  }

  const onEdit = async () => {
    if (!isValid(editForm)) return
    setEditSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/departments', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...editForm, hospitalId }),
      })
      if (res.ok) { await onRefresh(); setEditOpen(false) }
    } finally { setEditSub(false) }
  }

  const DeptForm = ({ form, setForm }: { form: typeof blank; setForm: (v: typeof blank) => void }) => (
    <div className="flex flex-col gap-4 py-2">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">نوع التخصص</label>
        <select className={sel} value={form.deptType} onChange={e => setForm({ ...form, deptType: e.target.value })}>
          <option value="">اختر التخصص</option>
          {DEPT_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">اسم القسم</label>
        <Input className="h-11" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم القسم" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">الحالة التشغيلية</label>
        <select className={sel} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          {DEPT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">ملاحظات</label>
        <textarea className="w-full rounded-lg border border-input bg-background p-2 text-sm outline-none min-h-[70px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setAddForm(blank); setAddOpen(true) }} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 gap-2">
          <Plus className="h-4 w-4" /> إضافة قسم
        </Button>
      </div>
      <Card className="rounded-xl border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-start border-collapse text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="p-4 font-semibold text-muted-foreground">نوع التخصص</th>
                <th className="p-4 font-semibold text-muted-foreground">اسم القسم</th>
                <th className="p-4 font-semibold text-muted-foreground">الحالة</th>
                <th className="p-4 font-semibold text-muted-foreground">أطباء</th>
                <th className="p-4 font-semibold text-muted-foreground">خدمات</th>
                <th className="p-4 font-semibold text-muted-foreground">ملاحظات</th>
                <th className="p-4 text-center font-semibold text-muted-foreground">تعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {departments.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground italic">لا توجد أقسام مسجلة</td></tr>
              ) : departments.map(d => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-muted-foreground text-sm">{d.deptType}</td>
                  <td className="p-4 font-semibold">{d.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${d.status === 'يعمل بكفاءة' ? 'bg-emerald-100 text-emerald-700' : d.status === 'مزدحم' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{d.status}</span>
                  </td>
                  <td className="p-4 text-center text-muted-foreground">{d.doctorCount}</td>
                  <td className="p-4 text-center text-muted-foreground">{d.serviceCount}</td>
                  <td className="p-4 max-w-[150px] truncate text-muted-foreground text-xs">{d.description || '—'}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => openEdit(d)} className="rounded-md border p-2 text-muted-foreground hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={open => { setAddOpen(open); if (!open) setAddForm(blank) }}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-start text-lg font-bold">إضافة قسم جديد</DialogTitle></DialogHeader>
          <DeptForm form={addForm} setForm={setAddForm} />
          {!isValid(addForm) && <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> يرجى تعبئة الحقول المطلوبة</div>}
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={onAdd} disabled={!isValid(addForm) || addSub} className="flex-1 h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">{addSub && <Loader2 className="animate-spin size-4" />} حفظ</Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-start text-lg font-bold">تعديل القسم</DialogTitle></DialogHeader>
          <DeptForm form={editForm} setForm={setEditForm} />
          {!isValid(editForm) && <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> يرجى تعبئة الحقول المطلوبة</div>}
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={onEdit} disabled={!isValid(editForm) || editSub} className="flex-1 h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">{editSub && <Loader2 className="animate-spin size-4" />} حفظ</Button>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Services Tab ─────────────────────────────────────────────────────────────
function ServicesTab({ hospitalId, departments, services, onRefresh }: { hospitalId: string; departments: Department[]; services: Service[]; onRefresh: () => void }) {
  const blank = { name: '', price: '', isAvailable: true, departmentId: '' }
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(blank)
  const [addSub, setAddSub] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [editForm, setEditForm] = useState(blank)
  const [editSub, setEditSub] = useState(false)

  const isValid = (f: typeof blank) => f.name.trim() !== '' && f.departmentId !== ''

  const onAdd = async () => {
    if (!isValid(addForm)) return
    setAddSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/services', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      if (res.ok) { await onRefresh(); setAddOpen(false); setAddForm(blank) }
    } finally { setAddSub(false) }
  }

  const openEdit = (s: Service) => {
    setEditId(s.id); setEditForm({ name: s.name, price: String(s.price), isAvailable: s.isAvailable, departmentId: s.departmentId }); setEditOpen(true)
  }

  const onEdit = async () => {
    if (!isValid(editForm)) return
    setEditSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/services', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...editForm }),
      })
      if (res.ok) { await onRefresh(); setEditOpen(false) }
    } finally { setEditSub(false) }
  }

  const SvcForm = ({ form, setForm }: { form: typeof blank; setForm: (v: typeof blank) => void }) => (
    <div className="flex flex-col gap-4 py-2">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">القسم</label>
        <select className={sel} value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
          <option value="">اختر القسم</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">اسم الخدمة</label>
        <Input className="h-11" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم الخدمة الطبية" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">التكلفة (₪)</label>
        <Input className="h-11" type="number" min="0" step="any" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">حالة التوفر</label>
        <select className={sel} value={form.isAvailable ? 'true' : 'false'} onChange={e => setForm({ ...form, isAvailable: e.target.value === 'true' })}>
          <option value="true">متاحة</option>
          <option value="false">غير متوفرة</option>
        </select>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setAddForm(blank); setAddOpen(true) }} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 gap-2">
          <Plus className="h-4 w-4" /> إضافة خدمة
        </Button>
      </div>
      <Card className="rounded-xl border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-start border-collapse text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="p-4 font-semibold text-muted-foreground">القسم</th>
                <th className="p-4 font-semibold text-muted-foreground">الخدمة</th>
                <th className="p-4 font-semibold text-muted-foreground">التكلفة</th>
                <th className="p-4 font-semibold text-muted-foreground">الحالة</th>
                <th className="p-4 text-center font-semibold text-muted-foreground">تعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {services.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground italic">لا توجد خدمات مسجلة</td></tr>
              ) : services.map(s => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-muted-foreground text-sm">{s.departmentName}</td>
                  <td className="p-4 font-semibold">{s.name}</td>
                  <td className="p-4 font-mono text-blue-600">{s.price > 0 ? `${s.price} ₪` : 'مجاني'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{s.isAvailable ? 'متاحة' : 'غير متوفرة'}</span>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => openEdit(s)} className="rounded-md border p-2 text-muted-foreground hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={open => { setAddOpen(open); if (!open) setAddForm(blank) }}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-start text-lg font-bold">إضافة خدمة جديدة</DialogTitle></DialogHeader>
          <SvcForm form={addForm} setForm={setAddForm} />
          {!isValid(addForm) && <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> يرجى تعبئة الحقول المطلوبة</div>}
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={onAdd} disabled={!isValid(addForm) || addSub} className="flex-1 h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">{addSub && <Loader2 className="animate-spin size-4" />} حفظ</Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-start text-lg font-bold">تعديل الخدمة</DialogTitle></DialogHeader>
          <SvcForm form={editForm} setForm={setEditForm} />
          {!isValid(editForm) && <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> يرجى تعبئة الحقول المطلوبة</div>}
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={onEdit} disabled={!isValid(editForm) || editSub} className="flex-1 h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">{editSub && <Loader2 className="animate-spin size-4" />} حفظ</Button>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Doctors Tab ──────────────────────────────────────────────────────────────
function DoctorsTab({ hospitalId, departments, doctors, onRefresh }: { hospitalId: string; departments: Department[]; doctors: Doctor[]; onRefresh: () => void }) {
  const blank = { name: '', departmentId: '', specialty: '', phone: '', workSchedule: '', description: '' }
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(blank)
  const [addSub, setAddSub] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [editForm, setEditForm] = useState(blank)
  const [editSub, setEditSub] = useState(false)

  const isValid = (f: typeof blank) =>
    f.name.trim() !== '' && f.specialty !== '' && phoneValid(f.phone) && f.workSchedule !== ''

  const onAdd = async () => {
    if (!isValid(addForm)) return
    setAddSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/doctors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addForm.name, hospitalId, departmentId: addForm.departmentId || null, specialization: addForm.specialty, phone: addForm.phone, workSchedule: addForm.workSchedule, description: addForm.description }),
      })
      if (res.ok) { await onRefresh(); setAddOpen(false); setAddForm(blank) }
    } finally { setAddSub(false) }
  }

  const openEdit = (d: Doctor) => {
    setEditId(d.id); setEditForm({ name: d.name, departmentId: d.departmentId || '', specialty: d.specialty, phone: d.phone, workSchedule: d.workSchedule, description: d.description || '' }); setEditOpen(true)
  }

  const onEdit = async () => {
    if (!isValid(editForm)) return
    setEditSub(true)
    try {
      const res = await fetch(`/api/project/Medical-Services/doctors?id=${editId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editForm.name, hospitalId, departmentId: editForm.departmentId || null, specialization: editForm.specialty, phone: editForm.phone, workSchedule: editForm.workSchedule, description: editForm.description }),
      })
      if (res.ok) { await onRefresh(); setEditOpen(false) }
    } finally { setEditSub(false) }
  }

  const DocForm = ({ form, setForm }: { form: typeof blank; setForm: (v: typeof blank) => void }) => (
    <div className="flex flex-col gap-4 py-2">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">اسم الطبيب</label>
        <Input className="h-11" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="أدخل اسم الطبيب" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">القسم (اختياري)</label>
        <select className={sel} value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
          <option value="">بدون قسم</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">التخصص</label>
        <select className={sel} value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}>
          <option value="">اختر التخصص</option>
          {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">رقم الهاتف</label>
        <Input className={`h-11 ${form.phone && !phoneValid(form.phone) ? 'border-red-500' : ''}`} dir="ltr" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="056XXXXXXX" />
        {form.phone && !phoneValid(form.phone) && <p className="text-xs text-red-500">يبدأ بـ 056 أو 059 ويكون 10 أرقام</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">مواعيد العمل</label>
        <select className={sel} value={form.workSchedule} onChange={e => setForm({ ...form, workSchedule: e.target.value })}>
          <option value="">اختر المواعيد</option>
          {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">ملاحظات</label>
        <textarea className="w-full rounded-lg border border-input bg-background p-2 text-sm outline-none min-h-[70px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setAddForm(blank); setAddOpen(true) }} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 gap-2">
          <Plus className="h-4 w-4" /> إضافة طبيب
        </Button>
      </div>
      <Card className="rounded-xl border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-start border-collapse text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="p-4 font-semibold text-muted-foreground">الطبيب</th>
                <th className="p-4 font-semibold text-muted-foreground">التخصص</th>
                <th className="p-4 font-semibold text-muted-foreground">القسم</th>
                <th className="p-4 font-semibold text-muted-foreground">الهاتف</th>
                <th className="p-4 font-semibold text-muted-foreground">المواعيد</th>
                <th className="p-4 text-center font-semibold text-muted-foreground">تعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {doctors.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-muted-foreground italic">لا يوجد أطباء مسجلون</td></tr>
              ) : doctors.map(d => {
                const dept = departments.find(dep => dep.id === d.departmentId)
                return (
                  <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-semibold">{d.name}</td>
                    <td className="p-4 text-muted-foreground">{d.specialty}</td>
                    <td className="p-4 text-muted-foreground text-sm">{dept?.name || '—'}</td>
                    <td className="p-4 font-mono text-xs" dir="ltr">{d.phone}</td>
                    <td className="p-4 text-xs text-blue-600">{d.workSchedule}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => openEdit(d)} className="rounded-md border p-2 text-muted-foreground hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={open => { setAddOpen(open); if (!open) setAddForm(blank) }}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-start text-lg font-bold">إضافة طبيب جديد</DialogTitle></DialogHeader>
          <DocForm form={addForm} setForm={setAddForm} />
          {!isValid(addForm) && <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> يرجى تعبئة جميع الحقول المطلوبة</div>}
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={onAdd} disabled={!isValid(addForm) || addSub} className="flex-1 h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">{addSub && <Loader2 className="animate-spin size-4" />} حفظ</Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-start text-lg font-bold">تعديل بيانات الطبيب</DialogTitle></DialogHeader>
          <DocForm form={editForm} setForm={setEditForm} />
          {!isValid(editForm) && <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> يرجى تعبئة جميع الحقول المطلوبة</div>}
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={onEdit} disabled={!isValid(editForm) || editSub} className="flex-1 h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">{editSub && <Loader2 className="animate-spin size-4" />} حفظ</Button>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
