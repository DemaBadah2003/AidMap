'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { Pencil, Save, X, Plus, Search, CheckCircle2, Loader2, ChevronRight, ChevronLeft } from 'lucide-react'

// بيانات المناطق والمواقع الثابتة
const REGIONS_DATA: Record<string, string[]> = {
  "شمال": ["جباليا", "بيت لاهيا", "بيت حانون", "التوام", "العطاطرة"],
  "جنوب": ["خانيونس", "رفح", "القرارة", "بني سهيلا"],
  "وسط": ["النصيرات", "دير البلح", "البريج", "المغازي", "الزوايدة"],
  "غزة": ["الرمال", "النصر", "الشيخ رضوان", "تل الهوا"],
  "شرق": ["الشجاعية", "الزيتون", "التفاح"],
}

type CampOption = { id: string; name: string }
type Address = {
  id: string
  governorate: string
  city: string
  campId: string
  camp?: { id: string; name: string } | null
}

const ADDRESS_BASE_URL = '/api/project/projects/address'
const CAMPS_BASE_URL = '/api/project/projects/camps?forBeneficiary=true'

async function requestJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message || 'خطأ في الطلب')
  return data
}

export default function AddressPage() {
  const [items, setItems] = useState<Address[]>([])
  const [campOptions, setCampOptions] = useState<CampOption[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  
  // --- Pagination States ---
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [newFormData, setNewFormData] = useState({ campId: '', city: '', governorate: '' })
  const [editDraft, setEditDraft] = useState({ campId: '', city: '', governorate: '' })

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [addrs, camps] = await Promise.all([
        requestJSON<Address[]>(ADDRESS_BASE_URL),
        requestJSON<CampOption[]>(CAMPS_BASE_URL)
      ])
      setItems(Array.isArray(addrs) ? addrs : [])
      setCampOptions(Array.isArray(camps) ? camps : [])
    } catch (err) {
      console.error(err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadInitialData() }, [])

  const availableLocations = useMemo(() => 
    newFormData.city ? REGIONS_DATA[newFormData.city] || [] : [], [newFormData.city])
  
  const editAvailableLocations = useMemo(() => 
    editDraft.city ? REGIONS_DATA[editDraft.city] || [] : [], [editDraft.city])

  // الفلترة
  const filtered = useMemo(() => {
    const data = Array.isArray(items) ? items : []
    return data.filter(a => 
      !q || 
      a.governorate?.toLowerCase().includes(q.toLowerCase()) || 
      a.city?.toLowerCase().includes(q.toLowerCase()) || 
      a.camp?.name?.toLowerCase().includes(q.toLowerCase())
    )
  }, [items, q])

  // --- منطق الـ Pagination ---
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [q, itemsPerPage])

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, filtered.length)

  const onSaveCreate = async () => {
    if (!newFormData.campId || !newFormData.city || !newFormData.governorate) return
    setSubmitting(true)
    try {
      const created = await requestJSON<Address>(ADDRESS_BASE_URL, {
        method: 'POST',
        body: JSON.stringify(newFormData)
      })
      setItems(prev => [created, ...prev])
      setIsAddOpen(false)
      setNewFormData({ campId: '', city: '', governorate: '' })
      setCurrentPage(1)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const onSaveUpdate = async (id: string) => {
    setSubmitting(true)
    try {
      const updated = await requestJSON<Address>(`${ADDRESS_BASE_URL}?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(editDraft)
      })
      setItems(prev => prev.map(item => item.id === id ? updated : item))
      setEditingId(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="p-4 lg:p-6" dir="rtl">
      <div className="mb-6 text-right">
        <h1 className="text-xl font-bold text-slate-800">إدارة العناوين</h1>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="بحث عن عنوان..." 
                value={q} 
                onChange={e => setQ(e.target.value)} 
                className="pr-10 border-slate-200 text-right" 
              />
            </div>
            
            <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto px-6 font-bold">
              <Plus className="ml-2 h-4 w-4" /> إضافة عنوان
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50 text-slate-600 text-xs">
                <tr>
                  <th className="p-4 border-b font-semibold">اسم المخيم</th>
                  <th className="p-4 border-b font-semibold">المنطقة</th>
                  <th className="p-4 border-b font-semibold">الموقع</th>
                  <th className="p-4 border-b font-semibold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y">
                {paginatedData.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">لا توجد عناوين متاحة</td></tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${editingId === item.id ? 'bg-blue-50/50' : ''}`}>
                      <td className="p-4">
                        {editingId === item.id ? (
                          <select 
                            className="w-full border rounded p-1.5 bg-white"
                            value={editDraft.campId}
                            onChange={e => setEditDraft({...editDraft, campId: e.target.value})}
                          >
                            {campOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        ) : (item.camp?.name || "-")}
                      </td>
                      <td className="p-4">
                        {editingId === item.id ? (
                          <select 
                            className="w-full border rounded p-1.5 bg-white"
                            value={editDraft.city}
                            onChange={e => setEditDraft({...editDraft, city: e.target.value, governorate: ''})}
                          >
                            {Object.keys(REGIONS_DATA).map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : item.city}
                      </td>
                      <td className="p-4">
                        {editingId === item.id ? (
                          <select 
                            className="w-full border rounded p-1.5 bg-white"
                            value={editDraft.governorate}
                            onChange={e => setEditDraft({...editDraft, governorate: e.target.value})}
                            disabled={!editDraft.city}
                          >
                            <option value="">-- اختر الموقع --</option>
                            {editAvailableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                          </select>
                        ) : item.governorate}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          {editingId === item.id ? (
                            <>
                              <Button size="sm" onClick={() => onSaveUpdate(item.id)} disabled={submitting} className="h-8 bg-green-600 hover:bg-green-700">
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 text-red-500 hover:bg-red-50">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => {
                                setEditingId(item.id);
                                setEditDraft({ city: item.city || '', governorate: item.governorate || '', campId: item.campId || '' });
                              }} 
                              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- Pagination Footer --- */}
          {!loading && (
            <div className="p-4 flex items-center justify-between border-t bg-slate-50/30">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>عرض صفوف:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => setItemsPerPage(Number(e.target.value))} 
                  className="border rounded-md h-8 px-1 bg-white outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500 font-medium font-mono">
                  {rangeStart} - {rangeEnd} <span className="mx-1 text-slate-300">|</span> من {filtered.length}
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3 border-slate-200 hover:bg-white font-normal" 
                    disabled={currentPage <= 1} 
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    السابق
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3 border-slate-200 hover:bg-white font-normal" 
                    disabled={currentPage >= totalPages} 
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    التالي
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* مودال الإضافة */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader className="border-b pb-3 text-right">
            <DialogTitle className="flex items-center gap-2 font-bold">
              <Plus className="h-5 w-5 text-blue-600" />
              إضافة عنوان جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-right">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">1. المخيم</label>
              <select 
                className="w-full border rounded-lg p-2 bg-white text-sm" 
                value={newFormData.campId} 
                onChange={e => setNewFormData({...newFormData, campId: e.target.value})}
              >
                <option value="">-- اختر المخيم --</option>
                {campOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">2. المنطقة</label>
              <select 
                className="w-full border rounded-lg p-2 bg-white text-sm" 
                value={newFormData.city} 
                onChange={e => setNewFormData({...newFormData, city: e.target.value, governorate: ''})}
              >
                <option value="">-- اختر المنطقة --</option>
                {Object.keys(REGIONS_DATA).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">3. الموقع</label>
              <select 
                className="w-full border rounded-lg p-2 bg-white text-sm" 
                value={newFormData.governorate} 
                onChange={e => setNewFormData({...newFormData, governorate: e.target.value})} 
                disabled={!newFormData.city}
              >
                <option value="">{newFormData.city ? "-- اختر الموقع --" : "اختر المنطقة أولاً"}</option>
                {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter className="flex flex-row-reverse gap-2 pt-2">
            <Button onClick={onSaveCreate} disabled={submitting || !newFormData.governorate || !newFormData.campId} className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2 font-bold">
              {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              حفظ البيانات
            </Button>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="flex-1">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}