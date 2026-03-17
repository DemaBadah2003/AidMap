'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { requireCitizen } from '@/app/(protected)/project/helpers/route-guards'

type FormErrors = {
  fullName?: string
  nationalId?: string
  phone?: string
  aidType?: string
  familyCount?: string
  address?: string
  notes?: string
  general?: string
}

const phoneRegex = /^(056|059)\d{7}$/
const nationalIdRegex = /^\d{9}$/
const repeatedDigitsRegex = /^(\d)\1+$/

export default function RequestAidPage() {
  const router = useRouter()

  useEffect(() => {
    requireCitizen(router)
  }, [router])

  const [fullName, setFullName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [phone, setPhone] = useState('')
  const [aidType, setAidType] = useState('')
  const [familyCount, setFamilyCount] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const validateNationalId = (value: string) => {
    if (!value) return 'رقم الهوية مطلوب'
    if (!/^\d+$/.test(value)) return 'رقم الهوية يجب أن يحتوي على أرقام فقط'
    if (!nationalIdRegex.test(value)) return 'رقم الهوية يجب أن يحتوي على 9 أرقام'
    if (value === '000000000') return 'رقم الهوية غير صالح'
    if (repeatedDigitsRegex.test(value)) return 'رقم الهوية غير صالح'
    return ''
  }

  const validatePhone = (value: string) => {
    if (!value) return 'رقم الجوال مطلوب'
    if (!/^\d+$/.test(value)) return 'رقم الجوال يجب أن يحتوي على أرقام فقط'
    if (!phoneRegex.test(value)) {
      return 'رقم الجوال يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام'
    }
    return ''
  }

  const validateFamilyCount = (value: string) => {
    if (!value) return 'عدد أفراد الأسرة مطلوب'
    if (!/^\d+$/.test(value)) return 'عدد أفراد الأسرة يجب أن يحتوي على أرقام فقط'

    const num = Number(value)

    if (!Number.isInteger(num)) return 'عدد أفراد الأسرة يجب أن يكون رقمًا صحيحًا'
    if (num < 1) return 'عدد أفراد الأسرة يجب أن يكون أكبر من صفر'
    if (num > 20) return 'عدد أفراد الأسرة يجب أن يكون بين 1 و 20'

    return ''
  }

  const validateFullName = (value: string) => {
    if (!value.trim()) return 'الاسم الكامل مطلوب'
    return ''
  }

  const validateAidType = (value: string) => {
    if (!value) return 'نوع المساعدة مطلوب'
    return ''
  }

  const validateAddress = (value: string) => {
    if (!value.trim()) return 'العنوان / المخيم / المنطقة مطلوب'
    return ''
  }

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'fullName':
        return validateFullName(value)
      case 'nationalId':
        return validateNationalId(value)
      case 'phone':
        return validatePhone(value)
      case 'aidType':
        return validateAidType(value)
      case 'familyCount':
        return validateFamilyCount(value)
      case 'address':
        return validateAddress(value)
      default:
        return ''
    }
  }

  const validateForm = () => {
    const newErrors: FormErrors = {
      fullName: validateFullName(fullName),
      nationalId: validateNationalId(nationalId),
      phone: validatePhone(phone),
      aidType: validateAidType(aidType),
      familyCount: validateFamilyCount(familyCount),
      address: validateAddress(address),
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(Boolean)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSuccessMessage('')
    setErrorMessage('')

    const isValid = validateForm()
    if (!isValid) return

    setLoading(true)

    try {
      const res = await fetch('/api/project/requestAid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          nationalId,
          phone,
          aidType,
          familyCount: Number(familyCount),
          address: address.trim(),
          notes: notes.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في إرسال الطلب')
      }

      setSuccessMessage('تم إرسال الطلب بنجاح')
      setErrorMessage('')
      setFullName('')
      setNationalId('')
      setPhone('')
      setAidType('')
      setFamilyCount('')
      setAddress('')
      setNotes('')
      setErrors({})
    } catch (error: any) {
      setErrorMessage(error?.message || 'حدث خطأ غير متوقع')
      setSuccessMessage('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6" dir="ltr">
        <h1 className="text-[34px] font-semibold leading-tight text-black">Request Aid</h1>
        <div className="mt-1 text-sm text-slate-500">
          Home <span className="mx-2">{'>'}</span>
          <span className="text-slate-700">Aid Request</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 text-right" dir="rtl">
          <h2 className="text-xl font-semibold text-slate-900">تقديم طلب مساعدة</h2>
          <p className="mt-1 text-sm text-slate-500">
            يمكنك تعبئة النموذج التالي لإرسال طلب مساعدة جديد، وسيتم مراجعته من قبل الإدارة.
          </p>
        </div>

        <div className="px-5 py-6 sm:px-6" dir="rtl">
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-800">الاسم الكامل</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  setErrors((prev) => ({
                    ...prev,
                    fullName: validateField('fullName', e.target.value),
                  }))
                }}
                placeholder="مثال: أحمد محمد أحمد"
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm shadow-none outline-none placeholder:text-slate-400 focus:border-slate-300"
              />
              {errors.fullName && (
                <div className="text-sm text-red-600 text-right">{errors.fullName}</div>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-800">رقم الهوية</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={9}
                value={nationalId}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setNationalId(value)
                  setErrors((prev) => ({
                    ...prev,
                    nationalId: validateField('nationalId', value),
                  }))
                }}
                placeholder="123456789"
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm shadow-none outline-none placeholder:text-slate-400 focus:border-slate-300"
              />
              {errors.nationalId && (
                <div className="text-sm text-red-600 text-right">{errors.nationalId}</div>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-800">رقم الهاتف</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setPhone(value)
                  setErrors((prev) => ({
                    ...prev,
                    phone: validateField('phone', value),
                  }))
                }}
                placeholder="059XXXXXXX"
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm shadow-none outline-none placeholder:text-slate-400 focus:border-slate-300"
              />
              {errors.phone && (
                <div className="text-sm text-red-600 text-right">{errors.phone}</div>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-800">نوع المساعدة</label>
              <select
                value={aidType}
                onChange={(e) => {
                  setAidType(e.target.value)
                  setErrors((prev) => ({
                    ...prev,
                    aidType: validateField('aidType', e.target.value),
                  }))
                }}
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:border-slate-300"
              >
                <option value="">اختر نوع المساعدة</option>
                <option value="غذائية">غذائية</option>
                <option value="مياه">مياه</option>
                <option value="دواء">دواء</option>
                <option value="ملابس">ملابس</option>
                <option value="مواد نظافة">مواد نظافة</option>
                <option value="بطانيات">بطانيات</option>
              </select>
              {errors.aidType && (
                <div className="text-sm text-red-600 text-right">{errors.aidType}</div>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-800">عدد أفراد الأسرة</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={familyCount}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setFamilyCount(value)
                  setErrors((prev) => ({
                    ...prev,
                    familyCount: validateField('familyCount', value),
                  }))
                }}
                placeholder="6"
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm shadow-none outline-none placeholder:text-slate-400 focus:border-slate-300"
              />
              {errors.familyCount && (
                <div className="text-sm text-red-600 text-right">{errors.familyCount}</div>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-800">العنوان / المخيم / المنطقة</label>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value)
                  setErrors((prev) => ({
                    ...prev,
                    address: validateField('address', e.target.value),
                  }))
                }}
                placeholder="مثال: مخيم الأمل - بلوك B"
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm shadow-none outline-none placeholder:text-slate-400 focus:border-slate-300"
              />
              {errors.address && (
                <div className="text-sm text-red-600 text-right">{errors.address}</div>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-800">ملاحظات إضافية</label>
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="اكتب أي ملاحظات إضافية هنا"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-right text-sm outline-none placeholder:text-slate-400 focus:border-slate-300"
              />
            </div>

            {successMessage && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 text-right">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-right">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-start">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}