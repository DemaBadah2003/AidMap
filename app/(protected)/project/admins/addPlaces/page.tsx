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
  operator: string
  capacity: string
  occupancy: string
  availableBeds: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const INITIAL_FORM: FormState = {
  name: '',
  type: 'shelter',
  lng: '',
  lat: '',
  operator: '',
  capacity: '',
  occupancy: '',
  availableBeds: '',
}

const ARABIC_NAME_REGEX = /^[\u0600-\u06FF\s]+$/
const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/
const INTEGER_REGEX = /^\d+$/

const NAME_MAX_LENGTH = 100
const MAX_COUNT_VALUE = 1000000

export default function AddPlacesPage() {
  const router = useRouter()

  useEffect(() => {
    requireAdmin(router)
  }, [router])

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const isShelter = useMemo(() => form.type === 'shelter', [form.type])

  const normalizeSpaces = (value: string) => value.replace(/\s+/g, ' ')
  const sanitizeArabicName = (value: string) => value.replace(/[^\u0600-\u06FF\s]/g, '').replace(/\s{2,}/g, ' ')
  const sanitizeDecimalInput = (value: string) => value.replace(/[^\d.-]/g, '').replace(/(?!^)-/g, '').replace(/(\..*)\./g, '$1')
  const sanitizeIntegerInput = (value: string) => value.replace(/[^\d]/g, '')
  const sanitizeOperatorInput = (value: string) => value.replace(/[^A-Za-z\u0600-\u06FF\s]/g, '').replace(/\s{2,}/g, ' ')

  const updateField = (key: keyof FormState, value: string) => {
    let nextValue = value
    if (key === 'name') nextValue = sanitizeArabicName(value)
    else if (key === 'lng' || key === 'lat') nextValue = sanitizeDecimalInput(value)
    else if (key === 'capacity' || key === 'occupancy' || key === 'availableBeds') nextValue = sanitizeIntegerInput(value)
    else if (key === 'operator') nextValue = sanitizeOperatorInput(value)

    setForm((prev) => ({ ...prev, [key]: nextValue }))
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: '' }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {}
    if (!form.name.trim()) errors.name = 'مطلوب'
    if (!form.lng.trim()) errors.lng = 'مطلوب'
    if (!form.lat.trim()) errors.lat = 'مطلوب'
    return errors
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const validationErrors = validateForm()
    setFieldErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setError('يرجى ملء الحقول المطلوبة')
      setLoading(false)
      return
    }

    try {
      const payload = {
        name: normalizeSpaces(form.name.trim()),
        type: form.type,
        latitude: Number(form.lat),
        longitude: Number(form.lng),
        operator: form.operator.trim() ? normalizeSpaces(form.operator.trim()) : null,
        capacity: isShelter && form.capacity ? Number(form.capacity) : null,
        occupancy: isShelter && form.occupancy ? Number(form.occupancy) : null,
        availableBeds: isShelter && form.availableBeds ? Number(form.availableBeds) : null,
      }

      const res = await fetch('/api/project/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('فشل في الإضافة')
      setSuccess('تمت إضافة المكان بنجاح')
      setTimeout(() => router.push('/project/MapPreview'), 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const inputClassName = (hasError?: boolean) =>
    `h-9 w-full rounded-md border bg-white px-3 text-right text-sm outline-none transition ${
      hasError ? 'border-red-400 focus:ring-1 focus:ring-red-500' : 'border-slate-200 focus:ring-1 focus:ring-blue-500'
    }`

  return (
    <div className="w-full py-4">
      <div className="mx-auto w-full max-w-[700px] px-3">
        <div className="space-y-3">
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">إضافة مكان جديد</h1>
            <p className="text-[11px] text-slate-500">قم بتعبئة البيانات الأساسية للمكان وإحداثياته على الخريطة.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <form onSubmit={onSubmit} className="space-y-4" dir="rtl" noValidate>
              
              {/* الصف الأول: الاسم والنوع */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">اسم المكان</label>
                  <input className={inputClassName(!!fieldErrors.name)} placeholder="مثال: مستشفى العودة" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
                  {fieldErrors.name && <p className="text-[10px] text-red-600">{fieldErrors.name}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">نوع المكان</label>
                  <select className={inputClassName()} value={form.type} onChange={(e) => updateField('type', e.target.value as PlaceType)}>
                    <option value="shelter">مركز إيواء</option>
                    <option value="hospital">مستشفى</option>
                    <option value="water">نقطة ماء</option>
                    <option value="food">مركز دعم / غذاء</option>
                  </select>
                </div>
              </div>

              {/* الصف الثاني: الإحداثيات */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">خط الطول (Lng)</label>
                  <input className={inputClassName(!!fieldErrors.lng)} value={form.lng} onChange={(e) => updateField('lng', e.target.value)} dir="ltr" placeholder="34.46" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">خط العرض (Lat)</label>
                  <input className={inputClassName(!!fieldErrors.lat)} value={form.lat} onChange={(e) => updateField('lat', e.target.value)} dir="ltr" placeholder="31.50" />
                </div>
              </div>

              {/* الصف الثالث: الجهة المشغلة */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">الجهة المشغلة</label>
                <input className={inputClassName()} placeholder="مثال: الأونروا / وزارة الصحة" value={form.operator} onChange={(e) => updateField('operator', e.target.value)} />
              </div>

              {/* قسم السعة لمركز الإيواء */}
              {isShelter && (
                <div className="grid grid-cols-3 gap-3 rounded-lg bg-blue-50/50 p-3 border border-blue-100">
                  <div className="flex flex-col gap-1 text-center">
                    <label className="text-[10px] font-bold text-blue-700">السعة القصوى</label>
                    <input className={inputClassName()} value={form.capacity} onChange={(e) => updateField('capacity', e.target.value)} dir="ltr" />
                  </div>
                  <div className="flex flex-col gap-1 text-center">
                    <label className="text-[10px] font-bold text-blue-700">عدد المقيمين</label>
                    <input className={inputClassName()} value={form.occupancy} onChange={(e) => updateField('occupancy', e.target.value)} dir="ltr" />
                  </div>
                  <div className="flex flex-col gap-1 text-center">
                    <label className="text-[10px] font-bold text-blue-700">الأسرة المتاحة</label>
                    <input className={inputClassName()} value={form.availableBeds} onChange={(e) => updateField('availableBeds', e.target.value)} dir="ltr" />
                  </div>
                </div>
              )}

              {/* أزرار الإجراءات */}
              <div className="flex flex-row gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-[2] h-10 rounded-md bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 order-1">
                  {loading ? 'جاري الحفظ...' : 'حفظ المكان'}
                </button>
                <button type="button" onClick={() => router.push('/project/MapPreview')} className="flex-1 h-10 rounded-md border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 order-2">
                  الخريطة
                </button>
              </div>

              {(success || error) && (
                <div className={`mt-2 rounded-md py-2 px-3 text-center text-xs font-medium border ${success ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                  {success || error}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}