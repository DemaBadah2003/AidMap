'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Pencil, Plus, Search, Loader2, MapPin, Map, Check, X, Compass, Navigation, Building2 } from 'lucide-react'

// توزيع المناطق حسب الموقع الجغرافي (سنبقيها للاستخدام في الموقع فقط)
const REGIONS_BY_LOCATION: Record<string, string[]> = {
  'شمال': ['جباليا', 'بيت لاهيا', 'بيت حانون'],
  'جنوب': ['رفح', 'خانيونس', 'القرارة'],
  'شرق': ['الشجاعية', 'الزيتون', 'التفاح', 'الدرج'],
  'غرب': ['الشيخ رضوان', 'الرمال', 'النصر', 'تل الهوى', 'مخيم الشاطئ']
}

type AddressData = {
  id: string
  location: string 
  region: string    
}

const BASE_URL = '/api/project/Medical-Services/Address'

export default function AddressesPage() {
  const [items, setItems] = useState<AddressData[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    location: '',
    region: ''
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(data.addresses || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const search = q.toLowerCase();
      return (
        (item.location?.toLowerCase() || "").includes(search) ||
        (item.region?.toLowerCase() || "").includes(search)
      )
    })
  }, [items, q])

  const isFormValid = useMemo(() => {
    return form.location && form.region
  }, [form])

  const onSave = async (id?: string) => {
    if (!isFormValid) return
    setSubmitting(true)
    try {
      const isEdit = !!id
      const url = isEdit ? `${BASE_URL}?id=${id}` : BASE_URL
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id, ...form } : form)
      })

      if (res.ok) {
        await fetchData()
        setAddOpen(false)
        setEditingId(null)
        resetForm()
      }
    } finally { setSubmitting(false) }
  }

  const startEdit = (item: AddressData) => {
    setEditingId(item.id)
    setForm({
      location: item.location,
      region: item.region
    })
  }

  const resetForm = () => {
    setForm({ location: '', region: '' })
  }

  return (
    <div className="w-full px-4 py-8 sm:px-10" dir="rtl">
      <div className="mb-8 text-right px-2 font-arabic">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">إدارة المواقع والجهات</h1>
        <p className="text-sm text-muted-foreground mt-1 text-blue-600 font-medium">مشروع AidMap - تنظيم النطاق الجغرافي</p>
      </div>

      <Card className="border shadow-md bg-white rounded-xl overflow-hidden font-arabic">
        <CardContent className="p-0">
          <div className="p-5 border-b flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/50">
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." className="pr-9 text-right bg-white border-slate-200 rounded-lg" />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 w-full sm:w-auto px-6 rounded-lg shadow-sm" 
                    onClick={() => { setEditingId(null); resetForm(); setAddOpen(true); }}>
              <Plus className="h-5 w-5" /> إضافة سجل جديد
            </Button>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm text-right border-separate border-spacing-y-2">
              <thead>
                <tr className="text-slate-500">
                  <th className="px-4 py-3 font-semibold">الموقع</th>
                  <th className="px-4 py-3 font-semibold">المنطقة</th>
                  <th className="px-4 py-3 font-semibold text-center">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={3} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
                ) : filteredItems.map((item) => (
                  <tr key={item.id} className={`transition-all border shadow-sm ${editingId === item.id ? 'bg-blue-50/40 ring-1 ring-blue-200' : 'bg-white hover:bg-slate-50'}`}>
                    {editingId === item.id ? (
                      <>
                        <td className="px-4 py-2 rounded-r-xl">
                          <select className="w-full h-9 border rounded text-xs bg-white" value={form.location} onChange={e => setForm({...form, location: e.target.value})}>
                            <option value="">اختر الموقع</option>
                            {Object.keys(REGIONS_BY_LOCATION).map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <Input 
                            className="h-9 text-xs bg-white border-slate-200" 
                            value={form.region} 
                            onChange={e => setForm({...form, region: e.target.value})}
                            placeholder="اكتب اسم المنطقة..."
                          />
                        </td>
                        <td className="px-4 py-2 text-center rounded-l-xl">
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" onClick={() => onSave(item.id)} disabled={!isFormValid} className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0 rounded-full shadow-sm">
                               {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-white" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 rounded-full"><X className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-4 rounded-r-xl font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <Compass className="w-4 h-4 text-blue-600" /> {item.location}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-blue-700 font-bold">
                           <div className="flex items-center gap-1">
                             <Navigation className="w-3.5 h-3.5" /> {item.region}
                           </div>
                        </td>
                        <td className="px-4 py-4 text-center rounded-l-xl">
                           <Button variant="ghost" size="sm" onClick={() => startEdit(item)} className="h-9 w-9 p-0 text-blue-500 hover:bg-blue-50 rounded-full transition-all">
                              <Pencil className="h-4 w-4" />
                           </Button>
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="text-right sm:max-w-[450px] rounded-2xl font-arabic">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <Building2 className="text-blue-600" /> إضافة سجل جديد
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid gap-1">
                  <label className="text-xs font-bold text-slate-600">الموقع</label>
                  <select className="h-11 border border-slate-200 rounded-xl px-2 bg-slate-50" value={form.location} onChange={e => setForm({...form, location: e.target.value})}>
                      <option value="">اختر الموقع</option>
                      {Object.keys(REGIONS_BY_LOCATION).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
              </div>
              <div className="grid gap-1">
                  <label className="text-xs font-bold text-slate-600">اسم المنطقة</label>
                  <Input 
                    className="h-11 border border-slate-200 rounded-xl px-4 bg-slate-50" 
                    value={form.region} 
                    onChange={e => setForm({...form, region: e.target.value})}
                    placeholder="اكتب اسم المنطقة هنا..."
                  />
              </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button onClick={() => onSave()} disabled={!isFormValid || submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 flex-1 rounded-xl order-first">
               {submitting ? <Loader2 className="animate-spin" /> : 'حفظ البيانات'}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="h-12 flex-1 rounded-xl border-slate-200 text-slate-600 order-last">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}