'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Pencil, Check, X, Plus, ChevronRight, ChevronLeft, Search } from 'lucide-react'
import { toast } from 'sonner'

const DEPARTMENTS_BY_SPECIALTY: Record<string, string[]> = {
  'الاستقبال والطوارئ': ['طوارئ كبار', 'طوارئ أطفال', 'وحدة الحوادث'],
  'الجراحة العامة': ['غرفة العمليات الكبرى', 'جراحة المناظير'],
  'العناية المركزة والتخدير': ['العناية المركزة (ICU)', 'عناية القلب (CCU)'],
  'طب الأطفال': ['قسم الأطفال العام', 'الحضانة'],
  'النسائية والتوليد': ['غرف الولادة', 'العمليات القيصرية'],
}

export default function DepartmentsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [q, setQ] = useState('') 

  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [formData, setFormData] = useState({
    name: '',
    deptType: '',
    status: 'يعمل بكفاءة',
    description: ''
  })

  const BASE_URL = '/api/project/Medical-Services/department'

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error("فشل في تحميل البيانات")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(q.toLowerCase()) || 
      item.deptType.toLowerCase().includes(q.toLowerCase())
    )
  }, [items, q])

  const { currentItems, totalPages } = useMemo(() => {
    const lastIdx = currentPage * itemsPerPage
    const firstIdx = lastIdx - itemsPerPage
    return {
      currentItems: filteredItems.slice(firstIdx, lastIdx),
      totalPages: Math.ceil(filteredItems.length / (itemsPerPage || 10)) || 1
    }
  }, [filteredItems, currentPage, itemsPerPage])

  useEffect(() => { setCurrentPage(1) }, [q])

  const onSave = async (id?: string) => {
    if (!formData.name || !formData.deptType) {
      toast.error("يرجى اختيار التخصص واسم القسم");
      return;
    }

    setSubmitting(true)
    try {
      const method = id ? 'PUT' : 'POST'
      const body = id ? { id, ...formData } : formData

      const res = await fetch(BASE_URL, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        toast.success(id ? "تم التعديل بنجاح" : "تمت الإضافة بنجاح")
        setAddOpen(false)
        setEditingId(null)
        resetForm()
        fetchData()
      } else {
        const result = await res.json();
        toast.error(result.error || "حدث خطأ أثناء الحفظ")
      }
    } catch (error) {
      toast.error("حدث خطأ في الاتصال بالخادم")
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', deptType: '', status: 'يعمل بكفاءة', description: '' })
  }

  return (
    <div className="p-6 font-arabic text-right" dir="rtl">
      {/* العنوان الخارجي */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">إدارة الأقسام الطبية</h1>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          
          {/* --- شريط البحث وزر الإضافة داخل الكارد --- */}
          <div className="p-4 border-b bg-slate-50/50 flex flex-row justify-between items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="بحث سريع عن قسم أو تخصص..." 
                className="pr-9 focus-visible:ring-blue-500 bg-white" 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
              />
            </div>

            <Button 
              onClick={() => { resetForm(); setAddOpen(true); }} 
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0"
            >
              <Plus className="ml-2 h-5 w-5" /> إضافة قسم جديد
            </Button>
          </div>

          {/* --- حاوية الجدول مع سكرول ورأس ثابت --- */}
          <div className="overflow-x-auto overflow-y-auto max-h-[450px] relative">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="p-4 font-bold bg-slate-50">نوع التخصص</th>
                  <th className="p-4 font-bold bg-slate-50">اسم القسم</th>
                  <th className="p-4 font-bold text-center bg-slate-50">الحالة التشغيلية</th>
                  <th className="p-4 font-bold bg-slate-50">وصف الخدمات</th>
                  <th className="p-4 text-center font-bold bg-slate-50">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
                ) : currentItems.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-bold">لا توجد بيانات</td></tr>
                ) : currentItems.map((item: any) => (
                  <tr key={item.id} className={`border-b hover:bg-slate-50/50 transition-colors ${editingId === item.id ? 'bg-blue-50/50' : ''}`}>
                    {editingId === item.id ? (
                      <>
                        <td className="p-2"><select className="w-full border rounded p-1.5 bg-white text-xs" value={formData.deptType} onChange={e => setFormData({...formData, deptType: e.target.value, name: ''})}>{Object.keys(DEPARTMENTS_BY_SPECIALTY).map(s => <option key={s} value={s}>{s}</option>)}</select></td>
                        <td className="p-2"><select className="w-full border rounded p-1.5 bg-white text-xs" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}>{DEPARTMENTS_BY_SPECIALTY[formData.deptType]?.map(d => <option key={d} value={d}>{d}</option>)}</select></td>
                        <td className="p-2"><select className="w-full border rounded p-1.5 bg-white text-center text-xs" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="يعمل بكفاءة">يعمل بكفاءة</option><option value="مزدحم">مزدحم</option><option value="خارج الخدمة">خارج الخدمة</option></select></td>
                        <td className="p-2"><input className="w-full border rounded p-1.5 bg-white text-xs" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></td>
                        <td className="p-2 text-center flex justify-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => onSave(item.id)} disabled={submitting} className="text-green-600"><Check className="w-5 h-5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-red-500"><X className="w-5 h-5" /></Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 text-blue-600 font-medium">{item.deptType}</td>
                        <td className="p-4 font-bold">{item.name}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${item.status === 'يعمل بكفاءة' ? 'bg-green-100 text-green-700' : item.status === 'مزدحم' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 text-xs">{item.description || '-'}</td>
                        <td className="p-4 text-center">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingId(item.id); setFormData({ name: item.name, deptType: item.deptType, status: item.status, description: item.description || '' }); }}><Pencil className="w-4 h-4 text-slate-400" /></Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- وحدة التحكم بالترقيم (Pagination) --- */}
          {!loading && filteredItems.length > 0 && (
            <div className="p-4 border-t flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">عرض:</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="border rounded px-2 py-1 text-xs bg-white outline-none focus:ring-1 focus:ring-blue-500 font-bold shadow-sm"
                >
                  {[5, 10, 15, 20].map(val => (<option key={val} value={val}>{val}</option>))}
                </select>
                <span className="text-[11px] text-slate-400 mr-2 font-medium">إجمالي {filteredItems.length} عنصر</span>
              </div>

              <div className="flex items-center gap-2" dir="ltr">
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-bold gap-1 shadow-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" /> السابق
                </Button>
                <div className="text-xs font-bold px-3 py-1.5 bg-white border rounded-md shadow-sm">{currentPage} / {totalPages}</div>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-bold gap-1 shadow-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  التالي <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog إضافة قسم جديد */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="font-arabic max-w-md">
          <DialogHeader><DialogTitle className="text-right font-bold text-slate-800 border-b pb-2">إضافة قسم جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 text-right">
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">نوع التخصص</label><select className="w-full border rounded-lg p-2.5 bg-slate-50 outline-none text-sm" value={formData.deptType} onChange={e => setFormData({...formData, deptType: e.target.value, name: ''})}><option value="">اختر التخصص</option>{Object.keys(DEPARTMENTS_BY_SPECIALTY).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">اسم القسم</label><select className="w-full border rounded-lg p-2.5 bg-slate-50 outline-none text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={!formData.deptType}><option value="">اختر القسم</option>{formData.deptType && DEPARTMENTS_BY_SPECIALTY[formData.deptType].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">الحالة التشغيلية</label><select className="w-full border rounded-lg p-2.5 bg-slate-50 outline-none text-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="يعمل بكفاءة">يعمل بكفاءة</option><option value="مزدحم">مزدحم</option><option value="خارج الخدمة">خارج الخدمة</option></select></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-500">ملاحظات وصفية</label><textarea placeholder="وصف الخدمات..." className="w-full border rounded-lg p-2.5 bg-slate-50 h-24 text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
          </div>
          <DialogFooter className="flex gap-2 pt-4 border-t">
            <Button onClick={() => onSave()} disabled={submitting} className="flex-1 bg-blue-600 font-bold h-11 text-white">{submitting ? <Loader2 className="animate-spin" /> : 'حفظ البيانات'}</Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="h-11 flex-1">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}