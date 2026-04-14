'use client'

import { useState, type ChangeEvent } from 'react'
import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'

// ملاحظة: تم إزالة requireAdmin و useEffect لفتح الصفحة للجميع بدون استثناء

type FormData = {
  name: string
  phone: string
  numberOfFamily: string
  campId: string
}

type FormErrors = {
  name?: string
  phone?: string
  numberOfFamily?: string
  campId?: string
  general?: string
}

const arabicNameRegex = /^[\u0600-\u06FF\s]+$/
const phoneRegex = /^(056|059)\d{7}$/
const familyRegex = /^\d{1,2}$/

const gazaCampOptions = [
  'مخيم جباليا', 'مخيم الشاطئ', 'مخيم النصيرات', 'مخيم البريج',
  'مخيم المغازي', 'مخيم دير البلح', 'مخيم خان يونس', 'مخيم رفح',
  'مخيم الشابورة', 'مخيم البرازيل', 'الشيخ رضوان', 'تل الهوى',
  'الرمال', 'الشجاعية', 'الزيتون', 'بيت لاهيا', 'بيت حانون',
  'دير البلح', 'خان يونس', 'رفح',
]

export default function AdminBeneficiaryPage() {
  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    numberOfFamily: '',
    campId: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const validateField = (name: keyof FormData, value: string) => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length === 0) return 'الاسم مطلوب'
        if (value !== value.trim()) return 'الاسم لا يجب أن يبدأ أو ينتهي بمسافة'
        if (!arabicNameRegex.test(value)) return 'الاسم يجب أن يكون باللغة العربية فقط'
        if (/\s{2,}/.test(value)) return 'لا يمكن وضع أكثر من مسافة بين الكلمات'
        return ''

      case 'phone':
        if (!value) return 'رقم الهاتف مطلوب'
        if (!/^\d+$/.test(value)) return 'رقم الهاتف يجب أن يحتوي على أرقام فقط'
        if (!phoneRegex.test(value)) return 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام'
        return ''

      case 'numberOfFamily':
        if (!value) return 'عدد أفراد الأسرة مطلوب'
        if (!/^\d+$/.test(value)) return 'يجب إدخال أرقام فقط'
        if (!familyRegex.test(value)) return 'يجب أن يكون من رقم أو رقمين فقط'
        return ''

      default:
        return ''
    }
  }

  const validateForm = () => {
    const newErrors: FormErrors = {
      name: validateField('name', form.name),
      phone: validateField('phone', form.phone),
      numberOfFamily: validateField('numberOfFamily', form.numberOfFamily),
      campId: '',
    }
    setErrors(newErrors)
    return !Object.values(newErrors).some(Boolean)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let nextValue = value

    if (name === 'phone' || name === 'numberOfFamily') {
      nextValue = value.replace(/\D/g, '')
    }

    setForm((prev) => ({ ...prev, [name]: nextValue }))
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof FormData, nextValue),
      general: '',
    }))
    setErrorMsg('')
    setSuccessMsg('')
  }

  const onSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const res = await fetch('/api/project/admins/adminBeneficiary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          numberOfFamily: Number(form.numberOfFamily),
          campId: form.campId || null,
          role: 'CITIZEN',
        }),
      })

      const data = await res.json().catch(() => ({ message: 'خطأ في معالجة البيانات' }))

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في إضافة المستفيد')
      }

      setSuccessMsg('تمت إضافة المستفيد بنجاح')
      setForm({ name: '', phone: '', numberOfFamily: '', campId: '' })
      setErrors({})
    } catch (error: any) {
      setErrorMsg(error.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    // التعديل لضمان السكرول: py-10 مع min-h-screen و overflow-y-auto
    <div className="w-full min-h-screen bg-slate-50 py-10 overflow-y-auto" dir="rtl">
      <div className="mx-auto w-full max-w-[800px] px-4 sm:px-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">تسجيل مستفيد جديد</h1>
          <p className="text-sm text-slate-500 font-normal">نموذج متاح للجميع - يرجى تعبئة البيانات بدقة</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-6 md:p-10">
              <div className="mx-auto w-full max-w-[700px] space-y-5">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 mr-1">الاسم الكامل</label>
                  <Input 
                    name="name" 
                    value={form.name} 
                    onChange={onChange} 
                    placeholder="مثال: علي أحمد" 
                    className="text-right h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-100" 
                  />
                  {errors.name && <div className="text-xs text-red-600 mr-1">{errors.name}</div>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 mr-1">رقم الهاتف</label>
                  <Input 
                    name="phone" 
                    value={form.phone} 
                    onChange={onChange} 
                    placeholder="059XXXXXXX" 
                    maxLength={10} 
                    className="text-right h-11 border-slate-200 focus:border-blue-500" 
                  />
                  {errors.phone && <div className="text-xs text-red-600 mr-1">{errors.phone}</div>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 mr-1">عدد أفراد الأسرة</label>
                  <Input 
                    name="numberOfFamily" 
                    value={form.numberOfFamily} 
                    onChange={onChange} 
                    placeholder="مثال: 5" 
                    maxLength={2} 
                    className="text-right h-11 border-slate-200 focus:border-blue-500" 
                  />
                  {errors.numberOfFamily && <div className="text-xs text-red-600 mr-1">{errors.numberOfFamily}</div>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700 mr-1">المخيم / المنطقة</label>
                  <select 
                    name="campId" 
                    value={form.campId} 
                    onChange={onChange} 
                    className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">اختر المخيم أو المنطقة (اختياري)</option>
                    {gazaCampOptions.map((camp) => <option key={camp} value={camp}>{camp}</option>)}
                  </select>
                </div>

                {(successMsg || errorMsg) && (
                  <div className={`p-4 rounded-lg text-sm text-center border ${
                    successMsg ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {successMsg || errorMsg}
                  </div>
                )}

                <div className="flex justify-center pt-4">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-11 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50" 
                    onClick={onSubmit} 
                    disabled={loading}
                  >
                    {loading ? 'جاري الإضافة...' : 'تسجيل البيانات الآن'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}