'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { requireCitizen } from '@/app/(protected)/project/helpers/route-guards'

type AidResult = {
  found: boolean
  beneficiaryName?: string
  nationalId?: string
  aidType?: string
  status?: string
  requestNumber?: string
  distributionDate?: string
  pickupLocation?: string
  notes?: string
}

const nationalIdRegex = /^\d{9}$/
const repeatedDigitsRegex = /^(\d)\1+$/

export default function MyAidPage() {
  const router = useRouter()

  useEffect(() => {
    requireCitizen(router)
  }, [router])

  const [nationalId, setNationalId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<AidResult | null>(null)

  const validateNationalId = (value: string) => {
    if (!value) return 'رقم الهوية مطلوب'
    if (!/^\d+$/.test(value)) return 'رقم الهوية يجب أن يحتوي على أرقام فقط'
    if (!nationalIdRegex.test(value)) return 'رقم الهوية يجب أن يحتوي على 9 أرقام'
    if (value === '000000000') return 'رقم الهوية غير صالح'
    if (repeatedDigitsRegex.test(value)) return 'رقم الهوية غير صالح'
    return ''
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    setMessage('')
    setResult(null)

    const validationError = validateNationalId(nationalId)
    if (validationError) {
      setMessage(validationError)
      return
    }

    setLoading(true)

    try {
      const res = await fetch(
        `/api/project/myAid?nationalId=${encodeURIComponent(nationalId)}`
      )
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || 'حدث خطأ أثناء الفحص')
      } else {
        setResult(data)
      }
    } catch {
      setMessage('تعذر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const getStatusClasses = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'border-amber-200 bg-amber-50 text-amber-700'
      case 'approved':
        return 'border-green-200 bg-green-50 text-green-700'
      case 'delivered':
        return 'border-blue-200 bg-blue-50 text-blue-700'
      case 'rejected':
        return 'border-red-200 bg-red-50 text-red-700'
      case 'done':
        return 'border-blue-200 bg-blue-50 text-blue-700'
      case 'canceled':
        return 'border-red-200 bg-red-50 text-red-700'
      default:
        return 'border-slate-200 bg-slate-50 text-slate-700'
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'قيد المراجعة'
      case 'approved':
        return 'تمت الموافقة'
      case 'delivered':
        return 'تم التسليم'
      case 'rejected':
        return 'مرفوض'
      case 'done':
        return 'تم'
      case 'canceled':
        return 'ملغي'
      default:
        return 'غير معروف'
    }
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6" dir="ltr">
        <h1 className="text-[34px] font-semibold leading-tight text-black">My Aid</h1>
        <div className="mt-1 text-sm text-slate-500">
          Home <span className="mx-2">{'>'}</span>
          <span className="text-slate-700">Aid Status Check</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 text-right" dir="rtl">
          <h2 className="text-xl font-semibold text-slate-900">فحص حالة المساعدة</h2>
          <p className="mt-1 text-sm text-slate-500">
            أدخل رقم الهوية لمعرفة حالة طلب المساعدة الخاص بك وما إذا تم تخصيص مساعدة لك أم لا.
          </p>
        </div>

        <div className="px-5 py-6 sm:px-6" dir="rtl">
          <form onSubmit={handleSearch} className="grid gap-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-800">رقم الهوية</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={9}
                className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm shadow-none outline-none placeholder:text-slate-400 focus:border-slate-300"
                placeholder="مثال: 123456789"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="flex justify-start">
              <button
                type="submit"
                disabled={loading}
                className="h-10 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'جارٍ الفحص...' : 'فحص الحالة'}
              </button>
            </div>
          </form>

          {message && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 text-right">
              {message}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5 text-right" dir="rtl">
            <h2 className="text-xl font-semibold text-slate-900">نتيجة الفحص</h2>
            <p className="mt-1 text-sm text-slate-500">
              تفاصيل حالة المساعدة المرتبطة برقم الهوية المدخل
            </p>
          </div>

          <div className="px-5 py-6 sm:px-6" dir="rtl">
            {result.found ? (
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800">اسم المستفيد</label>
                  <input
                    type="text"
                    className="h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-right text-sm outline-none"
                    value={result.beneficiaryName || ''}
                    readOnly
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800">رقم الهوية</label>
                  <input
                    type="text"
                    className="h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-right text-sm outline-none"
                    value={result.nationalId || ''}
                    readOnly
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800">نوع المساعدة</label>
                  <input
                    type="text"
                    className="h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-right text-sm outline-none"
                    value={result.aidType || ''}
                    readOnly
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800">رقم الطلب</label>
                  <input
                    type="text"
                    className="h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-right text-sm outline-none"
                    value={result.requestNumber || ''}
                    readOnly
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800">الحالة</label>
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getStatusClasses(
                        result.status
                      )}`}
                    >
                      {getStatusText(result.status)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800">تاريخ التوزيع</label>
                  <input
                    type="text"
                    className="h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-right text-sm outline-none"
                    value={result.distributionDate || 'لم يحدد بعد'}
                    readOnly
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800">مكان الاستلام</label>
                  <input
                    type="text"
                    className="h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-right text-sm outline-none"
                    value={result.pickupLocation || 'سيتم إعلامك لاحقًا'}
                    readOnly
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-800">ملاحظات</label>
                  <textarea
                    rows={5}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-right text-sm outline-none"
                    value={result.notes || 'لا توجد ملاحظات إضافية'}
                    readOnly
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 text-right">
                لا توجد مساعدة مخصصة لهذا الرقم حاليًا، أو أن الطلب ما زال قيد المتابعة.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}