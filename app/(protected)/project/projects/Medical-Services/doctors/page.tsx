'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Search, Loader2, Pencil, Check, X, ChevronRight, ChevronLeft } from 'lucide-react'

const API_URL = '/api/project/Medical-Services/doctors'

export default function DoctorsPage() {
  const [items, setItems] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)

  const initialForm = { name: '', phone: '', specialty: '', workSchedule: '', description: '', hospitalId: '', departmentId: '' }
  const [addForm, setAddForm] = useState(initialForm)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [docRes, hospRes, deptRes] = await Promise.all([
        fetch(API_URL), fetch(`${API_URL}?type=hospitals`), fetch(`${API_URL}?type=departments`)
      ])
      const docsData = await docRes.json()
      setItems(docsData.doctors || [])
      setHospitals(await hospRes.json() || [])
      setDepartments(await deptRes.json() || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = useMemo(() => {
    return items.filter(i => i.name?.toLowerCase().includes(q.toLowerCase()))
  }, [items, q])

  const { currentItems, totalPages } = useMemo(() => {
    const lastIdx = currentPage * itemsPerPage
    const firstIdx = lastIdx - itemsPerPage
    return {
      currentItems: filtered.slice(firstIdx, lastIdx),
      totalPages: Math.ceil(filtered.length / (itemsPerPage || 10)) || 1
    }
  }, [filtered, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [q])

  const validate = (form) => {
    if (!form.name || !form.phone || !form.hospitalId || !form.departmentId || !form.workSchedule) {
      alert("يرجى ملء جميع الحقول المطلوبة")
      return false
    }
    const phoneRegex = /^(056|059)\d{7}$/
    if (!phoneRegex.test(form.phone)) {
      alert("رقم الهاتف يجب أن يبدأ بـ 056 أو 059 ويتبعه 7 أرقام")
      return false
    }
    return true
  }

  const onAdd = async () => {
    if (!validate(addForm)) return
    setSubmitting(true)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      })
      if (res.ok) {
        await fetchData(); setAddOpen(false); setAddForm(initialForm)
      }
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const onSaveEdit = async () => {
    if (!validate(editForm)) return
    setSubmitting(true)
    try {
      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, id: editingId })
      })
      if (res.ok) {
        await fetchData(); setEditingId(null); setEditForm(null)
      }
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditForm({ ...item, description: item.description || '' })
  }

  return (
    <div className="p-8 font-sans text-right" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">إدارة سجل الأطباء</h1>
      </div>

      <Card className="rounded-2xl border-slate-200 overflow-hidden bg-white shadow-sm">
        <CardContent className="p-0">
          
          {/* شريط الأدوات: البحث وزر الإضافة متقابلين */}
          <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="بحث سريع عن طبيب..." 
                className="pr-10 h-11 rounded-xl focus-visible:ring-blue-500 bg-white" 
                value={q} 
                onChange={e => setQ(e.target.value)} 
              />
            </div>
            
            <Button onClick={() => setAddOpen(true)} className="bg-blue-600 rounded-xl px-6 h-11 text-white hover:bg-blue-700 shadow-md transition-all whitespace-nowrap">
              <Plus className="ml-2 h-5 w-5" /> إضافة طبيب جديد
            </Button>
          </div>

          {/* الجدول مع سكرول عمودي (ارتفاع محدد لـ 5 صفوف تقريباً) */}
          <div className="overflow-x-auto overflow-y-auto max-h-[400px] relative">
            <table className="w-full text-right text-sm border-collapse">
              <thead className="bg-slate-50 border-b text-slate-600 font-bold sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="p-4 bg-slate-50">اسم الطبيب</th>
                  <th className="p-4 bg-slate-50">المستشفى</th>
                  <th className="p-4 bg-slate-50">التخصص</th>
                  <th className="p-4 bg-slate-50">رقم التواصل</th>
                  <th className="p-4 bg-slate-50">جدول العمل</th>
                  <th className="p-4 text-center bg-slate-50">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {loading ? (
                  <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-bold">لا توجد بيانات متاحة</td></tr>
                ) : currentItems.map(item => (
                  <tr key={item.id} className={`transition-colors ${editingId === item.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                    {editingId === item.id ? (
                      <>
                        <td className="p-2"><Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="h-9 text-xs" /></td>
                        <td className="p-2">
                          <select className="w-full border rounded-md h-9 text-xs bg-white outline-none" value={editForm.hospitalId} onChange={e => setEditForm({...editForm, hospitalId: e.target.value})}>
                            {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select className="w-full border rounded-md h-9 text-xs bg-white outline-none" value={editForm.departmentId} onChange={e => {
                            const d = departments.find(dep => dep.id === e.target.value);
                            setEditForm({...editForm, departmentId: e.target.value, specialty: d?.name || ''})
                          }}>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </td>
                        <td className="p-2"><Input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="h-9 font-mono text-xs" dir="ltr" /></td>
                        <td className="p-2">
                          <select className="w-full border rounded-md h-9 text-xs bg-white outline-none" value={editForm.workSchedule} onChange={e => setEditForm({...editForm, workSchedule: e.target.value})}>
                            <option value="السبت، الاثنين، الأربعاء">السبت، الاثنين، الأربعاء</option>
                            <option value="الأحد، الثلاثاء، الخميس">الأحد، الثلاثاء، الخميس</option>
                          </select>
                        </td>
                        <td className="p-2 text-center flex justify-center gap-1">
                          <Button onClick={onSaveEdit} className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-sm"><Check className="h-4 w-4" /></Button>
                          <Button onClick={() => setEditingId(null)} className="h-8 w-8 p-0 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full"><X className="h-4 w-4" /></Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-bold text-slate-800">{item.name}</td>
                        <td className="p-4 text-slate-600">{item.hospital?.name}</td>
                        <td className="p-4"><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold">{item.specialty}</span></td>
                        <td className="p-4 font-mono text-slate-700">{item.phone}</td>
                        <td className="p-4 text-xs text-slate-500">{item.workSchedule}</td>
                        <td className="p-4 text-center">
                          <Button variant="ghost" onClick={() => startEdit(item)} className="text-blue-600 hover:bg-blue-100 h-9 w-9 p-0 rounded-full"><Pencil className="h-4 w-4" /></Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- الترقيم الصفحي (Pagination) --- */}
          {!loading && filtered.length > 0 && (
            <div className="p-4 border-t flex items-center justify-between bg-slate-50/50 flex-row-reverse relative z-30">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">عدد الأسطر:</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="border rounded px-2 py-1 text-xs bg-white outline-none focus:ring-1 focus:ring-blue-500 font-bold shadow-sm cursor-pointer"
                >
                  {[5, 10, 15, 20].map(val => (<option key={val} value={val}>{val}</option>))}
                </select>
                <span className="text-[11px] text-slate-400 mr-2 font-medium">عرض {currentItems.length} من {filtered.length}</span>
              </div>

              <div className="flex items-center gap-2" dir="ltr">
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-bold gap-1 shadow-sm bg-white" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" /> السابق
                </Button>
                <div className="text-xs font-bold px-3 py-1.5 bg-white border rounded-md shadow-sm">{currentPage} / {totalPages}</div>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-bold gap-1 shadow-sm bg-white" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  التالي <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* مودال الإضافة */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="text-right sm:max-w-[450px] rounded-2xl font-sans p-6" dir="rtl">
          <DialogHeader><DialogTitle className="text-right font-bold text-xl border-b pb-3 text-slate-800">إضافة طبيب جديد</DialogTitle></DialogHeader>
          
          <div className="flex flex-col gap-5 py-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 mr-1">اسم الطبيب الرباعي</label>
              <Input placeholder="مثال: د. محمد أحمد العامودي" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="h-11 rounded-lg border-slate-200" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 mr-1">المستشفى التابع له</label>
              <select className="w-full border border-slate-200 rounded-lg p-2.5 h-11 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={addForm.hospitalId} onChange={e => setAddForm({...addForm, hospitalId: e.target.value})}>
                <option value="">اختر المستشفى</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 mr-1">القسم الطبي</label>
              <select className="w-full border border-slate-200 rounded-lg p-2.5 h-11 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={addForm.departmentId} onChange={e => {
                const d = departments.find(dep => dep.id === e.target.value);
                setAddForm({...addForm, departmentId: e.target.value, specialty: d?.name || ''})
              }}>
                <option value="">اختر التخصص</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 mr-1">رقم هاتف التواصل</label>
              <Input placeholder="059XXXXXXX" value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} dir="ltr" className="h-11 rounded-lg border-slate-200" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 mr-1">أيام الدوام الرسمي</label>
              <select className="w-full border border-slate-200 rounded-lg p-2.5 h-11 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all" value={addForm.workSchedule} onChange={e => setAddForm({...addForm, workSchedule: e.target.value})}>
                <option value="">حدد أيام المداومة</option>
                <option value="السبت، الاثنين، الأربعاء">السبت، الاثنين، الأربعاء</option>
                <option value="الأحد، الثلاثاء، الخميس">الأحد، الثلاثاء، الخميس</option>
              </select>
            </div>
          </div>

          <DialogFooter className="flex gap-2 border-t pt-5 mt-2">
            <Button onClick={onAdd} disabled={submitting} className="flex-[2] bg-blue-600 h-11 font-bold text-white hover:bg-blue-700 transition-colors shadow-lg">
              {submitting ? <Loader2 className="animate-spin" /> : 'اعتماد وحفظ البيانات'}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 font-bold border-slate-200 text-slate-600">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}