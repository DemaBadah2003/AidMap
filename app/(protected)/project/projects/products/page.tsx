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
import { Pencil, Plus, Search, Loader2, Check, X } from 'lucide-react'

const BASE_URL = '/api/project/projects/products'

async function requestJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message || 'خطأ في الطلب')
  return data
}

export default function ProductsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // --- حالات الـ Pagination ---
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // حالات التعديل
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<any>(null)
  
  // حالات الإضافة
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newFormData, setNewFormData] = useState({ nameAr: '', price: 0, quantity: 0 })
  
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadInitialData() }, [])

  const loadInitialData = async () => {
    try {
      const data = await requestJSON<any[]>(BASE_URL)
      setItems(data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const startEdit = (item: any) => {
    setEditFormData({ ...item }) 
    setEditingId(item.id)
  }

  const onSaveUpdate = async (idFromClick: string) => {
    if (!idFromClick) {
        alert("خطأ: المعرف غير موجود")
        return
    }

    setSubmitting(true)
    try {
      const updated = await requestJSON<any>(`${BASE_URL}?id=${idFromClick}`, { 
        method: 'PUT', 
        body: JSON.stringify(editFormData) 
      })
      
      setItems(prev => prev.map(p => p.id === idFromClick ? updated : p))
      setEditingId(null)
      setEditFormData(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const onSaveCreate = async () => {
    setSubmitting(true)
    try {
      const created = await requestJSON<any>(BASE_URL, { 
        method: 'POST', 
        body: JSON.stringify(newFormData) 
      })
      setItems(prev => [created, ...prev])
      setIsAddOpen(false)
      setNewFormData({ nameAr: '', price: 0, quantity: 0 })
      setCurrentPage(1) // العودة للصفحة الأولى عند الإضافة
    } catch (err: any) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  // --- تصفية البيانات ---
  const filtered = useMemo(() => {
    return items.filter((p) => {
      const matchSearch = !q || p.nameAr?.toLowerCase().includes(q.toLowerCase())
      const matchStatus = statusFilter === 'all' ? true : p.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

  // --- حسابات الـ Pagination ---
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [q, statusFilter, itemsPerPage])

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, filtered.length)

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>

  return (
    <div className="w-full px-4 py-3" dir="rtl">
      <div className="mb-6 text-right px-2">
        <h1 className="text-2xl font-bold text-slate-900">إدارة المنتجات</h1>
      </div>

      <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col lg:flex-row gap-4 justify-between items-center border-b bg-slate-50/30">
            <div className="flex gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none lg:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} className="pr-9 rounded-lg" />
              </div>
              <select className="border rounded-lg px-3 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">الكل</option>
                <option value="MOJOUD">موجود</option>
                <option value="GHAIR_MOJOUD">غير موجود</option>
              </select>
            </div>
            <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white w-full lg:w-auto rounded-lg">
              <Plus className="ml-2 h-4 w-4" /> إضافة منتج
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 border-b text-slate-600 font-bold">اسم المنتج</th>
                  <th className="p-4 border-b text-slate-600 font-bold">السعر</th>
                  <th className="p-4 border-b text-slate-600 font-bold">الكمية</th>
                  <th className="p-4 border-b text-slate-600 font-bold">الحالة</th>
                  <th className="p-4 border-b text-center text-slate-600 font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length === 0 ? (
                   <tr><td colSpan={5} className="p-10 text-center text-slate-400">لا توجد منتجات مطابقة للبحث.</td></tr>
                ) : (
                  paginatedData.map((p) => (
                    <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${editingId === p.id ? 'bg-blue-50/40' : ''}`}>
                      <td className="p-4">
                        {editingId === p.id ? (
                          <Input className="h-9" value={editFormData.nameAr} onChange={e => setEditFormData({...editFormData, nameAr: e.target.value})} />
                        ) : p.nameAr}
                      </td>
                      <td className="p-4">
                        {editingId === p.id ? (
                          <Input className="h-9 w-24" type="number" value={editFormData.price} onChange={e => setEditFormData({...editFormData, price: Number(e.target.value)})} />
                        ) : `${p.price} $`}
                      </td>
                      <td className="p-4">
                        {editingId === p.id ? (
                          <Input className="h-9 w-24" type="number" value={editFormData.quantity} onChange={e => setEditFormData({...editFormData, quantity: Number(e.target.value)})} />
                        ) : p.quantity}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[11px] font-bold ${p.status === 'MOJOUD' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {p.uiStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {editingId === p.id ? (
                          <div className="flex justify-center gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 w-8 p-0 rounded-full shadow-sm" onClick={() => onSaveUpdate(p.id)} disabled={submitting}>
                              {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 rounded-full" onClick={() => {setEditingId(null); setEditFormData(null);}}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 rounded-full" onClick={() => startEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- قسم الـ Pagination --- */}
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
              </select>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500 font-medium">
                {rangeStart} - {rangeEnd} <span className="mx-1 text-slate-300">|</span> من {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 border-slate-200 hover:bg-white font-normal rounded-lg shadow-sm" 
                  disabled={currentPage <= 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  السابق
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 border-slate-200 hover:bg-white font-normal rounded-lg shadow-sm" 
                  disabled={currentPage >= totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent dir="rtl" className="rounded-2xl">
          <DialogHeader className="text-right"><DialogTitle className="text-xl font-bold">إضافة منتج جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 text-right">
            <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">الاسم</label><Input value={newFormData.nameAr} onChange={e => setNewFormData({...newFormData, nameAr: e.target.value})} className="rounded-lg" /></div>
            <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">السعر</label><Input type="number" value={newFormData.price} onChange={e => setNewFormData({...newFormData, price: Number(e.target.value)})} className="rounded-lg" /></div>
            <div className="space-y-1.5"><label className="text-sm font-semibold text-slate-700">الكمية</label><Input type="number" value={newFormData.quantity} onChange={e => setNewFormData({...newFormData, quantity: Number(e.target.value)})} className="rounded-lg" /></div>
          </div>
          <DialogFooter className="gap-2 pt-4 sm:justify-start">
             <Button onClick={onSaveCreate} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white flex-1 rounded-lg">
               {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'حفظ'}
             </Button>
             <Button variant="outline" onClick={() => setIsAddOpen(false)} className="flex-1 rounded-lg">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}