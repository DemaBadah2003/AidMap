'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pencil, Plus, Search, Loader2, AlertCircle } from 'lucide-react'

// --- الثوابت ---
const SPECIALIZATIONS = [
  'طب باطني', 'طب أطفال', 'جراحة عامة', 'نسائية وتوليد', 'طب طوارئ',
  'طب عظام', 'طب أعصاب', 'طب قلب', 'طب عيون', 'أنف وأذن وحنجرة',
  'تخدير وعناية مركزة', 'أشعة', 'مختبر طبي', 'علاج طبيعي',
]

const SCHEDULES = [
  'السبت، الاثنين، الأربعاء',
  'الأحد، الثلاثاء، الخميس',
  'يومياً (السبت - الخميس)',
  'طوارئ 24 ساعة',
]

type Hospital = { id: string; hospitalName: string }
type Department = { id: string; name: string; hospitalId: string }
type DoctorRecord = {
  id: string; name: string; specialty: string; hospitalName: string
  hospitalId: string; departmentId: string | null; phone: string; workSchedule: string; description: string | null
}

const sel = 'w-full rounded-lg border border-input bg-background px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
const blank = { name: '', hospitalId: '', departmentId: '', specialty: '', phone: '', workSchedule: '', description: '' }

export default function DoctorsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<DoctorRecord[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(blank)
  const [addSub, setAddSub] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [editForm, setEditForm] = useState(blank)
  const [editSub, setEditSub] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [dRes, hRes, depRes] = await Promise.all([
        fetch('/api/project/Medical-Services/doctors'),
        fetch('/api/project/Medical-Services/hospitals'),
        fetch('/api/project/Medical-Services/departments'),
      ])
      const [dData, hData, depData] = await Promise.all([dRes.json(), hRes.json(), depRes.json()])
      setItems(dData.doctors || [])
      setHospitals(Array.isArray(hData.hospitals) ? hData.hospitals : [])
      setDepartments(Array.isArray(depData) ? depData : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  // التحقق من صحة الرقم (يجب أن يبدأ بـ 056 أو 059 ويكون 10 أرقام)
  const phoneValid = (p: string) => /^(056|059)\d{7}$/.test(p)
  
  const isValid = (f: typeof blank) =>
    f.name.trim() !== '' && 
    f.hospitalId !== '' && 
    f.specialty !== '' && 
    phoneValid(f.phone) && 
    f.workSchedule !== ''

  const filteredDepts = (hospitalId: string) => departments.filter(d => d.hospitalId === hospitalId)

  // --- دالة الإضافة ---
  const onAdd = async () => {
    if (!isValid(addForm)) return
    setAddSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/doctors', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...addForm,
          specialization: addForm.specialty,
          departmentId: addForm.departmentId || null 
        }),
      })
      if (res.ok) { await fetchAll(); setAddOpen(false); setAddForm(blank) }
    } finally { setAddSub(false) }
  }

  // --- فتح التعديل ---
  const openEdit = (item: DoctorRecord) => {
    setEditId(item.id)
    setEditForm({ 
      name: item.name || '', 
      hospitalId: item.hospitalId || '', 
      departmentId: item.departmentId || '', 
      specialty: item.specialty || '', 
      phone: item.phone || '', 
      workSchedule: item.workSchedule || '', 
      description: item.description || '' 
    })
    setEditOpen(true)
  }

  // --- دالة التعديل ---
  const onEdit = async () => {
    if (!isValid(editForm)) return
    setEditSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/doctors', {
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editId, 
          name: editForm.name, 
          hospitalId: editForm.hospitalId, 
          departmentId: editForm.departmentId || null, 
          specialization: editForm.specialty, 
          phone: editForm.phone, 
          workSchedule: editForm.workSchedule, 
          description: editForm.description 
        }),
      })
      if (res.ok) { 
        await fetchAll()
        setEditOpen(false) 
      }
    } catch (e) { console.error(e) } 
    finally { setEditSub(false) }
  }

  const filtered = useMemo(() =>
    items.filter(i => 
      i.name?.toLowerCase().includes(q.toLowerCase()) || 
      i.hospitalName?.toLowerCase().includes(q.toLowerCase())
    ), [items, q]
  )

  // --- مكون الحقول المشترك ---
  const FormFields = ({ form, setForm }: { form: typeof blank; setForm: (v: typeof blank) => void }) => (
    <div className="flex flex-col gap-4 py-2">
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold">اسم الطبيب</label>
        <Input className="h-11" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="أدخل اسم الطبيب" />
      </div>
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold">المستشفى</label>
        <select className={sel} value={form.hospitalId} onChange={e => setForm({ ...form, hospitalId: e.target.value, departmentId: '' })}>
          <option value="">اختر المستشفى</option>
          {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospitalName}</option>)}
        </select>
      </div>
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold">القسم (اختياري)</label>
        <select className={sel} value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} disabled={!form.hospitalId}>
          <option value="">{form.hospitalId ? 'اختر القسم' : 'اختر المستشفى أولاً'}</option>
          {filteredDepts(form.hospitalId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold">التخصص</label>
        <select className={sel} value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}>
          <option value="">اختر التخصص</option>
          {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold">رقم الهاتف</label>
        <Input 
          className={`h-11 ${form.phone && !phoneValid(form.phone) ? 'border-red-500' : ''}`} 
          dir="ltr" 
          value={form.phone} 
          // منع إدخال أي نص غير الأرقام تلقائياً
          onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} 
          placeholder="05XXXXXXXX" 
          maxLength={10}
        />
        {form.phone && !phoneValid(form.phone) && <p className="text-[10px] text-red-500 font-bold">يبدأ بـ 056 أو 059 ويتكون من 10 أرقام</p>}
      </div>
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold">مواعيد العمل</label>
        <select className={sel} value={form.workSchedule} onChange={e => setForm({ ...form, workSchedule: e.target.value })}>
          <option value="">اختر المواعيد</option>
          {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-1.5 text-start">
        <label className="text-sm font-semibold">ملاحظات</label>
        <textarea className="w-full rounded-lg border border-input bg-background p-2 text-sm outline-none min-h-[70px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
    </div>
  )

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 text-start"><h1 className="text-2xl font-bold">إدارة سجل الأطباء</h1></div>

      <Card className="overflow-hidden rounded-xl border shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث باسم الطبيب أو المستشفى..." className="h-10 pe-10 text-start" />
            </div>
            <Button onClick={() => { setAddForm(blank); setAddOpen(true) }} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 gap-2 sm:ms-auto">
              <Plus className="h-4 w-4" /> إضافة طبيب
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="p-4 font-semibold text-muted-foreground text-center">الطبيب</th>
                  <th className="p-4 font-semibold text-muted-foreground text-center">المستشفى</th>
                  <th className="p-4 font-semibold text-muted-foreground text-center">التخصص</th>
                  <th className="p-4 font-semibold text-muted-foreground text-center">الهاتف</th>
                  <th className="p-4 font-semibold text-muted-foreground text-center">المواعيد</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">تعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={6} className="p-16 text-center"><Loader2 className="animate-spin mx-auto size-5" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-16 text-center text-muted-foreground italic">لا يوجد أطباء مسجلون</td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-semibold">{item.name}</td>
                    <td className="p-4 font-medium text-blue-600">{item.hospitalName}</td>
                    <td className="p-4 text-muted-foreground">{item.specialty}</td>
                    <td className="p-4 font-mono text-xs" dir="ltr">{item.phone}</td>
                    <td className="p-4 text-xs text-blue-600">{item.workSchedule}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => openEdit(item)} className="rounded-md border p-2 text-muted-foreground hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-colors">
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

      {/* حوار الإضافة */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-start text-lg font-bold">إضافة طبيب جديد</DialogTitle></DialogHeader>
          <FormFields form={addForm} setForm={setAddForm} />
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={onAdd} disabled={!isValid(addForm) || addSub} className="flex-1 h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">
              {addSub && <Loader2 className="animate-spin size-4" />} حفظ
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار التعديل */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-start text-lg font-bold">تعديل بيانات الطبيب</DialogTitle></DialogHeader>
          <FormFields form={editForm} setForm={setEditForm} />
          {!isValid(editForm) && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> يرجى التأكد من إدخال رقم هاتف يبدأ بـ 056 أو 059
            </div>
          )}
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={onEdit} disabled={!isValid(editForm) || editSub} className="flex-1 h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">
              {editSub && <Loader2 className="animate-spin size-4" />} حفظ التعديلات
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}