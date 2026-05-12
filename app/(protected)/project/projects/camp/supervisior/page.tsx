'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { Pencil, Save, X, Plus } from 'lucide-react'

// --- وظائف التحقق المساعدة ---

// تنظيف الرقم: حذف أي شيء ليس رقماً وتحديد الطول بـ 10 أرقام فقط
const normalizePhone = (value: string) => value.replace(/[^\d]/g, '').slice(0, 10)

// الشرط الصارم: يجب أن يبدأ بـ 056 أو 059 ويتبعه 7 أرقام بالضبط (المجموع 10)
const isValidPalestinePhone = (phone: string) => {
  const regex = /^(056|059)\d{7}$/
  return regex.test(phone)
}

const API_URL = '/api/project/camp/supervisior'

export default function SupervisorsPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // حالات الإضافة
  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [phone, setPhone] = useState('')
  const [area, setArea] = useState('')
  const [status, setStatus] = useState('active')
  const [submitting, setSubmitting] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false) // مراقبة إذا بدأ المستخدم الكتابة

  // حالات التعديل
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState({ nameAr: '', phone: '', status: 'active' })

  // رسالة التحذير الموحدة
  const phoneErrorMessage = "يجب أن يبدأ رقم الهاتف بـ 056 أو 059 ويتكون من 10 أرقام"

  // دوال التحقق المباشر
  const isAddPhoneValid = isValidPalestinePhone(phone)
  const canSaveAdd = nameAr.trim() !== '' && area !== '' && isAddPhoneValid

  const fetchSupervisors = async () => {
    setLoading(true)
    try {
      const res = await fetch(API_URL)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSupervisors() }, [])

  const onAdd = async () => {
    if (!canSaveAdd) return;
    setSubmitting(true)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameAr: nameAr.trim(), phone, status }),
      })
      if (res.ok) {
        fetchSupervisors()
        setAddOpen(false)
        setNameAr(''); setPhone(''); setArea(''); setPhoneTouched(false);
      }
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  const onSaveEdit = async (id: string) => {
    if (!isValidPalestinePhone(editDraft.phone)) return;
    try {
      const res = await fetch(`${API_URL}?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      })
      if (res.ok) {
        setEditingId(null)
        fetchSupervisors()
      }
    } catch (err) { console.error(err) }
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
                const isEditPhoneInvalid = isEditing && editDraft.phone.length > 0 && !isValidPalestinePhone(editDraft.phone);

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
                            onChange={(e) => setEditDraft({...editDraft, phone: normalizePhone(e.target.value)})}
                            className={isEditPhoneInvalid ? "border-red-500 bg-red-50 focus-visible:ring-red-500" : ""}
                          />
                          {isEditPhoneInvalid && (
                            <span className="text-[10px] text-red-600 font-bold leading-tight">{phoneErrorMessage}</span>
                          )}
                        </div>
                      ) : sp.phone}
                    </td>
                    <td className="p-4 flex gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={() => onSaveEdit(sp.id)} disabled={!isValidPalestinePhone(editDraft.phone)} className="bg-green-600">
                             <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                             <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => {
                          setEditingId(sp.id)
                          setEditDraft({ nameAr: sp.nameAr, phone: sp.phone, status: sp.status })
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

      {/* مودال الإضافة */}
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
                placeholder="05XXXXXXXX"
                onChange={(e) => {
                    setPhone(normalizePhone(e.target.value));
                    setPhoneTouched(true);
                }}
                className={phoneTouched && phone.length > 0 && !isAddPhoneValid ? "border-red-500 bg-red-50 focus-visible:ring-red-500" : ""}
              />
              {/* رسالة التحذير الحمراء تظهر هنا فوراً */}
              {phoneTouched && phone.length > 0 && !isAddPhoneValid && (
                <p className="text-[11px] text-red-600 font-bold mt-1 bg-red-50 p-2 rounded border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-1">
                   ⚠️ {phoneErrorMessage}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">المنطقة *</label>
              <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full border rounded-md p-2 bg-white">
                <option value="">اختر المنطقة</option>
                <option value="Gaza">غزة</option>
                <option value="North">الشمال</option>
                <option value="South">الجنوب</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={onAdd} 
              disabled={!canSaveAdd || submitting} 
              className={`w-full font-bold ${!canSaveAdd ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {submitting ? "جاري الحفظ..." : "حفظ البيانات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}