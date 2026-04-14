'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '../../../../../components/ui/card'
import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../../components/ui/dialog'
import { Pencil, Save, X, Plus, Search, Loader2, ChevronRight, ChevronLeft } from 'lucide-react'

export default function EnterpriseProductsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [institutions, setInstitutions] = useState([])
  const [products, setProducts] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')

  // --- Pagination States (تم التعديل لتبدأ بـ 5 وتتبع تسلسلك) ---
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5) 

  const [addOpen, setAddOpen] = useState(false)
  const [institutionId, setInstitutionId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)

  const fetchOptions = async () => {
    const [resInst, resProd] = await Promise.all([
      fetch('/api/project/projects/institutions'),
      fetch('/api/project/projects/products')
    ])
    const instData = await resInst.json()
    const prodData = await resProd.json()
    if (Array.isArray(instData)) setInstitutions(instData.map(i => ({ id: i.id, label: i.nameAr || i.name })))
    if (Array.isArray(prodData)) setProducts(prodData.map(p => ({ id: p.id, label: p.nameAr || p.name })))
  }

  const fetchItems = async () => {
    setLoading(true)
    const res = await fetch('/api/project/projects/Enterprise-Products')
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchItems(); fetchOptions(); }, [])

  const filteredData = useMemo(() => {
    return items.filter((x) => {
      const searchStr = q.toLowerCase()
      const matchSearch = !q || 
        (x.institution?.nameAr || '').toLowerCase().includes(searchStr) || 
        (x.product?.nameAr || '').toLowerCase().includes(searchStr)
      const matchStatus = statusFilter === 'all' || 
        (statusFilter === 'available' ? x.availability === 'متوفر' : x.availability === 'غير متوفر')
      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredData.slice(start, start + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [q, statusFilter, itemsPerPage])

  const rangeStart = filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, filteredData.length)

  const onAdd = async () => {
    if (!institutionId || !productId || quantity === '') return
    setSubmitting(true)
    const res = await fetch('/api/project/projects/Enterprise-Products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institutionId, productId, quantity: Number(quantity), availability: Number(quantity) > 0 ? 'متوفر' : 'غير متوفر' }),
    })
    if (res.ok) { fetchItems(); setAddOpen(false); setInstitutionId(''); setProductId(''); setQuantity(''); setCurrentPage(1); }
    setSubmitting(false)
  }

  const onSaveEdit = async (id) => {
    const res = await fetch(`/api/project/projects/Enterprise-Products?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editDraft, availability: Number(editDraft.quantity) > 0 ? 'متوفر' : 'غير متوفر' }),
    })
    if (res.ok) { fetchItems(); setEditingId(null); }
  }

  return (
    <div className="w-full px-2 py-3 lg:px-6" dir="rtl">
      <div className="mb-6 text-right">
        <div className="text-xl font-bold text-slate-800 lg:text-2xl">منتجات المؤسسات</div>
        <div className="text-sm text-slate-400 mt-1">الرئيسية {'>'} إدارة منتجات المؤسسات</div>
      </div>

      <Card className="border shadow-sm rounded-xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-slate-50/50 border-b">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." className="pr-9 h-10 border-slate-200" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">كل الحالات</option>
                <option value="available">متوفر</option>
                <option value="notavailable">غير متوفر</option>
              </select>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-lg" onClick={() => setAddOpen(true)}>
              <Plus className="ml-2 h-4 w-4" /> إضافة منتج جديد
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b text-slate-500 text-sm">
                <tr>
                  <th className="px-6 py-4 font-bold">المؤسسة</th>
                  <th className="px-6 py-4 font-bold">المنتج</th>
                  <th className="px-6 py-4 font-bold">الكمية</th>
                  <th className="px-6 py-4 font-bold">الحالة</th>
                  <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" /></td></tr>
                ) : paginatedData.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {editingId === row.id ? (
                        <select value={editDraft.institutionId} onChange={(e) => setEditDraft({...editDraft, institutionId: e.target.value})} className="border rounded h-8 w-full">
                          {institutions.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                        </select>
                      ) : row.institution?.nameAr}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {editingId === row.id ? (
                        <select value={editDraft.productId} onChange={(e) => setEditDraft({...editDraft, productId: e.target.value})} className="border rounded h-8 w-full">
                          {products.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                      ) : row.product?.nameAr}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {editingId === row.id ? (
                        <Input type="number" value={editDraft.quantity} onChange={(e) => setEditDraft({...editDraft, quantity: e.target.value})} className="h-8 w-20" />
                      ) : row.quantity}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[11px] font-bold ${row.availability === 'متوفر' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        {row.availability}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {editingId === row.id ? (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => onSaveEdit(row.id)} className="text-green-600 p-1 rounded hover:bg-green-50"><Save className="h-4 w-4"/></button>
                          <button onClick={() => setEditingId(null)} className="text-red-600 p-1 rounded hover:bg-red-50"><X className="h-4 w-4"/></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingId(row.id); setEditDraft(row); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-all"><Pencil className="h-4 w-4" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- Pagination Footer (تم تعديل الخيارات هنا) --- */}
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
                <span className="text-slate-500 font-medium">
                  {rangeStart} - {rangeEnd} <span className="mx-1 text-slate-300">|</span> من {filteredData.length}
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white" dir="rtl">
          <DialogHeader className="text-right border-b pb-4">
            <DialogTitle className="text-xl font-bold text-slate-800">إضافة منتج مؤسسة</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-right">
            <div className="grid gap-1">
              <label className="text-sm font-semibold text-slate-700">المؤسسة *</label>
              <select value={institutionId} onChange={(e) => setInstitutionId(e.target.value)} className="h-10 border rounded-lg px-3 bg-slate-50 outline-none">
                <option value="">-- اختر المؤسسة --</option>
                {institutions.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-semibold text-slate-700">المنتج *</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className="h-10 border rounded-lg px-3 bg-slate-50 outline-none">
                <option value="">-- اختر المنتج --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-semibold text-slate-700">الكمية *</label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} className="h-10 bg-slate-50" />
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <Button className="flex-1 bg-blue-600 text-white font-bold h-11 rounded-xl" onClick={onAdd} disabled={submitting || !institutionId || !productId || quantity === ''}>
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ البيانات'}
            </Button>
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setAddOpen(false)}>إلغاء</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}