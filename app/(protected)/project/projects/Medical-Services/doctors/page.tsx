'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pencil, Plus, Search, Loader2 } from 'lucide-react'

// --- الإعدادات الثابتة ---
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

type DoctorRecord = {
  id: string; 
  name: string; 
  specialty: string; 
  hospitalName: string;
  hospitalId: string; 
  phone: string; 
  workSchedule: string; 
  description: string | null;
}

const selStyle = 'w-full rounded-lg border border-input bg-background px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
const blankForm = { name: '', hospitalId: '', specialty: '', phone: '', workSchedule: '', description: '' }

export default function DoctorsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<DoctorRecord[]>([])
  const [hospitals, setHospitals] = useState<{id: string, hospitalName: string}[]>([])
  const [loading, setLoading] = useState(true)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState(blankForm)
  const [addSub, setAddSub] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [editForm, setEditForm] = useState(blankForm)
  const [editSub, setEditSub] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [dRes, hRes] = await Promise.all([
        fetch('/api/project/Medical-Services/doctors'),
        fetch('/api/project/Medical-Services/hospitals'),
      ])
      const dData = await dRes.json()
      const hData = await hRes.json()
      setItems(Array.isArray(dData.doctors) ? dData.doctors : [])
      setHospitals(Array.isArray(hData.hospitals) ? hData.hospitals : [])
    } catch (e) { console.error("Error fetching:", e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  // --- 🛠️ منطق التحقق الصارم جداً ---

  // دالة تنظيف: تحول " 059-123 4567 " إلى "0591234567"
  const normalize = (p: string) => p?.replace(/\D/g, '').trim() || '';

  // التحقق من التنسيق (يبدأ بـ 056 أو 059 وطوله 10)
  const isPhoneValid = (p: string) => /^(056|059)\d{7}$/.test(normalize(p))

  // فحص التكرار: يقارن الأرقام المنظفة فقط لضمان دقة 100%
  const checkDuplicate = (phone: string, excludeId?: string) => {
    const rawNewPhone = normalize(phone);
    if (!rawNewPhone) return false;
    return items.some(item => normalize(item.phone) === rawNewPhone && item.id !== excludeId);
  }

  // استخدام useMemo لضمان تحديث حالة "التكرار" فور الكتابة
  const isAddDuplicate = useMemo(() => checkDuplicate(addForm.phone), [items, addForm.phone])
  const isEditDuplicate = useMemo(() => checkDuplicate(editForm.phone, editId), [items, editForm.phone, editId])

  // شروط تفعيل الأزرار (لن يفتح الزر إلا إذا كان التنسيق صح والاسم موجود وليس مكرراً)
  const canAdd = addForm.name.trim() !== '' && addForm.hospitalId !== '' && isPhoneValid(addForm.phone) && !isAddDuplicate
  const canEdit = editForm.name.trim() !== '' && editForm.hospitalId !== '' && isPhoneValid(editForm.phone) && !isEditDuplicate

  const onAdd = async () => {
    if (checkDuplicate(addForm.phone)) return alert("⚠️ خطأ: هذا الرقم مسجل مسبقاً لطبيب آخر!")
    setAddSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, phone: normalize(addForm.phone), specialization: addForm.specialty }),
      })
      if (res.ok) { await fetchAll(); setAddOpen(false); setAddForm(blankForm) }
    } finally { setAddSub(false) }
  }

  const onEdit = async () => {
    if (checkDuplicate(editForm.phone, editId)) return alert("⚠️ خطأ: الرقم الجديد مكرر!")
    setEditSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/doctors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...editForm, phone: normalize(editForm.phone), specialization: editForm.specialty }),
      })
      if (res.ok) { await fetchAll(); setEditOpen(false) }
    } finally { setEditSub(false) }
  }

  const FormInputs = ({ data, setData, isDup }: { data: typeof blankForm, setData: any, isDup: boolean }) => (
    <div className="space-y-4 py-4">
      <div className="space-y-1 text-start">
        <label className="text-sm font-bold">اسم الطبيب</label>
        <Input value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="الاسم الرباعي" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 text-start">
          <label className="text-sm font-bold">المستشفى</label>
          <select className={selStyle} value={data.hospitalId} onChange={e => setData({...data, hospitalId: e.target.value})}>
            <option value="">اختر..</option>
            {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospitalName}</option>)}
          </select>
        </div>
        <div className="space-y-1 text-start">
          <label className="text-sm font-bold">التخصص</label>
          <select className={selStyle} value={data.specialty} onChange={e => setData({...data, specialty: e.target.value})}>
            <option value="">اختر..</option>
            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1 text-start">
        <label className="text-sm font-bold">رقم التواصل (056/059)</label>
        <Input 
          dir="ltr"
          value={data.phone} 
          onChange={e => setData({...data, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
          className={isDup || (data.phone && !isPhoneValid(data.phone)) ? 'border-red-500 bg-red-50 focus-visible:ring-red-500' : ''}
          placeholder="05XXXXXXXX"
        />
        {isDup && <p className="text-[11px] text-red-600 font-bold mt-1 animate-pulse">⚠️ هذا الرقم موجود مسبقاً في النظام!</p>}
        {data.phone && !isPhoneValid(data.phone) && <p className="text-[10px] text-amber-600 mt-1 italic">يجب أن يبدأ بـ 056 أو 059 ويتكون من 10 أرقام</p>}
      </div>

      <div className="space-y-1 text-start">
        <label className="text-sm font-bold">مواعيد الدوام</label>
        <select className={selStyle} value={data.workSchedule} onChange={e => setData({...data, workSchedule: e.target.value})}>
          <option value="">اختر الموعد..</option>
          {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-800">سجل الأطباء المعتمدين</h1>
        <Button onClick={() => {setAddForm(blankForm); setAddOpen(true)}} className="bg-blue-600 hover:bg-blue-700 shadow-md">
          <Plus className="ml-2 w-4 h-4" /> إضافة طبيب جديد
        </Button>
      </div>

      <Card className="shadow-xl border-none">
        <CardContent className="p-0">
          <div className="p-4 border-b bg-slate-50/50">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="بحث باسم الطبيب..." className="pl-10 bg-white" value={q} onChange={e => setQ(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600 border-b">
                <tr>
                  <th className="p-4 text-start font-bold">الاسم</th>
                  <th className="p-4 text-center font-bold">المستشفى</th>
                  <th className="p-4 text-center font-bold">رقم التواصل</th>
                  <th className="p-4 text-center font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {loading ? (
                  <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto w-8 h-8 text-blue-600" /></td></tr>
                ) : items.filter(i => i.name.includes(q)).length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400">لا توجد نتائج مطابقة</td></tr>
                ) : items.filter(i => i.name.includes(q)).map(doc => (
                  <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 font-bold text-slate-700 text-start">{doc.name}</td>
                    <td className="p-4 text-center text-blue-600 font-medium">{doc.hospitalName}</td>
                    <td className="p-4 text-center font-mono text-slate-600" dir="ltr">{doc.phone}</td>
                    <td className="p-4 text-center">
                      <Button variant="ghost" size="sm" className="hover:bg-blue-100 hover:text-blue-600" onClick={() => {
                        setEditId(doc.id)
                        setEditForm({
                          name: doc.name,
                          hospitalId: doc.hospitalId,
                          specialty: doc.specialty,
                          phone: doc.phone,
                          workSchedule: doc.workSchedule,
                          description: doc.description || ''
                        })
                        setEditOpen(true)
                      }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-start border-b pb-2">إضافة طبيب جديد</DialogTitle></DialogHeader>
          <FormInputs data={addForm} setData={setAddForm} isDup={isAddDuplicate} />
          <DialogFooter className="gap-2 border-t pt-4">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={!canAdd || addSub} onClick={onAdd}>
              {addSub ? "جاري الحفظ..." : "حفظ البيانات"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-start border-b pb-2">تعديل بيانات الطبيب</DialogTitle></DialogHeader>
          <FormInputs data={editForm} setData={setEditForm} isDup={isEditDuplicate} />
          <DialogFooter className="gap-2 border-t pt-4">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={!canEdit || editSub} onClick={onEdit}>
              {editSub ? "جاري التحديث..." : "تحديث البيانات"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}