'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pencil, Plus, Search, Loader2, AlertCircle } from 'lucide-react'

type Hospital = { id: string; hospitalName: string }
type Department = { id: string; name: string; hospitalId: string }
type ServiceRecord = {
  id: string; name: string; price: number; isAvailable: boolean
  departmentId: string; departmentName: string; hospitalId: string; hospitalName: string
}

const sel = 'w-full rounded-lg border border-input bg-background px-3 h-11 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'

const blank = { name: '', price: '', isAvailable: true, hospitalId: '', departmentId: '' }

export default function ServicesPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<ServiceRecord[]>([])
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
      const [sRes, hRes, dRes] = await Promise.all([
        fetch('/api/project/Medical-Services/services'),
        fetch('/api/project/Medical-Services/hospitals'),
        fetch('/api/project/Medical-Services/departments'),
      ])
      const [sData, hData, dData] = await Promise.all([sRes.json(), hRes.json(), dRes.json()])
      setItems(Array.isArray(sData) ? sData : [])
      setHospitals(Array.isArray(hData.hospitals) ? hData.hospitals : [])
      setDepartments(Array.isArray(dData) ? dData : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const isValid = (f: typeof blank) => f.name.trim() !== '' && f.departmentId !== ''

  const filteredDepts = (hospitalId: string) => departments.filter(d => d.hospitalId === hospitalId)

  const onAdd = async () => {
    if (!isValid(addForm)) return
    setAddSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/services', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      if (res.ok) { await fetchAll(); setAddOpen(false); setAddForm(blank) }
    } finally { setAddSub(false) }
  }

  const openEdit = (item: ServiceRecord) => {
    setEditId(item.id)
    setEditForm({ name: item.name, price: String(item.price), isAvailable: item.isAvailable, hospitalId: item.hospitalId, departmentId: item.departmentId })
    setEditOpen(true)
  }

  const onEdit = async () => {
    if (!isValid(editForm)) return
    setEditSub(true)
    try {
      const res = await fetch('/api/project/Medical-Services/services', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...editForm }),
      })
      if (res.ok) { await fetchAll(); setEditOpen(false) }
    } finally { setEditSub(false) }
  }

  const filtered = useMemo(() =>
    items.filter(i => i.name?.toLowerCase().includes(q.toLowerCase()) || i.hospitalName?.toLowerCase().includes(q.toLowerCase())),
    [items, q]
  )

  const FormFields = ({ form, setForm }: { form: typeof blank; setForm: (v: typeof blank) => void }) => (
    <div className="flex flex-col gap-4 py-2">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">المستشفى</label>
        <select className={sel} value={form.hospitalId} onChange={e => setForm({ ...form, hospitalId: e.target.value, departmentId: '' })}>
          <option value="">اختر المستشفى</option>
          {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospitalName}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">القسم</label>
        <select className={sel} value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} disabled={!form.hospitalId}>
          <option value="">{form.hospitalId ? 'اختر القسم' : 'اختر المستشفى أولاً'}</option>
          {filteredDepts(form.hospitalId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
    <div className="w-full px-4 py-6">
      <div className="mb-6"><h1 className="text-2xl font-bold">سجل الخدمات الطبية</h1></div>

      <Card className="overflow-hidden rounded-xl border shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث..." className="h-10 pe-10" />
            </div>
            <Button onClick={() => { setAddForm(blank); setAddOpen(true) }} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 gap-2 sm:ms-auto">
              <Plus className="h-4 w-4" /> إضافة خدمة
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="p-4 font-semibold text-muted-foreground">المستشفى</th>
                  <th className="p-4 font-semibold text-muted-foreground">القسم</th>
                  <th className="p-4 font-semibold text-muted-foreground">الخدمة</th>
                  <th className="p-4 font-semibold text-muted-foreground">التكلفة</th>
                  <th className="p-4 font-semibold text-muted-foreground">الحالة</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={6} className="p-16 text-center"><Loader2 className="animate-spin mx-auto size-5" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-16 text-center text-muted-foreground italic">لا توجد بيانات</td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-blue-600">{item.hospitalName}</td>
                    <td className="p-4 text-muted-foreground">{item.departmentName}</td>
                    <td className="p-4 font-semibold">{item.name}</td>
                    <td className="p-4 font-mono text-blue-600">{item.price > 0 ? `${item.price} ₪` : 'مجاني'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {item.isAvailable ? 'متاحة' : 'غير متوفرة'}
                      </span>
                    </td>
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

      {/* Add */}
      <Dialog open={addOpen} onOpenChange={open => { setAddOpen(open); if (!open) setAddForm(blank) }}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-start text-lg font-bold">إضافة خدمة جديدة</DialogTitle></DialogHeader>
          <FormFields form={addForm} setForm={setAddForm} />
          {!isValid(addForm) && <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> يرجى تعبئة الحقول المطلوبة</div>}
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={onAdd} disabled={!isValid(addForm) || addSub} className="flex-1 h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">
              {addSub && <Loader2 className="animate-spin size-4" />} حفظ
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-start text-lg font-bold">تعديل الخدمة</DialogTitle></DialogHeader>
          <FormFields form={editForm} setForm={setEditForm} />
          {!isValid(editForm) && <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> يرجى تعبئة الحقول المطلوبة</div>}
          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button onClick={onEdit} disabled={!isValid(editForm) || editSub} className="flex-1 h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">
              {editSub && <Loader2 className="animate-spin size-4" />} حفظ
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
