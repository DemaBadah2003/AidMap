'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { requireAdmin } from '@/app/(protected)/project/helpers/route-guards'
import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'

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
  'مخيم جباليا',
  'مخيم الشاطئ',
  'مخيم النصيرات',
  'مخيم البريج',
  'مخيم المغازي',
  'مخيم دير البلح',
  'مخيم خان يونس',
  'مخيم رفح',
  'مخيم الشابورة',
  'مخيم البرازيل',
  'الشيخ رضوان',
  'تل الهوى',
  'الرمال',
  'الشجاعية',
  'الزيتون',
  'بيت لاهيا',
  'بيت حانون',
  'دير البلح',
  'خان يونس',
  'رفح',
]

export default function AdminBeneficiaryPage() {
  const router = useRouter()

  useEffect(() => {
    requireAdmin(router)
  }, [router])

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
        if (!value) return 'الاسم مطلوب'
        if (value.trim().length === 0) return 'الاسم مطلوب'
        if (value !== value.trim()) return 'الاسم لا يجب أن يبدأ أو ينتهي بمسافة'
        if (!arabicNameRegex.test(value)) {
          return 'الاسم يجب أن يكون باللغة العربية فقط'
        }
        if (/\s{2,}/.test(value)) {
          return 'لا يمكن وضع أكثر من مسافة بين الكلمات'
        }
        return ''

      case 'phone':
        if (!value) return 'رقم الهاتف مطلوب'
        if (!/^\d+$/.test(value)) return 'رقم الهاتف يجب أن يحتوي على أرقام فقط'
        if (!phoneRegex.test(value)) {
          return 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام'
        }
        return ''

      case 'numberOfFamily':
        if (!value) return 'عدد أفراد الأسرة مطلوب'
        if (!/^\d+$/.test(value)) return 'عدد أفراد الأسرة يجب أن يحتوي على أرقام فقط'
        if (!familyRegex.test(value)) {
          return 'عدد أفراد الأسرة يجب أن يكون من رقم أو رقمين فقط'
        }
        return ''

      case 'campId':
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
      campId: validateField('campId', form.campId),
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(Boolean)
  }

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    let nextValue = value

    if (name === 'phone' || name === 'numberOfFamily') {
      nextValue = value.replace(/\D/g, '')
    }

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof FormData, nextValue),
      general: '',
    }))

    setErrorMsg('')
    setSuccessMsg('')
  }

  const onSubmit = async () => {
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')
    setErrors({})

    const isValid = validateForm()

    if (!isValid) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/project/adminBeneficiary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          numberOfFamily: Number(form.numberOfFamily),
          campId: form.campId || null,
          role: 'CITIZEN',
        }),
      })

      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await res.json()
        : null

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في إضافة المستفيد')
      }

      setSuccessMsg('تمت إضافة المستفيد بنجاح')
      setForm({
        name: '',
        phone: '',
        numberOfFamily: '',
        campId: '',
      })
      setErrors({})
    } catch (error: any) {
      setErrorMsg(error.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full px-3 sm:px-6 py-6" dir="rtl">
      <div className="mb-6" dir="ltr">
        <div className="text-left">
          <div className="text-2xl font-semibold text-foreground">Admin Beneficiary</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Add Beneficiary</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px]">
        <Card>
          <CardContent className="p-0">
            <div className="border-b px-4 py-4">
              <div className="text-lg font-semibold text-right">إضافة مستفيد جديد</div>
              <div className="mt-1 text-sm text-muted-foreground text-right">
                أدخل بيانات المستفيد ليتم إضافته من قبل الأدمن إلى النظام
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div dir="rtl" className="grid grid-cols-1 gap-4 max-w-[700px] ms-auto">
                <div className="grid gap-2">
                  <div className="text-sm">الاسم الكامل</div>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    placeholder="مثال: علي أحمد"
                    className="h-10"
                    autoComplete="off"
                  />
                  {errors.name && (
                    <div className="text-sm text-red-600 text-right">{errors.name}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-sm">رقم الهاتف</div>
                  <Input
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    placeholder="059XXXXXXX"
                    className="h-10"
                    autoComplete="off"
                    inputMode="numeric"
                    maxLength={10}
                  />
                  {errors.phone && (
                    <div className="text-sm text-red-600 text-right">{errors.phone}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-sm">عدد أفراد الأسرة</div>
                  <Input
                    name="numberOfFamily"
                    type="text"
                    value={form.numberOfFamily}
                    onChange={onChange}
                    placeholder="مثال: 5"
                    className="h-10"
                    autoComplete="off"
                    inputMode="numeric"
                    maxLength={2}
                  />
                  {errors.numberOfFamily && (
                    <div className="text-sm text-red-600 text-right">{errors.numberOfFamily}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-sm">المخيم / المنطقة</div>
                  <select
                    name="campId"
                    value={form.campId}
                    onChange={onChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">اختر المخيم أو المنطقة (اختياري)</option>

                    {gazaCampOptions.map((campName) => (
                      <option key={campName} value={campName}>
                        {campName}
                      </option>
                    ))}
                  </select>

                  {errors.campId && (
                    <div className="text-sm text-red-600 text-right">{errors.campId}</div>
                  )}
                </div>
              </div>

              {successMsg && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 text-right max-w-[700px] ms-auto">
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 text-right max-w-[700px] ms-auto">
                  {errorMsg}
                </div>
              )}

              <div className="mt-6 flex items-center justify-start max-w-[700px] ms-auto">
                <Button
                  className="!h-10 !rounded-lg !bg-blue-600 !px-5 !text-sm !font-semibold !text-white hover:!bg-blue-700"
                  onClick={onSubmit}
                  disabled={loading}
                >
                  {loading ? 'جاري الإضافة...' : 'إضافة المستفيد'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}