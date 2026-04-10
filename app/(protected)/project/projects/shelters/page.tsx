'use client'

import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { Card, CardContent } from '../../../../../components/ui/card'
import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../../components/ui/dialog'
import { Pencil, Save, X, Plus, Search } from 'lucide-react'

// --- الثوابت والأنواع ---
const REGIONS = ['شرق', 'غرب', 'شمال', 'جنوب'] as const;
const FILL_STATUSES = ['ممتلئ', 'غير ممتلئ'] as const;

type Region = (typeof REGIONS)[number]
type FillStatus = (typeof FILL_STATUSES)[number]

type Shelter = {
  id: string
  nameAr: string
  areaAr: string
  supervisorAr: string
  phone: string
  familiesCount: number
  capacity: number
  fillStatus?: FillStatus
}

// --- مخطط التحقق Zod ---
const shelterSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم المركز مطلوب'),
  areaAr: z.enum(REGIONS).catch('شمال' as any), 
  supervisorAr: z.string().trim().min(1, 'اسم المشرف مطلوب'),
  phone: z
    .string()
    .trim()
    .min(1, 'رقم الهاتف مطلوب')
    .regex(/^(056|059)\d{7}$/, 'يجب أن يبدأ بـ 056 أو 059 ويتكون من 10 أرقام'),
  capacity: z.coerce.number().gt(0, 'السعة يجب أن تكون أكبر من صفر'),
  fillStatus: z.enum(FILL_STATUSES).catch('غير ممتلئ' as any),
})

const BASE_URL = '/api/project/projects/shelter'

export default function SheltersPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Shelter[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'الكل' | FillStatus>('الكل')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // بيانات الإضافة
  const [addOpen, setAddOpen] = useState(false)
  const [formData, setFormData] = useState({
    nameAr: '',
    areaAr: 'شمال' as Region,
    supervisorAr: '',
    phone: '',
    capacity: 0,
    fillStatus: 'غير ممتلئ' as FillStatus,
  })
  const [submitting, setSubmitting] = useState(false)

  // بيانات التعديل
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Omit<Shelter, 'id' | 'familiesCount'>>({
    nameAr: '',
    areaAr: 'شمال',
    supervisorAr: '',
    phone: '',
    capacity: 0,
    fillStatus: 'غير ممتلئ',
  })

  useEffect(() => {
    const fetchShelters = async () => {
      setLoading(true)
      try {
        const res = await fetch(BASE_URL)
        const data = await res.json()
        setItems(data)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchShelters()
  }, [])

  const filtered = useMemo(() => {
    return items.filter(sh => {
      const name = sh.nameAr || ''
      const area = sh.areaAr || ''
      const phone = sh.phone || ''
      const matchSearch = name.includes(q) || area.includes(q) || phone.includes(q)
      const matchStatus = statusFilter === 'الكل' || sh.fillStatus === statusFilter
      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

  const validate = (data: any) => {
    const result = shelterSchema.safeParse(data)
    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0].toString()
        errors[fieldName] = issue.message
      })
      setFormErrors(errors)
      return false
    }
    setFormErrors({})
    return true
  }

  const onAdd = async () => {
    if (!validate(formData)) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Failed to save')
      const created = await res.json()
      setItems(prev => [created, ...prev])
      setAddOpen(false)
      setFormData({ nameAr: '', areaAr: 'شمال', supervisorAr: '', phone: '', capacity: 0, fillStatus: 'غير ممتلئ' })
    } catch (err) { alert('حدث خطأ أثناء الحفظ') }
    finally { setSubmitting(false) }
  }

  const saveEditRow = async (id: string) => {
    if (!validate(editDraft)) return
    try {
      const res = await fetch(`${BASE_URL}?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft)
      })
      const updated = await res.json()
      setItems(prev => prev.map(sh => sh.id === id ? { ...sh, ...updated } : sh))
      setEditingId(null)
      setFormErrors({})
    } catch (err) { alert('حدث خطأ أثناء التعديل') }
  }

  return (
    <div className="w-full px-4 py-5" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">إدارة مراكز الإيواء</h1>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* الأدوات: البحث والفلترة والزر مجمعين داخل الكارد */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between mb-6">
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." className="pr-9" />
              </div>
              <select 
                className="border rounded-lg px-3 text-sm bg-white h-10 outline-none"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="الكل">كل الحالات</option>
                <option value="ممتلئ">ممتلئ</option>
                <option value="غير ممتلئ">غير ممتلئ</option>
              </select>
            </div>
            
            {/* الزر داخل الكارد على اليسار (في وضع الـ LTR) أو اليمين (في وضع الـ RTL) */}
            <Button onClick={() => { setFormErrors({}); setAddOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
               إضافة مركز إيواء <Plus className="mr-2 h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-4">اسم المركز</th>
                  <th className="p-4">المنطقة</th>
                  <th className="p-4">المشرف</th>
                  <th className="p-4">الهاتف</th>
                  <th className="p-4">السعة</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sh) => (
                  <tr key={sh.id} className="border-b hover:bg-slate-50/50 transition-colors">
                    {editingId === sh.id ? (
                      <>
                        <td className="p-2"><Input value={editDraft.nameAr} onChange={(e)=>setEditDraft({...editDraft, nameAr: e.target.value})} /></td>
                        <td className="p-2">
                          <select className="border rounded p-2 w-full h-10" value={editDraft.areaAr} onChange={(e)=>setEditDraft({...editDraft, areaAr: e.target.value as Region})}>
                            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="p-2"><Input value={editDraft.supervisorAr} onChange={(e)=>setEditDraft({...editDraft, supervisorAr: e.target.value})} /></td>
                        <td className="p-2"><Input value={editDraft.phone} onChange={(e)=>setEditDraft({...editDraft, phone: e.target.value})} /></td>
                        <td className="p-2"><Input type="number" value={editDraft.capacity} onChange={(e)=>setEditDraft({...editDraft, capacity: +e.target.value})} /></td>
                        <td className="p-2 text-center">
                          <select className="border rounded p-1 h-9" value={editDraft.fillStatus} onChange={(e)=>setEditDraft({...editDraft, fillStatus: e.target.value as FillStatus})}>
                             {FILL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="p-2 flex justify-center gap-1">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => saveEditRow(sh.id)}><Save className="h-4 w-4"/></Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4 text-red-500"/></Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-medium">{sh.nameAr}</td>
                        <td className="p-4">{sh.areaAr}</td>
                        <td className="p-4">{sh.supervisorAr}</td>
                        <td className="p-4" dir="ltr">{sh.phone}</td>
                        <td className="p-4">{sh.capacity}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${sh.fillStatus === 'ممتلئ' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {sh.fillStatus}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => {setEditingId(sh.id); setEditDraft(sh);}} className="p-2 hover:bg-blue-50 rounded-lg">
                            <Pencil className="h-4 w-4 text-slate-500" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* مودال إضافة مركز إيواء جديد */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-bold">إضافة مركز إيواء جديد</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-1">
              <label className="text-sm font-semibold">اسم المركز</label>
              <Input 
                value={formData.nameAr} 
                onChange={(e)=>setFormData({...formData, nameAr: e.target.value})} 
                className={formErrors.nameAr ? 'border-red-500' : ''}
              />
              {formErrors.nameAr && <span className="text-xs text-red-500">{formErrors.nameAr}</span>}
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-semibold">المنطقة</label>
              <select 
                className="w-full border rounded-md p-2 text-sm h-10 bg-white outline-none"
                value={formData.areaAr} 
                onChange={(e)=>setFormData({...formData, areaAr: e.target.value as Region})}
              >
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-semibold">المشرف</label>
              <Input value={formData.supervisorAr} onChange={(e)=>setFormData({...formData, supervisorAr: e.target.value})} />
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-semibold">رقم الهاتف</label>
              <Input value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} placeholder="059XXXXXXX" />
            </div>

            <div className="grid gap-4">
              <div className="grid gap-1">
                <label className="text-sm font-semibold">السعة</label>
                <Input 
                  type="number" 
                  value={formData.capacity} 
                  onChange={(e)=>setFormData({...formData, capacity: +e.target.value})} 
                />
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-semibold">الحالة</label>
                <select 
                  className="w-full border rounded-md p-2 text-sm h-10 bg-white outline-none"
                  value={formData.fillStatus} 
                  onChange={(e)=>setFormData({...formData, fillStatus: e.target.value as FillStatus})}
                >
                  {FILL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row-reverse gap-2 w-full">
            <Button onClick={onAdd} disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {submitting ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}