'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Pencil, Check, X, Plus } from 'lucide-react'
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
  
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // بيانات النموذج الموحدة
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

  // دالة الحفظ المعدلة
  const onSave = async (id?: string) => {
    // التأكد من وجود البيانات الأساسية
    if (!formData.name || !formData.deptType) {
      toast.error("يرجى اختيار التخصص واسم القسم");
      return;
    }

    setSubmitting(true)
    try {
      const method = id ? 'PUT' : 'POST'
      // في حالة PUT يجب إرسال الـ id داخل الجسم (body)
      const body = id ? { id, ...formData } : formData

      const res = await fetch(BASE_URL, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await res.json();

      if (res.ok) {
        toast.success(id ? "تم التعديل بنجاح" : "تمت الإضافة بنجاح")
        setAddOpen(false)
        setEditingId(null)
        resetForm()
        fetchData()
      } else {
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
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-slate-800">إدارة الأقسام الطبية</h1>
        <Button onClick={() => { resetForm(); setAddOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="ml-2 h-5 w-5" /> إضافة قسم جديد
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 border-b text-slate-500">
              <tr>
                <th className="p-4 font-bold">نوع التخصص</th>
                <th className="p-4 font-bold">اسم القسم</th>
                <th className="p-4 font-bold">الحالة التشغيلية</th>
                <th className="p-4 font-bold">وصف الخدمات</th>
                <th className="p-4 text-center font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
              ) : items.map((item: any) => (
                <tr key={item.id} className={`border-b hover:bg-slate-50/50 ${editingId === item.id ? 'bg-blue-50/50' : ''}`}>
                  {editingId === item.id ? (
                    <>
                      <td className="p-2">
                        <select className="w-full border rounded p-1.5 bg-white" value={formData.deptType} onChange={e => setFormData({...formData, deptType: e.target.value, name: ''})}>
                          {Object.keys(DEPARTMENTS_BY_SPECIALTY).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <select className="w-full border rounded p-1.5 bg-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}>
                          {DEPARTMENTS_BY_SPECIALTY[formData.deptType]?.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <select className="w-full border rounded p-1.5 bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                          <option value="يعمل بكفاءة">يعمل بكفاءة</option>
                          <option value="مزدحم">مزدحم</option>
                          <option value="خارج الخدمة">خارج الخدمة</option>
                        </select>
                      </td>
                      <td className="p-2"><input className="w-full border rounded p-1.5 bg-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></td>
                      <td className="p-2 text-center flex justify-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => onSave(item.id)} disabled={submitting} className="text-green-600">
                          {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Check className="w-5 h-5" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-red-500"><X className="w-5 h-5" /></Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 text-blue-600 font-medium">{item.deptType}</td>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4 font-bold">
                        <span className={`px-3 py-1 rounded-full text-[10px] ${item.status === 'يعمل بكفاءة' ? 'bg-green-100 text-green-700' : item.status === 'مزدحم' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-sm">{item.description || '-'}</td>
                      <td className="p-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingId(item.id);
                          setFormData({ name: item.name, deptType: item.deptType, status: item.status, description: item.description || '' });
                        }}>
                          <Pencil className="w-4 h-4 text-slate-400" />
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="font-arabic max-w-md">
          <DialogHeader><DialogTitle className="text-right font-bold text-slate-800">إضافة قسم جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 text-right">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">نوع التخصص</label>
              <select className="w-full border rounded-lg p-2.5 bg-slate-50 outline-none" value={formData.deptType} onChange={e => setFormData({...formData, deptType: e.target.value, name: ''})}>
                <option value="">اختر التخصص</option>
                {Object.keys(DEPARTMENTS_BY_SPECIALTY).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">اسم القسم</label>
              <select className="w-full border rounded-lg p-2.5 bg-slate-50 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={!formData.deptType}>
                <option value="">اختر القسم</option>
                {formData.deptType && DEPARTMENTS_BY_SPECIALTY[formData.deptType].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">الحالة التشغيلية</label>
              <select className="w-full border rounded-lg p-2.5 bg-slate-50 outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="يعمل بكفاءة">يعمل بكفاءة</option>
                <option value="مزدحم">مزدحم</option>
                <option value="خارج الخدمة">خارج الخدمة</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">ملاحظات</label>
              <textarea className="w-full border rounded-lg p-2.5 bg-slate-50 h-24 text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter className="flex gap-2 pt-4">
            <Button onClick={() => onSave()} disabled={submitting} className="flex-1 bg-blue-600 font-bold h-11 text-white">
              {submitting ? <Loader2 className="animate-spin" /> : 'حفظ البيانات'}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="h-11 flex-1">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}