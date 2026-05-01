'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Pencil, Plus, Search, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

const REGIONS_DATA: Record<string, string[]> = {
  'شمال': ['جباليا', 'بيت لاهيا', 'بيت حانون'],
  'جنوب': ['رفح', 'خانيونس', 'القرارة'],
  'وسط': ['دير البلح', 'النصيرات', 'البريج'],
  'شرق': ['الشجاعية', 'الزيتون', 'التفاح'],
  'غرب': ['الشيخ رضوان', 'النصر', 'الرمال']
};

const BASE_URL = '/api/project/Medical-Services/Address';

export default function AddressPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const isAddValid = title !== '' && description !== '';
  const isEditValid = editTitle !== '' && editDescription !== '';

  const resetForm = () => {
    setTitle('');
    setDescription('');
  };

  const openAddDialog = () => {
    resetForm();
    setAddOpen(true);
  };

  const startInlineEdit = (item: any) => {
    setEditingId(item.id);
    setEditTitle(item.title || '');
    setEditDescription(item.description || '');
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const onAdd = async () => {
    if (!isAddValid) return;
    setSubmitting(true);
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });

      if (res.ok) {
        await fetchItems();
        setAddOpen(false);
        resetForm();
        toast.success('تم إضافة الموقع بنجاح');
      } else {
        const data = await res.json();
        toast.error(data.error || 'فشل في إضافة الموقع');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الإضافة');
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = async () => {
    if (!editingId || !isEditValid) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}?id=${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, description: editDescription })
      });

      if (res.ok) {
        await fetchItems();
        cancelInlineEdit();
        toast.success('تم تحديث الموقع بنجاح');
      } else {
        const data = await res.json();
        toast.error(data.error || 'فشل في تحديث الموقع');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء التحديث');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    return items.filter(item =>
      !q || item.title?.includes(q) || item.description?.includes(q)
    );
  }, [q, items]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [q, itemsPerPage]);

  return (
    <div className="w-full px-4 py-6 overflow-y-auto" dir="rtl">
      <div className="mb-6 text-right">
        <h1 className="text-2xl font-bold text-slate-900">إدارة المواقع</h1>
        <p className="text-sm text-slate-500 mt-1 font-normal">الرئيسية &gt; العناوين والمواقع</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white flex flex-col">
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b bg-white z-20">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث..."
                className="w-full pr-10 bg-slate-50 border-none h-10 rounded-lg text-sm"
              />
            </div>
            <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700 mr-auto h-10 px-4 rounded-lg">
              <Plus className="h-4 w-4 ml-2" /> إضافة موقع
            </Button>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[365px] flex-1">
            <table className="w-full text-right text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 text-slate-500 font-bold bg-slate-50">الموقع العام</th>
                  <th className="p-4 text-slate-500 font-bold bg-slate-50">المنطقة</th>
                  <th className="p-4 text-center text-slate-500 font-bold bg-slate-50">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={3} className="p-20 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2" />جاري التحميل...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={3} className="p-20 text-center text-slate-400">لا توجد بيانات حالياً.</td></tr>
                ) : paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-700">
                      {editingId === item.id ? (
                        <select
                          className="w-full border border-slate-200 rounded-lg h-10 px-3 bg-white outline-none focus:ring-2 focus:ring-blue-100"
                          value={editTitle}
                          onChange={e => { setEditTitle(e.target.value); setEditDescription('') }}
                        >
                          <option value="">اختر المنطقة الكبرى..</option>
                          {Object.keys(REGIONS_DATA).map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      ) : (
                        item.title
                      )}
                    </td>
                    <td className="p-4 text-slate-600">
                      {editingId === item.id ? (
                        <select
                          className="w-full border border-slate-200 rounded-lg h-10 px-3 bg-white outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          disabled={!editTitle}
                        >
                          <option value="">اختر الموقع التفصيلي..</option>
                          {editTitle && REGIONS_DATA[editTitle]?.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        item.description
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {editingId === item.id ? (
                          <>
                            <Button onClick={onEdit} disabled={submitting || !isEditValid} size="sm" className="bg-blue-600">حفظ</Button>
                            <Button onClick={cancelInlineEdit} variant="outline" size="sm">إلغاء</Button>
                          </>
                        ) : (
                          <button onClick={() => startInlineEdit(item)} className="p-2 border border-slate-100 rounded-md hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- Pagination Footer Reorganized --- */}
          {!loading && filtered.length > 0 && (
            <div className="p-4 border-t flex items-center justify-between bg-slate-50/30">
              {/* Right Side: Rows per page selection */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">عرض:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="h-8 border border-slate-200 rounded-md bg-white text-xs px-2 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {[5, 10, 15, 20].map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
                <span className="text-xs text-slate-500 font-bold">عناصر</span>
              </div>

              {/* Left Side: Prev/Next controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-600 ml-2">
                  صفحة {currentPage} من {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-right text-lg font-bold">إضافة موقع جديد</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-4 text-right">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">الموقع العام</label>
              <select
                className="w-full border border-slate-200 rounded-lg h-11 px-3 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100"
                value={title}
                onChange={e => { setTitle(e.target.value); setDescription('') }}
              >
                <option value="">اختر المنطقة الكبرى..</option>
                {Object.keys(REGIONS_DATA).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">المنطقة التفصيلية</label>
              <select
                className="w-full border border-slate-200 rounded-lg h-11 px-3 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={!title}
              >
                <option value="">اختر الموقع التفصيلي..</option>
                {title && REGIONS_DATA[title]?.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-3">
            <Button onClick={onAdd} disabled={submitting || !isAddValid} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-xl font-bold">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null} حفظ الموقع
            </Button>
            <Button variant="outline" onClick={() => { setAddOpen(false); resetForm() }} className="flex-1 h-11 rounded-xl border-slate-200 font-bold text-slate-500 hover:text-slate-700">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}