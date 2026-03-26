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

type FormErrors = Partial<Record<keyof FormState, string>>

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

const ARABIC_NAME_REGEX = /^[\u0600-\u06FF\s]+$/
const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/
const INTEGER_REGEX = /^\d+$/
const OPERATOR_REGEX = /^[A-Za-z\u0600-\u06FF\s]+$/

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 100
const DESCRIPTION_MAX_LENGTH = 500
const STATUS_TEXT_MAX_LENGTH = 300
const OPERATOR_MAX_LENGTH = 100
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

  const sanitizeTextField = (value: string) => value.replace(/\s{2,}/g, ' ')

  const sanitizeArabicName = (value: string) =>
    value
      .replace(/[^\u0600-\u06FF\s]/g, '')
      .replace(/\s{2,}/g, ' ')

  const sanitizeDecimalInput = (value: string) =>
    value
      .replace(/[^\d.-]/g, '')
      .replace(/(?!^)-/g, '')
      .replace(/(\..*)\./g, '$1')

  const sanitizeIntegerInput = (value: string) =>
    value.replace(/[^\d]/g, '')

  const sanitizeOperatorInput = (value: string) =>
    value
      .replace(/[^A-Za-z\u0600-\u06FF\s]/g, '')
      .replace(/\s{2,}/g, ' ')

  const updateField = (key: keyof FormState, value: string) => {
    let nextValue = value

    if (key === 'name') {
      nextValue = sanitizeArabicName(value)
    } else if (key === 'lng' || key === 'lat') {
      nextValue = sanitizeDecimalInput(value)
    } else if (key === 'capacity' || key === 'occupancy' || key === 'availableBeds') {
      nextValue = sanitizeIntegerInput(value)
    } else if (key === 'operator') {
      nextValue = sanitizeOperatorInput(value)
    } else if (key === 'description' || key === 'statusText') {
      nextValue = sanitizeTextField(value)
    }

    setForm((prev) => ({ ...prev, [key]: nextValue }))

    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: '' }))
    }

    if (error) setError('')
    if (success) setSuccess('')
  }

  const resetForm = () => {
    setForm(INITIAL_FORM)
    setFieldErrors({})
    setSuccess('')
    setError('')
  }

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {}

    const rawName = form.name
    const trimmedName = rawName.trim()
    const normalizedName = normalizeSpaces(trimmedName)

    if (!trimmedName) {
      errors.name = 'اسم المكان مطلوب'
    } else if (rawName !== trimmedName) {
      errors.name = 'اسم المكان يجب ألا يبدأ أو ينتهي بمسافة'
    } else if (normalizedName.length < NAME_MIN_LENGTH) {
      errors.name = `اسم المكان يجب أن يكون على الأقل ${NAME_MIN_LENGTH} أحرف`
    } else if (normalizedName.length > NAME_MAX_LENGTH) {
      errors.name = `اسم المكان يجب ألا يزيد عن ${NAME_MAX_LENGTH} حرفًا`
    } else if (!ARABIC_NAME_REGEX.test(normalizedName)) {
      errors.name = 'اسم المكان يجب أن يكون باللغة العربية فقط'
    }

    if (!form.lng.trim()) {
      errors.lng = 'خط الطول مطلوب'
    } else if (!DECIMAL_REGEX.test(form.lng.trim())) {
      errors.lng = 'خط الطول يجب أن يكون رقمًا فقط ويقبل الكسور العشرية'
    } else {
      const lng = Number(form.lng)
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        errors.lng = 'قيمة خط الطول يجب أن تكون بين -180 و 180'
      }
    }

    if (!form.lat.trim()) {
      errors.lat = 'خط العرض مطلوب'
    } else if (!DECIMAL_REGEX.test(form.lat.trim())) {
      errors.lat = 'خط العرض يجب أن يكون رقمًا فقط ويقبل الكسور العشرية'
    } else {
      const lat = Number(form.lat)
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        errors.lat = 'قيمة خط العرض يجب أن تكون بين -90 و 90'
      }
    }

    if (form.description.trim().length > DESCRIPTION_MAX_LENGTH) {
      errors.description = `وصف المكان يجب ألا يزيد عن ${DESCRIPTION_MAX_LENGTH} حرف`
    }

    if (form.statusText.trim().length > STATUS_TEXT_MAX_LENGTH) {
      errors.statusText = `حالة المكان يجب ألا تزيد عن ${STATUS_TEXT_MAX_LENGTH} حرف`
    }

    if (form.operator.trim()) {
      if (form.operator !== form.operator.trim()) {
        errors.operator = 'الجهة المشغلة يجب ألا تبدأ أو تنتهي بمسافة'
      } else if (form.operator.trim().length > OPERATOR_MAX_LENGTH) {
        errors.operator = `الجهة المشغلة يجب ألا تزيد عن ${OPERATOR_MAX_LENGTH} حرف`
      } else if (!OPERATOR_REGEX.test(form.operator.trim())) {
        errors.operator = 'الجهة المشغلة يجب أن تحتوي على حروف فقط'
      }
    }

    if (isShelter) {
      const hasCapacity = form.capacity.trim() !== ''
      const hasOccupancy = form.occupancy.trim() !== ''
      const hasAvailableBeds = form.availableBeds.trim() !== ''

      if (hasCapacity) {
        if (!INTEGER_REGEX.test(form.capacity.trim())) {
          errors.capacity = 'السعة يجب أن تكون رقمًا صحيحًا فقط'
        } else if (Number(form.capacity) > MAX_COUNT_VALUE) {
          errors.capacity = `السعة يجب ألا تزيد عن ${MAX_COUNT_VALUE}`
        }
      }

      if (hasOccupancy) {
        if (!INTEGER_REGEX.test(form.occupancy.trim())) {
          errors.occupancy = 'الإشغال يجب أن يكون رقمًا صحيحًا فقط'
        } else if (Number(form.occupancy) > MAX_COUNT_VALUE) {
          errors.occupancy = `الإشغال يجب ألا يزيد عن ${MAX_COUNT_VALUE}`
        }
      }

      if (hasAvailableBeds) {
        if (!INTEGER_REGEX.test(form.availableBeds.trim())) {
          errors.availableBeds = 'المتاح يجب أن يكون رقمًا صحيحًا فقط'
        } else if (Number(form.availableBeds) > MAX_COUNT_VALUE) {
          errors.availableBeds = `المتاح يجب ألا يزيد عن ${MAX_COUNT_VALUE}`
        }
      }

      const capacity = hasCapacity && INTEGER_REGEX.test(form.capacity.trim()) ? Number(form.capacity) : null
      const occupancy = hasOccupancy && INTEGER_REGEX.test(form.occupancy.trim()) ? Number(form.occupancy) : null
      const availableBeds =
        hasAvailableBeds && INTEGER_REGEX.test(form.availableBeds.trim()) ? Number(form.availableBeds) : null

      if (capacity !== null && occupancy !== null && occupancy > capacity) {
        errors.occupancy = 'الإشغال لا يمكن أن يكون أكبر من السعة'
      }

      if (capacity !== null && availableBeds !== null && availableBeds > capacity) {
        errors.availableBeds = 'المتاح لا يمكن أن يكون أكبر من السعة'
      }

      if (
        capacity !== null &&
        occupancy !== null &&
        availableBeds !== null &&
        occupancy + availableBeds > capacity
      ) {
        errors.availableBeds = 'مجموع الإشغال والمتاح لا يمكن أن يكون أكبر من السعة'
      }
    }

    return errors
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const validationErrors = validateForm()
    setFieldErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setError('يرجى تصحيح الحقول المطلوبة')
      setLoading(false)
      return
    }

    try {
      const payload = {
        name: normalizeSpaces(form.name.trim()),
        type: form.type,
        latitude: Number(form.lat),
        longitude: Number(form.lng),
        description: form.description.trim() ? normalizeSpaces(form.description.trim()) : null,
        operator: form.operator.trim() ? normalizeSpaces(form.operator.trim()) : null,
        capacity: isShelter && form.capacity ? Number(form.capacity) : null,
        occupancy: isShelter && form.occupancy ? Number(form.occupancy) : null,
        availableBeds: isShelter && form.availableBeds ? Number(form.availableBeds) : null,
        statusText: form.statusText.trim() ? normalizeSpaces(form.statusText.trim()) : null,
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

  const inputClassName = (hasError?: boolean) =>
    `h-10 w-full rounded-md border bg-white px-3 text-right text-sm outline-none transition sm:h-11 ${
      hasError
        ? 'border-red-400 focus:ring-2 focus:ring-red-500'
        : 'border-slate-200 focus:ring-2 focus:ring-blue-600'
    }`

  const textAreaClassName = (hasError?: boolean) =>
    `w-full rounded-md border bg-white px-3 py-3 text-right text-sm outline-none transition ${
      hasError
        ? 'border-red-400 focus:ring-2 focus:ring-red-500'
        : 'border-slate-200 focus:ring-2 focus:ring-blue-600'
    }`

  const hintClassName = 'text-[11px] text-slate-500 sm:text-xs'

  return (
    <div className="w-full py-4 sm:py-6 md:py-10">
      <div className="mx-auto w-full max-w-[800px] px-3 sm:px-4 md:px-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="px-1 text-center">
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">
              إضافة مكان جديد
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              من هنا يستطيع الأدمن إضافة مركز إيواء أو مستشفى أو نقطة ماء أو مركز دعم غذائي مع الإحداثيات.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5 md:p-6">
            <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5" dir="rtl" noValidate>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 sm:text-sm">
                  اسم المكان
                </label>
                <input
                  className={inputClassName(!!fieldErrors.name)}
                  placeholder="مثال: مدرسة الرمال"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  maxLength={NAME_MAX_LENGTH}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-600 sm:text-sm">{fieldErrors.name}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 sm:text-sm">
                  نوع المكان
                </label>
                <select
                  className={inputClassName(!!fieldErrors.type)}
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
                  className={`${textAreaClassName(!!fieldErrors.description)} min-h-[100px] sm:min-h-[110px]`}
                  placeholder="مثال: نقطة طبية متوفرة في المنطقة"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  maxLength={DESCRIPTION_MAX_LENGTH}
                />
                {fieldErrors.description && (
                  <p className="text-xs text-red-600 sm:text-sm">{fieldErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700 sm:text-sm">
                    خط الطول (lng)
                  </label>
                  <input
                    className={inputClassName(!!fieldErrors.lng)}
                    placeholder="34.4667"
                    value={form.lng}
                    onChange={(e) => updateField('lng', e.target.value)}
                    inputMode="decimal"
                    type="text"
                    dir="ltr"
                  />
                  <p className={hintClassName}>
                    يجب أن يكون رقمًا بين -180 و 180، ويقبل الكسور العشرية مثل 34.4667
                  </p>
                  {fieldErrors.lng && (
                    <p className="text-xs text-red-600 sm:text-sm">{fieldErrors.lng}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700 sm:text-sm">
                    خط العرض (lat)
                  </label>
                  <input
                    className={inputClassName(!!fieldErrors.lat)}
                    placeholder="31.5000"
                    value={form.lat}
                    onChange={(e) => updateField('lat', e.target.value)}
                    inputMode="decimal"
                    type="text"
                    dir="ltr"
                  />
                  <p className={hintClassName}>
                    يجب أن يكون رقمًا بين -90 و 90، ويقبل الكسور العشرية مثل 31.5000
                  </p>
                  {fieldErrors.lat && (
                    <p className="text-xs text-red-600 sm:text-sm">{fieldErrors.lat}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 sm:text-sm">
                  الجهة المشغلة
                </label>
                <input
                  className={inputClassName(!!fieldErrors.operator)}
                  placeholder="مثال: الأونروا"
                  value={form.operator}
                  onChange={(e) => updateField('operator', e.target.value)}
                  maxLength={OPERATOR_MAX_LENGTH}
                />
                {fieldErrors.operator && (
                  <p className="text-xs text-red-600 sm:text-sm">{fieldErrors.operator}</p>
                )}
              </div>

              {isShelter && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700 sm:text-sm">
                      السعة
                    </label>
                    <input
                      className={inputClassName(!!fieldErrors.capacity)}
                      placeholder="500"
                      value={form.capacity}
                      onChange={(e) => updateField('capacity', e.target.value)}
                      inputMode="numeric"
                      type="text"
                      dir="ltr"
                      min={0}
                      max={MAX_COUNT_VALUE}
                      step={1}
                    />
                    <p className={hintClassName}>
                      يجب أن تكون رقمًا صحيحًا فقط، بدون كسور أو حروف، ومن 0 إلى {MAX_COUNT_VALUE}
                    </p>
                    {fieldErrors.capacity && (
                      <p className="text-xs text-red-600 sm:text-sm">{fieldErrors.capacity}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700 sm:text-sm">
                      الإشغال
                    </label>
                    <input
                      className={inputClassName(!!fieldErrors.occupancy)}
                      placeholder="420"
                      value={form.occupancy}
                      onChange={(e) => updateField('occupancy', e.target.value)}
                      inputMode="numeric"
                      type="text"
                      dir="ltr"
                      min={0}
                      max={MAX_COUNT_VALUE}
                      step={1}
                    />
                    <p className={hintClassName}>
                      يجب أن يكون رقمًا صحيحًا فقط، ولا يمكن أن يكون أكبر من السعة
                    </p>
                    {fieldErrors.occupancy && (
                      <p className="text-xs text-red-600 sm:text-sm">{fieldErrors.occupancy}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700 sm:text-sm">
                      المتاح
                    </label>
                    <input
                      className={inputClassName(!!fieldErrors.availableBeds)}
                      placeholder="80"
                      value={form.availableBeds}
                      onChange={(e) => updateField('availableBeds', e.target.value)}
                      inputMode="numeric"
                      type="text"
                      dir="ltr"
                      min={0}
                      max={MAX_COUNT_VALUE}
                      step={1}
                    />
                    <p className={hintClassName}>
                      يجب أن يكون رقمًا صحيحًا فقط، ولا يمكن أن يكون أكبر من السعة
                    </p>
                    {fieldErrors.availableBeds && (
                      <p className="text-xs text-red-600 sm:text-sm">{fieldErrors.availableBeds}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 sm:text-sm">
                  حالة المكان
                </label>
                <textarea
                  className={`${textAreaClassName(!!fieldErrors.statusText)} min-h-[110px] sm:min-h-[120px]`}
                  placeholder="مثال: شاغر: 80 / السعة 500"
                  value={form.statusText}
                  onChange={(e) => updateField('statusText', e.target.value)}
                  maxLength={STATUS_TEXT_MAX_LENGTH}
                />
                {fieldErrors.statusText && (
                  <p className="text-xs text-red-600 sm:text-sm">{fieldErrors.statusText}</p>
                )}
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