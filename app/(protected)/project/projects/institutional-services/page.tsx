'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { 
  Plus, Search, Pencil, Save, X, Building2, 
  Loader2, ChevronRight, ChevronLeft, ChevronDown
} from 'lucide-react'

const BASE_URL = '/api/project/projects/institutional-services'

export default function InstitutionServicesPage() {
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('الكل')
  const [items, setItems] = useState<any[]>([])
  const [institutions, setInstitutions] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [selectedInst, setSelectedInst] = useState('')
  const [selectedServ, setSelectedServ] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('نشط')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<any>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resItems, resInst, resServ] = await Promise.all([
        fetch(BASE_URL),
        fetch('/api/project/projects/institutions'),
        fetch('/api/project/projects/service')
      ])
      const dataItems = await resItems.json()
      const dataInst = await resInst.json()
      const dataServ = await resServ.json()

      setItems(Array.isArray(dataItems) ? dataItems : [])
      setInstitutions(Array.isArray(dataInst) ? dataInst : [])
      setServices(Array.isArray(dataServ) ? dataServ : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = useMemo(() => {
    return items.filter(x => {
      const matchesSearch = x.institution?.name?.toLowerCase().includes(q.toLowerCase()) || 
                           x.service?.serviceType?.toLowerCase().includes(q.toLowerCase());
      const matchesStatus = statusFilter === 'الكل' || x.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  }, [items, q, statusFilter])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const onAdd = async () => {
    if (!selectedInst || !selectedServ) return alert("يرجى اختيار المؤسسة والخدمة")
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institutionId: selectedInst, serviceId: selectedServ, status: selectedStatus })
      })
      if (res.ok) { await fetchData(); setAddOpen(false); setSelectedInst(''); setSelectedServ(''); }
    } catch (err) { alert("خطأ في الحفظ") }
  }

  const onSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft)
      })
      if (res.ok) { await fetchData(); setEditingId(null); }
    } catch (err) { alert("خطأ في التعديل") }
  }

  return (
    <div className="w-full min-h-screen px-6 py-8 bg-slate-50 text-right" dir="rtl">
      <div className="mb-6"><h1 className="text-2xl font-bold text-slate-800">إدارة خدمات المؤسسات</h1></div>

      <Card className="shadow-sm border-none bg-white">
        <CardContent className="p-0">
          <div className="p-4 flex flex-wrap gap-4 items-center justify-between border-b">
            {/* القسم الأيمن: البحث ثم الفلترة */}
            <div className="flex items-center gap-3 flex-1 max-w-2xl">
              {/* 1. زر البحث */}
              <div className="relative w-full max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input value={q} onChange={e => { setQ(e.target.value); setCurrentPage(1); }} placeholder="بحث عن خدمة..." className="pr-10 bg-slate-50 border-none h-10 font-sans" />
              </div>

              {/* 2. زر الفلترة (Droplist) */}
              <div className="relative min-w-[150px]">
                <select 
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full h-10 pr-3 pl-10 bg-slate-50 border border-slate-100 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none font-sans"
                >
                  <option value="الكل">كل الحالات</option>
                  <option value="نشط">نشط</option>
                  <option value="مغلق">مغلق</option>
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <Button onClick={() => setAddOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 font-sans shadow-sm">
              <Plus className="ml-2 h-4 w-4" /> إضافة ربط جديد
            </Button>
          </div>

          <table className="w-full">
            <thead className="bg-slate-50/50 border-b text-slate-500 font-bold font-sans">
              <tr>
                <th className="p-4 text-sm text-right">المؤسسة</th>
                <th className="p-4 text-sm text-right">نوع الخدمة</th>
                <th className="p-4 text-sm text-center">الحالة</th>
                <th className="p-4 text-sm text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
              ) : paginatedItems.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 text-sm font-sans">
                    {editingId === row.id ? (
                      <select className="w-full border rounded-md p-2 bg-white" value={editDraft.institutionId} onChange={e => setEditDraft({...editDraft, institutionId: e.target.value})}>
                        {institutions.map(i => <option key={i.id} value={i.id}>{i.name || i.nameAr}</option>)}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{row.institution?.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm font-sans">
                    {editingId === row.id ? (
                      <select className="w-full border rounded-md p-2 bg-white" value={editDraft.serviceId} onChange={e => setEditDraft({...editDraft, serviceId: e.target.value})}>
                        {services.map(s => <option key={s.id} value={s.id}>{s.serviceType}</option>)}
                      </select>
                    ) : row.service?.serviceType}
                  </td>
                  <td className="p-4 text-center">
                    {editingId === row.id ? (
                      <select className="border rounded-md p-2 bg-white text-xs font-sans" value={editDraft.status} onChange={e => setEditDraft({...editDraft, status: e.target.value})}>
                        <option value="نشط">نشط</option>
                        <option value="مغلق">مغلق</option>
                      </select>
                    ) : (
                      <span className={`px-4 py-1 rounded-full text-[10px] font-bold font-sans ${row.status === 'نشط' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {row.status}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {editingId === row.id ? (
                      <div className="flex justify-center gap-1">
                        <Button size="sm" variant="ghost" className="text-green-600" onClick={() => onSaveEdit(row.id)}><Save className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-slate-400" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-blue-500" onClick={() => {
                        setEditingId(row.id);
                        setEditDraft({ institutionId: row.institutionId, serviceId: row.serviceId, status: row.status });
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination المطور */}
          <div className="p-4 border-t flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-sans">عرض:</span>
              <select 
                className="bg-white border rounded p-1 text-xs outline-none cursor-pointer"
                value={itemsPerPage}
                onChange={e => {setItemsPerPage(Number(e.target.value)); setCurrentPage(1);}}
              >
                {[5, 10, 15, 20].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <span className="text-xs text-slate-500 font-sans">صفوف من أصل {filtered.length}</span>
            </div>

            <div className="flex items-center gap-4">
               <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p-1, 1))} disabled={currentPage === 1} className="h-8 font-sans">
                السابق <ChevronRight className="h-4 w-4 mr-1" />
              </Button>
              
              <div className="text-xs font-bold text-slate-600 font-sans">
                {currentPage} - {totalPages || 1}
              </div>

              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="h-8 font-sans">
                <ChevronLeft className="h-4 w-4 ml-1" /> التالي
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pop-up الإضافة */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-right font-sans">إضافة ربط جديد</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 text-right font-sans">
            <div>
              <label className="text-xs font-bold block mb-1">المؤسسة</label>
              <select className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm outline-none" value={selectedInst} onChange={e => setSelectedInst(e.target.value)}>
                <option value="">-- اختر من القائمة --</option>
                {institutions.map(i => <option key={i.id} value={i.id}>{i.name || i.nameAr}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">نوع الخدمة</label>
              <select className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm outline-none" value={selectedServ} onChange={e => setSelectedServ(e.target.value)}>
                <option value="">-- اختر الخدمة --</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.serviceType}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">الحالة</label>
              <select className="w-full p-2.5 border rounded-lg bg-slate-50 text-sm outline-none font-sans" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                <option value="نشط">نشط</option>
                <option value="مغلق">مغلق</option>
              </select>
            </div>
          </div>
          <DialogFooter className="flex flex-row-reverse items-center justify-between w-full gap-2 mt-4 font-sans">
            <Button onClick={onAdd} className="bg-blue-600 text-white flex-1 h-11">حفظ البيانات</Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 border-slate-200 text-slate-600">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}