'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Search, Loader2, Pencil, Check, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

const HOSPITAL_TYPES = ['حكومي', 'وكالة', 'خاص'];

const MASTER_DATA: Record<string, string[]> = {
  حكومي: ['مجمع الشفاء الطبي', 'مستشفى النصر', 'مستشفى الإندونيسي', 'مجمع ناصر الطبي', 'مستشفى شهداء الأقصى', 'مستشفى كمال عدوان', 'مستشفى غزة الأوروبي'],
  وكالة: ['مركز الرمال الصحي', 'مركز جباليا الصحي', 'مركز النصيرات الصحي', 'مركز خان يونس الصحي', 'مركز السويدي الصحي', 'مركز البريج الصحي'],
  خاص: ['مستشفى القدس', 'مستشفى أصدقاء المريض', 'مستشفى العودة', 'مستشفى دار السلام', 'مستشفى الهلال الإماراتي', 'مستشفى الخدمة العامة'],
};

const BASE_URL = '/api/project/Medical-Services/hospitals';

export default function HospitalsPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  
  // تعديل: تخزين اسم الحقل الذي يحتوي على الخطأ
  const [errors, setErrors] = useState<{add?: string, editField?: string}>({});

  const [hospitalType, setHospitalType] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [phone, setPhone] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL);
      const data = await res.json();
      setItems(data.hospitals || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const validatePhone = (num: string) => /^(056|059)\d{7}$/.test(num);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const searchLower = q.toLowerCase();
    return items.filter(i => 
      Object.values(i).some(v => String(v).toLowerCase().includes(searchLower))
    );
  }, [items, q]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const onAdd = async () => {
    setErrors({});
    if (!hospitalType || !hospitalName || !phone) {
      setErrors({ add: 'يرجى إكمال جميع الحقول' });
      return;
    }
    if (!validatePhone(phone)) {
      setErrors({ add: 'الرقم يجب أن يبدأ بـ 056 أو 059 ويتكون من 10 أرقام' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalType, hospitalName, phone, region: 'عام' })
      });
      if (res.ok) {
        setAddOpen(false);
        fetchItems();
        setPhone(''); setHospitalType(''); setHospitalName('');
        toast.success('تمت الإضافة بنجاح');
      }
    } finally { setSubmitting(false); }
  };

  const onSaveEdit = async () => {
    setErrors({});
    
    // فحص دقيق للحقول وتحديد الحقل المخطئ لتلوينه بالأحمر
    if (!editForm.hospitalType) {
        setErrors({ editField: 'hospitalType' });
        toast.error('يرجى اختيار نوع المنشأة');
        return;
    }
    if (!editForm.hospitalName) {
        setErrors({ editField: 'hospitalName' });
        toast.error('يرجى اختيار اسم المنشأة');
        return;
    }
    if (!editForm.phone) {
        setErrors({ editField: 'phone' });
        toast.error('يرجى إدخال رقم التواصل');
        return;
    }
    if (!validatePhone(editForm.phone)) {
        setErrors({ editField: 'phone' });
        toast.error('صيغة رقم التواصل غير صحيحة');
        return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(BASE_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setEditingId(null);
        fetchItems();
        toast.success('تم التحديث بنجاح');
      }
    } finally { setSubmitting(false); }
  };

  return (
    <div className="w-full px-4 py-6 bg-white" dir="rtl">
      <h1 className="text-2xl font-bold text-slate-700 mb-6"> النقاط الطبية </h1>

      <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <CardContent className="p-0 flex flex-col">
          <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center gap-4">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="بحث..." className="pr-9 border-slate-200 bg-white" value={q} onChange={e => {setQ(e.target.value); setCurrentPage(1);}} />
            </div>
            <Button onClick={() => {setErrors({}); setAddOpen(true);}} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="ml-2 h-4 w-4" /> إضافة منشأة طبية 
            </Button>
          </div>
          
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-right border-collapse min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 border-b sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-xs font-bold uppercase w-[20%]">النوع</th>
                  <th className="p-4 text-xs font-bold uppercase w-[40%]">الاسم</th>
                  <th className="p-4 text-xs font-bold uppercase w-[25%]">رقم التواصل</th>
                  <th className="p-4 text-xs font-bold uppercase w-[15%] text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                {loading ? (
                  <tr><td colSpan={4} className="p-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto h-6 w-6" /></td></tr>
                ) : paginatedItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {editingId === item.id ? (
                      <>
                        <td className="p-2">
                            <select 
                                value={editForm.hospitalType} 
                                onChange={e => {setEditForm({...editForm, hospitalType: e.target.value, hospitalName: ''}); setErrors({});}} 
                                className={`w-full border rounded p-1.5 text-sm outline-none ${errors.editField === 'hospitalType' ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}
                            >
                              {HOSPITAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </td>
                        <td className="p-2">
                            <select 
                                value={editForm.hospitalName} 
                                onChange={e => {setEditForm({...editForm, hospitalName: e.target.value}); setErrors({});}} 
                                className={`w-full border rounded p-1.5 text-sm outline-none ${errors.editField === 'hospitalName' ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}
                            >
                                <option value="">اختر الاسم..</option>
                                {(MASTER_DATA[editForm.hospitalType] || []).map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </td>
                        <td className="p-2">
                            <Input 
                                className={`h-9 font-mono text-sm ${errors.editField === 'phone' ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'}`} 
                                value={editForm.phone} 
                                onChange={e => {setEditForm({...editForm, phone: e.target.value}); setErrors({});}} 
                                maxLength={10} 
                            />
                        </td>
                        <td className="p-2 text-center flex justify-center gap-2">
                          <Button size="sm" onClick={onSaveEdit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 h-8 w-8 p-0">
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-white" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {setEditingId(null); setErrors({});}} className="h-8 w-8 p-0 text-slate-400">
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 text-sm">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${item.hospitalType === 'حكومي' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                              {item.hospitalType}
                            </span>
                        </td>
                        <td className="p-4 text-sm font-medium">{item.hospitalName}</td>
                        <td className="p-4 text-sm font-mono">{item.phone}</td>
                        <td className="p-4 text-center">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingId(item.id); setEditForm({...item}); setErrors({}); }} className="text-slate-400 hover:text-blue-600 p-2">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t bg-slate-50/50 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>عرض</span>
              <select value={pageSize} onChange={(e) => {setPageSize(Number(e.target.value)); setCurrentPage(1);}} className="border rounded px-1 py-1 outline-none">
                {[5, 10, 15, 20].map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="h-8 px-2"><ChevronRight className="h-4 w-4" /></Button>
              <span className="text-xs font-medium text-slate-600">{currentPage} / {totalPages || 1}</span>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="h-8 px-2"><ChevronLeft className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle className="text-blue-700 text-center text-xl font-bold">إضافة منشأة طبية</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 mr-1">نوع المنشأة</label>
                <select value={hospitalType} onChange={e => {setHospitalType(e.target.value); setHospitalName(''); setErrors({});}} className="w-full border border-slate-200 rounded-md p-2 text-sm outline-none">
                  <option value="">اختر النوع..</option>
                  {HOSPITAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 mr-1">الاسم</label>
                <select value={hospitalName} onChange={e => {setHospitalName(e.target.value); setErrors({});}} disabled={!hospitalType} className="w-full border border-slate-200 rounded-md p-2 text-sm outline-none disabled:bg-slate-50">
                  <option value="">اختر الاسم..</option>
                  {(MASTER_DATA[hospitalType] || []).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 mr-1">رقم التواصل</label>
                <Input placeholder="05xxxxxxxx" value={phone} onChange={e => {setPhone(e.target.value); setErrors({});}} maxLength={10} className={`border-slate-200 ${errors.add ? 'border-red-400 focus:ring-red-50' : ''}`} />
                {errors.add && <p className="text-[11px] text-red-500 font-bold mt-1 px-1">{errors.add}</p>}
            </div>
          </div>
          
          <DialogFooter className="flex flex-row gap-3 sm:justify-start">
            <Button onClick={onAdd} disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 transition-all">
              {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'حفظ'}
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 border-slate-200 text-slate-600 font-bold h-11 hover:bg-slate-50 transition-all">
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}