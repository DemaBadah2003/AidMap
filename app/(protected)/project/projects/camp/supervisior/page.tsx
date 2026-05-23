'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { requireAdmin } from '@/app/(protected)/project/helpers/route-guards'
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
import { Pencil, Save, X, Plus, Loader2 } from 'lucide-react'

// --- وظائف التحقق المساعدة ---
const normalizePhone = (value: string) => value.replace(/[^\d]/g, '').slice(0, 10)

const isValidPalestinePhone = (phone: string) => {
  const regex = /^(056|059)\d{7}$/
  return regex.test(phone)
}

const API_URL = '/api/project/camp/supervisior'

export default function SupervisorsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // حالات الإضافة والتعديل
  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [phone, setPhone] = useState('')
  const [area, setArea] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false) 
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState({ nameAr: '', phone: '', status: 'active' })

  // رسائل التنبيه
  const phoneErrorMessage = "يجب أن يبدأ رقم الهاتف بـ 056 أو 059 ويتكون من 10 أرقام"
  const duplicateErrorMessage = "عفواً! هذا الرقم موجود مسبقاً في النظام"

  // حماية الصفحة والتأكد من صلاحية الأدمن
  useEffect(() => {
    const checkAccess = async () => {
      await requireAdmin(router)
      setIsAuthorized(true)
    }
    checkAccess()
  }, [router])

  // --- دالة فحص التكرار ---
  const checkDuplicate = (phoneToTest: string, currentId: string | null) => {
    const cleanPhone = phoneToTest.trim();
    if (!cleanPhone) return false;
    return items.some(item => 
      String(item.phone).trim() === cleanPhone && String(item.id) !== String(currentId)
    );
  }

  const fetchSupervisors = async () => {
    setLoading(true)
    try {
      const res = await fetch(API_URL)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { 
    if (isAuthorized) fetchSupervisors() 
  }, [isAuthorized])

  // منطق التحقق للإضافة
  const isAddDuplicate = checkDuplicate(phone, null);
  const canSaveAdd = nameAr.trim() !== '' && area !== '' && isValidPalestinePhone(phone) && !isAddDuplicate;

  const onAdd = async () => {
    if (!canSaveAdd) return;
    setSubmitting(true)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameAr: nameAr.trim(), phone: phone.trim(), status: 'active' }),
      })
      if (res.ok) {
        await fetchSupervisors()
        setAddOpen(false); setNameAr(''); setPhone(''); setPhoneTouched(false);
      }
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const onSaveEdit = async (id: string) => {
    const isDuplicate = checkDuplicate(editDraft.phone, id);
    const isInvalid = !isValidPalestinePhone(editDraft.phone);

    if (isDuplicate || isInvalid || submitting) {
      alert(isDuplicate ? duplicateErrorMessage : "بيانات غير صالحة");
      return;
    }
    
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nameAr: editDraft.nameAr.trim(),
            phone: editDraft.phone.trim(),
            status: editDraft.status
        }),
      })
      if (res.ok) {
        setEditingId(null);
        await fetchSupervisors();
      }
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  // شاشة تحميل في حال عدم اكتمال التحقق من الصلاحية
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="w-full p-6 text-start" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة المشرفين</h1>
        <Button onClick={() => { setAddOpen(true); setPhoneTouched(false); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="ml-2 h-4 w-4" /> إضافة مشرف
        </Button>
      </div>

      <Card className="shadow-sm border">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-right">الاسم</th>
                <th className="p-4 text-right">رقم الهاتف</th>
                <th className="p-4 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((sp: any) => {
                const isEditing = editingId === sp.id;
                const isEditDuplicate = isEditing && checkDuplicate(editDraft.phone, sp.id);
                const isEditInvalid = isEditing && !isValidPalestinePhone(editDraft.phone);

                return (
                  <tr key={sp.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium">
                      {isEditing ? (
                        <Input value={editDraft.nameAr} onChange={(e) => setEditDraft({...editDraft, nameAr: e.target.value})} />
                      ) : sp.nameAr}
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-1 min-w-[180px]">
                          <Input 
                            value={editDraft.phone} 
                            maxLength={10}
                            onChange={(e) => setEditDraft({...editDraft, phone: normalizePhone(e.target.value)})}
                            className={(isEditInvalid || isEditDuplicate) ? "border-red-500 bg-red-50" : "border-blue-400"}
                          />
                          {isEditInvalid && <span className="text-[10px] text-red-600 font-bold">{phoneErrorMessage}</span>}
                          {isEditDuplicate && <span className="text-[10px] text-red-600 font-bold bg-yellow-100 p-1">⚠️ {duplicateErrorMessage}</span>}
                        </div>
                      ) : sp.phone}
                    </td>
                    <td className="p-4 flex gap-2">
                      {isEditing ? (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => onSaveEdit(sp.id)} 
                            disabled={isEditInvalid || isEditDuplicate || submitting} 
                            className="bg-green-600"
                          >
                             {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => {
                          setEditingId(sp.id);
                          setEditDraft({ nameAr: sp.nameAr, phone: sp.phone, status: sp.status });
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle className="text-right">إضافة مشرف جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 text-right">
            <div>
              <label className="block text-sm font-bold mb-1">اسم المشرف *</label>
              <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="أدخل الاسم" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-gray-700">رقم الهاتف *</label>
              <Input 
                value={phone} 
                maxLength={10}
                placeholder="05XXXXXXXX"
                onChange={(e) => { setPhone(normalizePhone(e.target.value)); setPhoneTouched(true); }}
                className={phoneTouched && (phone.length > 0 && (!isValidPalestinePhone(phone) || isAddDuplicate)) ? "border-red-500" : ""}
              />
              {phoneTouched && phone.length > 0 && !isValidPalestinePhone(phone) && (
                <p className="text-[11px] text-red-600 font-bold mt-1">⚠️ {phoneErrorMessage}</p>
              )}
              {phoneTouched && isAddDuplicate && (
                <p className="text-[11px] text-red-600 font-bold mt-1 bg-yellow-50 p-1">⚠️ {duplicateErrorMessage}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">المنطقة *</label>
              <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full border rounded-md p-2 bg-white">
                <option value="">اختر المنطقة</option>
                <option value="Gaza">غزة</option>
                <option value="North">الشمال</option>
                <option value="South">الجنوب</option>
                <option value="Center">الوسطى</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onAdd} disabled={!canSaveAdd || submitting} className={`w-full font-bold ${!canSaveAdd ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {submitting ? "جاري الحفظ..." : "حفظ البيانات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}