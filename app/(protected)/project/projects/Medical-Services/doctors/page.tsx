'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pencil, Plus, Loader2 } from 'lucide-react'

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

  const normalize = (p: string) => p?.replace(/\D/g, '').trim() || '';
  const isPhoneValid = (p: string) => /^(056|059)\d{7}$/.test(normalize(p))
  const checkDuplicate = (phone: string, excludeId?: string) => {
    const rawNewPhone = normalize(phone);
    if (!rawNewPhone) return false;
    return items.some(item => normalize(item.phone) === rawNewPhone && item.id !== excludeId);
  }

  const isAddDuplicate = useMemo(() => checkDuplicate(addForm.phone), [items, addForm.phone])
  const isEditDuplicate = useMemo(() => checkDuplicate(editForm.phone, editId), [items, editForm.phone, editId])

  const canAdd = addForm.name.trim() !== '' && addForm.hospitalId !== '' && isPhoneValid(addForm.phone) && !isAddDuplicate
  const canEdit = editForm.name.trim() !== '' && editForm.hospitalId !== '' && isPhoneValid(editForm.phone) && !isEditDuplicate

  const onAdd = async () => {
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

  const FormInputs = ({ data, setData }: { data: typeof blankForm, setData: any }) => (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 text-start">
          <label className="text-sm font-bold text-slate-700">اسم الطبيب</label>
          <Input value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="الاسم الرباعي" />
        </div>
        <div className="space-y-1 text-start">
          <label className="text-sm font-bold text-slate-700">المستشفى</label>
          <select className={selStyle} value={data.hospitalId} onChange={e => setData({...data, hospitalId: e.target.value})}>
            <option value="">اختر..</option>
            {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospitalName}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 text-start">
          <label className="text-sm font-bold text-slate-700">التخصص</label>
          <select className={selStyle} value={data.specialty} onChange={e => setData({...data, specialty: e.target.value})}>
            <option value="">اختر..</option>
            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1 text-start">
          <label className="text-sm font-bold text-slate-700">مواعيد الدوام</label>
          <select className={selStyle} value={data.workSchedule} onChange={e => setData({...data, workSchedule: e.target.value})}>
            <option value="">اختر الموعد..</option>
            {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-2 text-start border-t pt-4">
        <label className="text-sm font-bold text-blue-700">رقم الهاتف</label>
        <Input dir="ltr" value={data.phone} onChange={e => setData({...data, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} />
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

      <Card className="shadow-sm border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-y text-slate-600 text-sm">
                  <th className="p-4 font-semibold">اسم الطبيب</th>
                  <th className="p-4 font-semibold">التخصص</th>
                  <th className="p-4 font-semibold">الهاتف</th>
                  <th className="p-4 font-semibold">جدول العمل</th>
                  <th className="p-4 text-center font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-800">{doc.name}</td>
                    <td className="p-4 text-sm text-slate-600">{doc.specialty}</td>
                    <td className="p-4 text-sm font-mono text-slate-600" dir="ltr">{doc.phone}</td>
                    <td className="p-4 text-sm text-slate-600">{doc.workSchedule}</td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 border border-slate-200 hover:bg-slate-100"
                          onClick={() => {
                            setEditId(doc.id);
                            setEditForm({...doc});
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-start border-b pb-2">إضافة طبيب جديد</DialogTitle></DialogHeader>
          <FormInputs data={addForm} setData={setAddForm} />
          <DialogFooter className="border-t pt-4">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled={!canAdd || addSub} onClick={onAdd}>
              {addSub ? <Loader2 className="animate-spin w-4 h-4 ml-2" /> : "حفظ البيانات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار التعديل */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-start border-b pb-2">تعديل بيانات الطبيب</DialogTitle></DialogHeader>
          <FormInputs data={editForm} setData={setEditForm} />
          <DialogFooter className="border-t pt-4">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled={!canEdit || editSub} onClick={onEdit}>
              {editSub ? <Loader2 className="animate-spin w-4 h-4 ml-2" /> : "تحديث البيانات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}