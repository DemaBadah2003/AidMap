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
    if (!value.trim()) return 'العنوان مطلوب'
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
      case 'notes':
        return ''
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
        headers: { 'Content-Type': 'application/json' },
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
      setFullName('')
      setNationalId('')
      setPhone('')
      setAidType('')
      setFamilyCount('')
      setAddress('')
      setNotes('')
      setErrors({})
    } catch (error: any) {
      setErrorMessage(error?.message || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full py-4 sm:py-6 md:py-10">
      <div className="mx-auto w-full max-w-[800px] px-3 sm:px-4 md:px-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center px-1">
            <h1 className="text-lg font-bold leading-tight sm:text-xl md:text-2xl">
              طلب المساعدة
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              قم بتعبئة النموذج لإرسال طلب مساعدة
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" dir="rtl">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-700 sm:text-sm">
                    الاسم الكامل
                  </label>
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
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:h-11"
                  />
                  {errors.fullName && (
                    <span className="text-xs text-red-500">{errors.fullName}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-700 sm:text-sm">
                    رقم الهوية
                  </label>
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
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:h-11"
                  />
                  {errors.nationalId && (
                    <span className="text-xs text-red-500">{errors.nationalId}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-700 sm:text-sm">
                    رقم الهاتف
                  </label>
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
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:h-11"
                  />
                  {errors.phone && (
                    <span className="text-xs text-red-500">{errors.phone}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-700 sm:text-sm">
                    نوع المساعدة
                  </label>
                  <select
                    value={aidType}
                    onChange={(e) => {
                      setAidType(e.target.value)
                      setErrors((prev) => ({
                        ...prev,
                        aidType: validateField('aidType', e.target.value),
                      }))
                    }}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:h-11"
                  >
                    <option value="">اختر</option>
                    <option value="food">مساعدة غذائية</option>
                    <option value="medical">مساعدة طبية</option>
                    <option value="financial">مساعدة مالية</option>
                    <option value="shelter">مساعدة سكن</option>
                  </select>
                  {errors.aidType && (
                    <span className="text-xs text-red-500">{errors.aidType}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-700 sm:text-sm">
                    عدد أفراد الأسرة
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={familyCount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      setFamilyCount(value)
                      setErrors((prev) => ({
                        ...prev,
                        familyCount: validateField('familyCount', value),
                      }))
                    }}
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:h-11"
                  />
                  {errors.familyCount && (
                    <span className="text-xs text-red-500">{errors.familyCount}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-700 sm:text-sm">
                    العنوان
                  </label>
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
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:h-11"
                  />
                  {errors.address && (
                    <span className="text-xs text-red-500">{errors.address}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-700 sm:text-sm">
                    ملاحظات
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:min-h-[120px]"
                  />
                </div>
              </div>

              {(successMessage || errorMessage) && (
                <div className="pt-1">
                  {successMessage && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 sm:text-sm">
                      {successMessage}
                    </div>
                  )}
                  {errorMessage && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:text-sm">
                      {errorMessage}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-center pt-2 sm:pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 w-full rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:w-[240px]"
                >
                  {loading ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}