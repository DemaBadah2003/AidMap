'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { requireAdmin } from '@/app/(protected)/project/helpers/route-guards'

type PlaceType = 'shelter' | 'hospital' | 'water' | 'food'

type FormState = {
  name: string
  type: PlaceType
  lng: string
  lat: string
  description: string
  operator: string
  capacity: string
  occupancy: string
  availableBeds: string
  statusText: string
}

const INITIAL_FORM: FormState = {
  name: '',
  type: 'shelter',
  lng: '',
  lat: '',
  description: '',
  operator: '',
  capacity: '',
  occupancy: '',
  availableBeds: '',
  statusText: '',
}

export default function AddPlacesPage() {
  const router = useRouter()

  useEffect(() => {
    requireAdmin(router)
  }, [router])

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const isShelter = useMemo(() => form.type === 'shelter', [form.type])

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setSuccess('')
    setError('')
  }

  const validateForm = () => {
    if (!form.name.trim()) return 'اسم المكان مطلوب'
    if (!form.lng.trim()) return 'خط الطول مطلوب'
    if (!form.lat.trim()) return 'خط العرض مطلوب'

    const lng = Number(form.lng)
    const lat = Number(form.lat)

    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      return 'قيمة خط الطول غير صحيحة'
    }

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return 'قيمة خط العرض غير صحيحة'
    }

    return ''
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        latitude: Number(form.lat),
        longitude: Number(form.lng),
        description: form.description.trim() || null,
        operator: form.operator.trim() || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        occupancy: form.occupancy ? Number(form.occupancy) : null,
        availableBeds: form.availableBeds ? Number(form.availableBeds) : null,
        statusText: form.statusText.trim() || null,
      }

      const res = await fetch('/api/project/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في إضافة المكان')
      }

      setSuccess('تمت إضافة المكان بنجاح')
      setTimeout(() => {
        router.push('/project/MapPreview')
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full py-4 sm:py-6 md:py-10">
      <div className="mx-auto w-full max-w-[800px] px-3 sm:px-4 md:px-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="px-1 text-center">
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">
              إضافة مكان جديد
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              من هنا يستطيع الأدمن إضافة مركز إيواء أو مستشفى أو نقطة ماء مع الإحداثيات.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5 md:p-6">
            <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5" dir="rtl">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 sm:text-sm">
                  اسم المكان
                </label>
                <input
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:h-11"
                  placeholder="مثال: مدرسة الرمال"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 sm:text-sm">
                  نوع المكان
                </label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:h-11"
                  value={form.type}
                  onChange={(e) => updateField('type', e.target.value as PlaceType)}
                >
                  <option value="shelter">مركز إيواء</option>
                  <option value="hospital">مستشفى</option>
                  <option value="water">نقطة ماء</option>
                  <option value="food">مركز دعم / غذاء</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 sm:text-sm">
                  وصف المكان
                </label>
                <textarea
                  className="min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:min-h-[110px]"
                  placeholder="مثال: نقطة طبية متوفرة في المنطقة"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700 sm:text-sm">
                    خط الطول (lng)
                  </label>
                  <input
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:h-11"
                    placeholder="34.4667"
                    value={form.lng}
                    onChange={(e) => updateField('lng', e.target.value)}
                    inputMode="decimal"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700 sm:text-sm">
                    خط العرض (lat)
                  </label>
                  <input
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:h-11"
                    placeholder="31.5000"
                    value={form.lat}
                    onChange={(e) => updateField('lat', e.target.value)}
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 sm:text-sm">
                  الجهة المشغلة
                </label>
                <input
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:h-11"
                  placeholder="مثال: UNRWA"
                  value={form.operator}
                  onChange={(e) => updateField('operator', e.target.value)}
                />
              </div>

              {isShelter && (
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700 sm:text-sm">
                      السعة
                    </label>
                    <input
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:h-11"
                      placeholder="500"
                      value={form.capacity}
                      onChange={(e) => updateField('capacity', e.target.value)}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700 sm:text-sm">
                      الإشغال
                    </label>
                    <input
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:h-11"
                      placeholder="420"
                      value={form.occupancy}
                      onChange={(e) => updateField('occupancy', e.target.value)}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700 sm:text-sm">
                      المتاح
                    </label>
                    <input
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:h-11"
                      placeholder="80"
                      value={form.availableBeds}
                      onChange={(e) => updateField('availableBeds', e.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 sm:text-sm">
                  حالة المكان
                </label>
                <textarea
                  className="min-h-[110px] w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-blue-600 sm:min-h-[120px]"
                  placeholder="مثال: شاغر: 80 / السعة 500"
                  value={form.statusText}
                  onChange={(e) => updateField('statusText', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/project/MapPreview')}
                  className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:h-11 sm:w-auto"
                >
                  الذهاب إلى الخريطة
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:h-11 sm:w-auto"
                >
                  إعادة تعيين
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:w-auto"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ المكان'}
                </button>
              </div>

              {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-right text-xs text-green-700 sm:text-sm">
                  {success}
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-right text-xs text-red-700 sm:text-sm">
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}