'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Search, Loader2, Trash2 } from 'lucide-react'

const API_URL = '/api/project/Medical-Services/doctors'

// تأكد من استخدام export default لحل خطأ المكون
export default function DoctorsPage() {
  const [items, setItems] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '', hospitalId: '', specialty: '', phone: '', workSchedule: '', description: ''
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [docRes, hospRes, deptRes] = await Promise.all([
        fetch(API_URL),
        fetch(`${API_URL}?type=hospitals`),
        fetch(`${API_URL}?type=departments`)
      ])
      const docs = await docRes.json()
      setItems(docs.doctors || [])
      setHospitals(await hospRes.json())
      setDepartments(await deptRes.json())
    } catch (err) { console.error("Fetch error:", err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const onSave = async () => {
    if (!form.name || !form.hospitalId || !form.specialty || !form.phone || !form.workSchedule) {
      alert("يرجى إكمال كافة البيانات المطلوبة");
      return;
    }
    setSubmitting(true)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        await fetchData()
        setAddOpen(false)
        setForm({ name: '', hospitalId: '', specialty: '', phone: '', workSchedule: '', description: '' })
      } else {
        const errorData = await res.json()
        alert(errorData.message || "فشل في الحفظ") //
      }
    } catch (err) { console.error("Save error:", err) }
    finally { setSubmitting(false) }
  }

  const filtered = items.filter(i => i.name?.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="p-8 font-arabic text-right" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">إدارة سجل الأطباء</h1>
        <Button onClick={() => setAddOpen(true)} className="bg-blue-600 rounded-xl px-6 h-11">
          <Plus className="ml-2 h-5 w-5" /> إضافة طبيب جديد
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
        <Input placeholder="بحث عن طبيب..." className="pr-10 h-11 rounded-xl" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="text-right sm:max-w-[500px] rounded-2xl">
          <DialogHeader><DialogTitle className="text-right border-b pb-4 font-bold">إضافة طبيب جديد</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <Input placeholder="اسم الطبيب" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-11 rounded-xl" />
            
            <select className="w-full h-11 border rounded-xl px-2 bg-slate-50" value={form.hospitalId} onChange={e => setForm({...form, hospitalId: e.target.value})}>
              <option value="">اختر المستشفى</option>
              {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>

            <select className="w-full h-11 border rounded-xl px-2 bg-slate-50" value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})}>
              <option value="">اختر التخصص (من الأقسام)</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>

            <Input placeholder="رقم الهاتف" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-11 rounded-xl" dir="ltr" />
            
            <select className="w-full h-11 border rounded-xl px-2 bg-slate-50" value={form.workSchedule} onChange={e => setForm({...form, workSchedule: e.target.value})}>
              <option value="">اختر أيام المداومة</option>
              <option value="السبت، الاثنين، الأربعاء">السبت، الاثنين، الأربعاء</option>
              <option value="الأحد، الثلاثاء، الخميس">الأحد، الثلاثاء، الخميس</option>
            </select>
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={onSave} disabled={submitting} className="flex-1 bg-blue-600 h-11 rounded-xl">
              {submitting ? <Loader2 className="animate-spin" /> : 'حفظ البيانات'}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="rounded-2xl shadow-sm border-0">
        <CardContent className="p-0 overflow-hidden">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b text-slate-500">
              <tr>
                <th className="p-4">اسم الطبيب</th>
                <th className="p-4">المستشفى</th>
                <th className="p-4">التخصص</th>
                <th className="p-4">رقم الهاتف</th>
                <th className="p-4">المواعيد</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold">{item.name}</td>
                  <td className="p-4 text-slate-600">{item.hospital?.name}</td>
                  <td className="p-4"><span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">{item.specialty}</span></td>
                  <td className="p-4 font-mono">{item.phone}</td>
                  <td className="p-4 text-slate-600 font-medium text-xs">{item.workSchedule}</td>
                  <td className="p-4 text-center">
                    <Button variant="ghost" className="text-red-500 hover:bg-red-50 h-9 w-9 p-0"><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}