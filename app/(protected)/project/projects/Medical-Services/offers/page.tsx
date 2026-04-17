'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '../../../../../../components/ui/card'
import { Button } from '../../../../../../components/ui/button'
import { Input } from '../../../../../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../../../components/ui/dialog'
import { 
  Pencil, 
  Plus, 
  Search, 
  Loader2, 
  Tag
} from 'lucide-react'

type Offer = {
  id: string
  title: string
  discount: string
  old_price: string
  new_price: string
}

const BASE_URL = '/api/project/projects/offers' 
const topControlHeight = 'h-10'
const inputBaseClass = 'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-100 font-normal'
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

// خيارات عناوين العروض المقترحة
const OFFER_TITLES = [
  "فحص شامل للقلب",
  "خصم على تنظيف الأسنان",
  "تحليل دم كامل",
  "جلسة علاج طبيعي",
  "كشف عيون تخصصي",
  "فحص الأشعة السينية"
]

export default function OffersPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5) 

  const [addOpen, setAddOpen] = useState(false)
  
  const [title, setTitle] = useState('')
  const [discount, setDiscount] = useState('')
  const [old_price, setOldPrice] = useState('')
  const [new_price, setNewPrice] = useState('')
  
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Omit<Offer, 'id'>>({
    title: '', discount: '', old_price: '', new_price: ''
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(data)
    } catch (err) { console.error('Fetch error:', err) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const isEditValid = useMemo(() => {
    return editDraft.title !== '' && editDraft.new_price.trim() !== ''
  }, [editDraft])

  const isAddValid = useMemo(() => {
    return title !== '' && new_price.trim() !== ''
  }, [title, new_price])

  const onAdd = async () => {
    if (!isAddValid) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, discount, old_price, new_price })
      })
      if (res.ok) {
        await fetchData()
        setAddOpen(false)
        resetAddForm()
      }
    } finally { setSubmitting(false) }
  }

  const saveEditRow = async (id: string) => {
    if (!isEditValid) return
    try {
      const res = await fetch(`${BASE_URL}?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft)
      })
      if (res.ok) {
        await fetchData()
        setEditingId(null)
      }
    } catch (err) { console.error(err) }
  }

  const resetAddForm = () => {
    setTitle(''); setDiscount(''); setOldPrice(''); setNewPrice('');
  }

  const filtered = useMemo(() => {
    return items.filter((c) => !q || c.title.includes(q))
  }, [q, items])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      {/* العنوان على اليمين */}
      <div className="mb-6 flex items-center justify-start gap-2 font-arabic">
        <Tag className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-slate-900">إدارة العروض الطبية</h1>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white font-arabic">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث عن عرض..."
                className={`${inputBaseClass} ${topControlHeight} pr-10 bg-slate-50 border-none`}
              />
            </div>
            <Button onClick={() => setAddOpen(true)} className={`bg-blue-600 text-white hover:bg-blue-700 ${topControlHeight} px-4 rounded-lg mr-auto font-bold`}>
              <Plus className="h-4 w-4 ml-2" /> إضافة عرض جديد
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-slate-500 font-bold">عنوان العرض</th>
                  <th className="p-4 text-slate-500 font-bold">نسبة الخصم</th>
                  <th className="p-4 text-slate-500 font-bold">السعر القديم</th>
                  <th className="p-4 text-slate-500 font-bold">السعر الجديد</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : paginatedData.map((c) => {
                  const isEditing = editingId === c.id;
                  return (
                    <tr key={c.id} className={isEditing ? 'bg-blue-50/40' : 'hover:bg-slate-50/50 transition-colors'}>
                      <td className="p-4 font-bold">
                        {isEditing ? (
                          <select 
                            className={selectBaseClass} 
                            value={editDraft.title} 
                            onChange={e => setEditDraft({...editDraft, title: e.target.value})}
                          >
                            <option value="">اختر عرضاً</option>
                            {OFFER_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : c.title}
                      </td>
                      <td className="p-4 text-blue-600 font-bold">{isEditing ? <Input value={editDraft.discount} onChange={e => setEditDraft({...editDraft, discount: e.target.value})} /> : c.discount}</td>
                      <td className="p-4 text-slate-400 line-through">{isEditing ? <Input value={editDraft.old_price} onChange={e => setEditDraft({...editDraft, old_price: e.target.value})} /> : c.old_price}</td>
                      <td className="p-4 text-green-600 font-bold">{isEditing ? <Input value={editDraft.new_price} onChange={e => setEditDraft({...editDraft, new_price: e.target.value})} /> : c.new_price}</td>
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" onClick={() => saveEditRow(c.id)}>حفظ</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>إلغاء</Button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingId(c.id); setEditDraft(c); }} className="p-2 hover:bg-blue-50 rounded-md text-slate-400 hover:text-blue-600 transition-colors">
                            <Pencil className="w-4 h-4"/>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md font-arabic rounded-2xl shadow-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">إضافة عرض طبي جديد</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-4 text-right">
            
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">عنوان العرض</label>
               <select 
                  className={`${selectBaseClass} h-11 bg-slate-50 border-slate-200`} 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
               >
                  <option value="">اختر اسم العرض أو الخدمة</option>
                  {OFFER_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">نسبة الخصم (%)</label>
               <Input className="h-11 bg-slate-50 border-slate-200" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="مثلاً: 20%" />
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">السعر القديم</label>
               <Input className="h-11 bg-slate-50 border-slate-200" value={old_price} onChange={e => setOldPrice(e.target.value)} placeholder="السعر قبل الخصم" />
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">السعر الجديد</label>
               <Input className="h-11 bg-slate-50 border-slate-200" value={new_price} onChange={e => setNewPrice(e.target.value)} placeholder="السعر بعد الخصم" />
            </div>

          </div>

          <DialogFooter className="gap-3 mt-2">
            <Button onClick={onAdd} disabled={submitting || !isAddValid} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null} حفظ العرض
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 border-slate-200 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}