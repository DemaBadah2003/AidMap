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
import { Pencil, Plus, Search, Loader2, AlertCircle } from 'lucide-react'

const REGIONS_DATA: Record<string, string[]> = {
  'شمال': ['جباليا', 'بيت لاهيا', 'بيت حانون'],
  'جنوب': ['رفح', 'خانيونس', 'القرارة'],
  'وسط': ['دير البلح', 'النصيرات', 'البريج'],
  'شرق': ['الشجاعية', 'الزيتون', 'التفاح'],
  'غرب': ['الشيخ رضوان', 'النصر', 'الرمال']
}

const BASE_URL = '/api/project/Medical-Services/Address'

export default function AddressPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  
  // مطابق للسكيما: title هو الموقع العام، description هو التفصيلي
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) { 
      console.error(err)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchItems() }, [])

  const isAddValid = title !== '' && description !== ''

  const onAdd = async () => {
    if (!isAddValid) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }) // إرسال مطابق للسكيما
      })
      
      if (res.ok) {
        await fetchItems()
        setAddOpen(false)
        setTitle(''); setDescription('');
      }
    } finally { setSubmitting(false) }
  }

  const filtered = useMemo(() => {
    return items.filter(item => 
      !q || item.title?.includes(q) || item.description?.includes(q)
    )
  }, [q, items])

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 text-right">
        <h1 className="text-2xl font-bold text-slate-900">إدارة المواقع</h1>
        <p className="text-sm text-slate-500 mt-1 font-normal">الرئيسية &gt; العناوين والمواقع</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث..."
                className="w-full pr-10 bg-slate-50 border-none h-10 rounded-lg text-sm"
              />
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 mr-auto h-10 px-4 rounded-lg">
              <Plus className="h-4 w-4 ml-2" /> إضافة موقع
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-slate-500 font-bold">الموقع العام (Title)</th>
                  <th className="p-4 text-slate-500 font-bold">المنطقة (Description)</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={3} className="p-20 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2" />جاري التحميل...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={3} className="p-20 text-center text-slate-400">لا توجد بيانات حالياً.</td></tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-700">{item.title}</td>
                    <td className="p-4 text-slate-600">{item.description}</td>
                    <td className="p-4 text-center">
                      <button className="p-2 border border-slate-100 rounded-md hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all">
                        <Pencil className="w-4 h-4"/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* نافذة الإضافة */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-right text-lg font-bold">إضافة موقع جديد</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">الموقع العام</label>
               <select 
                className="w-full border border-slate-200 rounded-lg h-11 px-3 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100" 
                value={title} 
                onChange={e => {setTitle(e.target.value); setDescription('')}}
               >
                  <option value="">اختر المنطقة الكبرى..</option>
                  {Object.keys(REGIONS_DATA).map(l => <option key={l} value={l}>{l}</option>)}
               </select>
            </div>
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">المنطقة التفصيلية</label>
               <select 
                className="w-full border border-slate-200 rounded-lg h-11 px-3 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                disabled={!title}
               >
                  <option value="">اختر الموقع التفصيلي..</option>
                  {title && REGIONS_DATA[title].map(r => <option key={r} value={r}>{r}</option>)}
               </select>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-3">
            <Button onClick={onAdd} disabled={submitting || !isAddValid} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-xl">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null} حفظ الموقع
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl border-slate-200">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}