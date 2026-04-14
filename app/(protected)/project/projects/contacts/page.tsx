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
import { Pencil, Plus, Search, Loader2, Check, X, ChevronRight, ChevronLeft } from 'lucide-react'

const CONTACT_TYPES = ["زيارة منزلية", "مكالمة هاتفية", "مقابلة مكتبية", "رسالة نصية / واتساب", "تواصل ميداني"]
type ContactStatus = 'DONE' | 'NOT_DONE'

type Contact = {
  id: string
  beneficiaryId: string
  institutionId: string
  beneficiary?: { name: string }
  institution?: { name: string }
  type?: string
  date: string
  notes?: string
  status: string 
}

type Option = { id: string; name: string }
const BASE_URL = '/api/project/projects/contacts'

async function requestJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message || 'خطأ في الطلب')
  return data
}

export default function ContactsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Contact[]>([])
  const [options, setOptions] = useState<{ beneficiaries: Option[]; institutions: Option[] }>({ beneficiaries: [], institutions: [] })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  // --- Pagination States ---
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<any>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [newFormData, setNewFormData] = useState({
    beneficiaryId: '',
    institutionId: '',
    type: '',
    date: new Date().toISOString().split('T')[0],
    status: 'NOT_DONE' as ContactStatus
  })

  useEffect(() => { loadInitialData() }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [data, opts] = await Promise.all([
        requestJSON<Contact[]>(BASE_URL),
        requestJSON<any>(`${BASE_URL}?type=options`)
      ])
      setItems(data)
      setOptions(opts)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const startEdit = (item: Contact) => {
    setEditingId(item.id)
    setEditFormData({
      beneficiaryId: item.beneficiaryId,
      institutionId: item.institutionId,
      type: item.type || '',
      date: item.date,
      status: item.status === 'تم' ? 'DONE' : 'NOT_DONE'
    })
  }

  const onSaveUpdate = async (id: string) => {
    setSubmitting(true)
    try {
      const updated = await requestJSON<Contact>(`${BASE_URL}?id=${encodeURIComponent(id)}`, { 
        method: 'PUT', 
        body: JSON.stringify(editFormData) 
      })
      setItems(prev => prev.map(c => c.id === id ? updated : c))
      setEditingId(null)
    } catch (err: any) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  const onSaveCreate = async () => {
    setSubmitting(true)
    try {
      const created = await requestJSON<Contact>(BASE_URL, { 
        method: 'POST', 
        body: JSON.stringify(newFormData) 
      })
      setItems(prev => [created, ...prev])
      setIsAddOpen(false)
      setNewFormData({
        beneficiaryId: '',
        institutionId: '',
        type: '',
        date: new Date().toISOString().split('T')[0],
        status: 'NOT_DONE'
      })
      setCurrentPage(1)
    } catch (err: any) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const matchSearch = !q || c.beneficiary?.name?.toLowerCase().includes(q.toLowerCase())
      const matchStatus = statusFilter === 'all' ? true : c.status === (statusFilter === 'DONE' ? 'تم' : 'لم يتم')
      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

  // --- Pagination Logic ---
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
      <div className="mb-6 text-right">
        <h1 className="text-2xl font-bold text-slate-900">إدارة التواصلات </h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex flex-col lg:flex-row gap-4 justify-between items-center border-b text-right">
            <div className="flex gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="بحث عن مستفيد..." value={q} onChange={(e) => setQ(e.target.value)} className="pr-10 text-right h-10" />
              </div>
              <select className="h-10 border rounded-lg px-2 bg-white text-sm outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">كل الحالات</option>
                <option value="DONE">تم</option>
                <option value="NOT_DONE">لم يتم</option>
              </select>
            </div>
            <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 text-white font-bold h-10">
              <Plus className="ml-2 h-4 w-4" /> إضافة سجل
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50 border-b text-slate-500 text-sm">
                <tr>
                  <th className="p-4 font-bold">المستفيد</th>
                  <th className="p-4 font-bold">المؤسسة</th>
                  <th className="p-4 font-bold">النوع</th>
                  <th className="p-4 font-bold">التاريخ</th>
                  <th className="p-4 font-bold">الحالة</th>
                  <th className="p-4 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {paginatedData.map((c) => (
                  <tr key={c.id} className={editingId === c.id ? 'bg-blue-50/50' : 'hover:bg-slate-50/30 transition-colors'}>
                    <td className="p-4">
                      {editingId === c.id ? (
                        <select className="w-full border rounded p-1.5 text-sm bg-white" value={editFormData.beneficiaryId} onChange={e => setEditFormData({...editFormData, beneficiaryId: e.target.value})}>
                          {options.beneficiaries.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      ) : (c.beneficiary?.name)}
                    </td>
                    <td className="p-4">
                      {editingId === c.id ? (
                        <select className="w-full border rounded p-1.5 text-sm bg-white" value={editFormData.institutionId} onChange={e => setEditFormData({...editFormData, institutionId: e.target.value})}>
                          {options.institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                      ) : (c.institution?.name)}
                    </td>
                    <td className="p-4">
                      {editingId === c.id ? (
                        <select className="w-full border rounded p-1.5 text-sm bg-white" value={editFormData.type} onChange={e => setEditFormData({...editFormData, type: e.target.value})}>
                          {CONTACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ) : (c.type)}
                    </td>
                    <td className="p-4">
                      {editingId === c.id ? (
                        <input type="date" className="w-full border rounded p-1.5 text-sm" value={editFormData.date} onChange={e => setEditFormData({...editFormData, date: e.target.value})} />
                      ) : (c.date)}
                    </td>
                    <td className="p-4">
                      {editingId === c.id ? (
                        <select className="w-full border rounded p-1.5 text-sm bg-white" value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                          <option value="DONE">تم</option>
                          <option value="NOT_DONE">لم يتم</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-2 py-1 rounded text-[11px] font-bold ${c.status === 'تم' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                          {c.status}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {editingId === c.id ? (
                        <div className="flex justify-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => onSaveUpdate(c.id)} disabled={submitting}>
                            {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4 text-green-600" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4 text-red-600" /></Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => startEdit(c)} className="text-blue-500 hover:bg-blue-50"><Pencil className="h-4 w-4" /></Button>
                      )}
                    </td>
                  </tr>
                ))}
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
                <span className="text-slate-500 font-medium">
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

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader className="text-right border-b pb-2">
            <DialogTitle className="font-bold">إضافة سجل تواصل جديد</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-right">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">المستفيد</label>
              <select className="w-full border rounded-lg p-2 bg-white text-sm outline-none" value={newFormData.beneficiaryId} onChange={e => setNewFormData({...newFormData, beneficiaryId: e.target.value})}>
                <option value="">-- اختر مستفيد --</option>
                {options.beneficiaries.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">المؤسسة</label>
              <select className="w-full border rounded-lg p-2 bg-white text-sm outline-none" value={newFormData.institutionId} onChange={e => setNewFormData({...newFormData, institutionId: e.target.value})}>
                <option value="">-- اختر مؤسسة --</option>
                {options.institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">نوع التواصل</label>
              <select className="w-full border rounded-lg p-2 bg-white text-sm outline-none" value={newFormData.type} onChange={e => setNewFormData({...newFormData, type: e.target.value})}>
                <option value="">-- اختر نوع التواصل --</option>
                {CONTACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">التاريخ</label>
              <Input type="date" value={newFormData.date} onChange={e => setNewFormData({...newFormData, date: e.target.value})} className="text-right h-10" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">الحالة</label>
              <select className="w-full border rounded-lg p-2 bg-white text-sm outline-none" value={newFormData.status} onChange={e => setNewFormData({...newFormData, status: e.target.value as ContactStatus})}>
                <option value="NOT_DONE">لم يتم</option>
                <option value="DONE">تم</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4 flex-row-reverse">
            <Button onClick={onSaveCreate} disabled={submitting} className="flex-1 bg-blue-600 text-white font-bold hover:bg-blue-700 h-11 rounded-xl">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ البيانات'}
            </Button>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button> 
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}