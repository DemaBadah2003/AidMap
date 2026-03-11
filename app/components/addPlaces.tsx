'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function AddPlaces() {
  const router = useRouter()

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

      const res = await fetch('/api/places', {
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
        router.push('/project/map-preview')
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 p-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 text-right">
  <h1 className="text-2xl font-bold">
    إضافة مكان جديد
  </h1>

  <p className="mt-2 text-sm text-muted-foreground">
    من هنا يستطيع الأدمن إضافة مركز إيواء أو مستشفى أو نقطة ماء مع الإحداثيات.
  </p>
</div>

        <form onSubmit={onSubmit} className="grid gap-5" dir="rtl">
          <div className="grid gap-2">
            <label className="text-sm font-medium">اسم المكان</label>
            <input
              className="h-11 rounded-lg border border-input bg-background px-3 outline-none"
              placeholder="مثال: مدرسة الرمال"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">نوع المكان</label>
            <select
              className="h-11 rounded-lg border border-input bg-background px-3 outline-none"
              value={form.type}
              onChange={(e) => updateField('type', e.target.value as PlaceType)}
            >
              <option value="shelter">مركز إيواء</option>
              <option value="hospital">مستشفى</option>
              <option value="water">نقطة ماء</option>
              <option value="food">مركز دعم / غذاء</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">وصف المكان</label>
            <textarea
              className="min-h-[100px] rounded-lg border border-input bg-background px-3 py-3 outline-none"
              placeholder="مثال: نقطة طبية متوفرة في المنطقة"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">خط الطول (lng)</label>
              <input
                className="h-11 rounded-lg border border-input bg-background px-3 outline-none"
                placeholder="34.4667"
                value={form.lng}
                onChange={(e) => updateField('lng', e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">خط العرض (lat)</label>
              <input
                className="h-11 rounded-lg border border-input bg-background px-3 outline-none"
                placeholder="31.5000"
                value={form.lat}
                onChange={(e) => updateField('lat', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">الجهة المشغلة</label>
            <input
              className="h-11 rounded-lg border border-input bg-background px-3 outline-none"
              placeholder="مثال: UNRWA"
              value={form.operator}
              onChange={(e) => updateField('operator', e.target.value)}
            />
          </div>

          {isShelter && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">السعة</label>
                <input
                  className="h-11 rounded-lg border border-input bg-background px-3 outline-none"
                  placeholder="500"
                  value={form.capacity}
                  onChange={(e) => updateField('capacity', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">الإشغال</label>
                <input
                  className="h-11 rounded-lg border border-input bg-background px-3 outline-none"
                  placeholder="420"
                  value={form.occupancy}
                  onChange={(e) => updateField('occupancy', e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">المتاح</label>
                <input
                  className="h-11 rounded-lg border border-input bg-background px-3 outline-none"
                  placeholder="80"
                  value={form.availableBeds}
                  onChange={(e) => updateField('availableBeds', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <label className="text-sm font-medium">حالة المكان</label>
            <textarea
              className="min-h-[120px] rounded-lg border border-input bg-background px-3 py-3 outline-none"
              placeholder="مثال: شاغر: 80 / السعة 500"
              value={form.statusText}
              onChange={(e) => updateField('statusText', e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 font-medium text-primary-foreground disabled:opacity-60"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ المكان'}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-input bg-background px-5 font-medium"
            >
              إعادة تعيين
            </button>

            <button
              type="button"
              onClick={() => router.push('/project/map-preview')}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-input bg-background px-5 font-medium"
            >
              الذهاب إلى الخريطة
            </button>
          </div>

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {success}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}