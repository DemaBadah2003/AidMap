'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { requireAdmin } from '@/app/(protected)/project/helpers/route-guards'
import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'

type FormData = {
  aidType: string
  aidName: string
  notes: string
  quantity: string
  dateReceived: string
  donor: string
  status: string
}

type FormErrors = {
  aidType?: string
  aidName?: string
  notes?: string
  quantity?: string
  dateReceived?: string
  donor?: string
  status?: string
  general?: string
}

const quantityRegex = /^\d+$/

const aidOptionsMap: Record<string, string[]> = {
  غذائية: ['سلة غذائية', 'طرد غذائي', 'دقيق', 'أرز', 'معلبات'],
  مياه: ['صندوق مياه', 'جالون مياه', 'عبوات مياه'],
  دواء: ['حقيبة إسعافات أولية', 'أدوية مزمنة', 'أدوية أطفال'],
  ملابس: ['ملابس شتوية', 'ملابس أطفال', 'أحذية'],
  'مواد نظافة': ['حقيبة نظافة', 'صابون', 'شامبو', 'مناديل'],
  بطانيات: ['بطانية شتوية', 'فرشة', 'وسادة'],
}

const aidTypeOptions = Object.keys(aidOptionsMap)

const statusOptions = [
  'Available',
  'Partially Distributed',
  'Fully Distributed',
]

export default function AddAidPage() {
  const router = useRouter()

  useEffect(() => {
    requireAdmin(router)
  }, [router])

  const [form, setForm] = useState<FormData>({
    aidType: '',
    aidName: '',
    notes: '',
    quantity: '',
    dateReceived: '',
    donor: '',
    status: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const availableAidNames = form.aidType ? aidOptionsMap[form.aidType] || [] : []

  const validateField = (name: keyof FormData, value: string) => {
    switch (name) {
      case 'aidType':
        if (!value) return 'نوع المساعدة مطلوب'
        return ''

      case 'aidName':
        if (!value) return 'اسم المساعدة مطلوب'
        return ''

      case 'quantity':
        if (!value) return 'الكمية مطلوبة'
        if (!quantityRegex.test(value)) return 'الكمية يجب أن تحتوي على أرقام فقط'
        if (Number(value) <= 0) return 'الكمية يجب أن تكون أكبر من صفر'
        return ''

      case 'dateReceived':
        if (!value) return 'تاريخ الإضافة أو الاستلام مطلوب'
        return ''

      case 'status':
        if (!value) return 'حالة المساعدة مطلوبة'
        return ''

      case 'donor':
      case 'notes':
        return ''

      default:
        return ''
    }
  }

  const validateForm = () => {
    const newErrors: FormErrors = {
      aidType: validateField('aidType', form.aidType),
      aidName: validateField('aidName', form.aidName),
      notes: validateField('notes', form.notes),
      quantity: validateField('quantity', form.quantity),
      dateReceived: validateField('dateReceived', form.dateReceived),
      donor: validateField('donor', form.donor),
      status: validateField('status', form.status),
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(Boolean)
  }

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    let nextValue = value

    if (name === 'quantity') {
      nextValue = value.replace(/\D/g, '')
    }

    if (name === 'aidType') {
      setForm((prev) => ({
        ...prev,
        aidType: value,
        aidName: '',
      }))

      setErrors((prev) => ({
        ...prev,
        aidType: validateField('aidType', value),
        aidName: '',
        general: '',
      }))

      setErrorMsg('')
      setSuccessMsg('')
      return
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
      const res = await fetch('/api/project/aids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aidType: form.aidType,
          aidName: form.aidName,
          notes: form.notes,
          quantity: Number(form.quantity),
          dateReceived: form.dateReceived,
          donor: form.donor || null,
          status: form.status,
        }),
      })

      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await res.json()
        : null

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في إضافة المساعدة')
      }

      setSuccessMsg('تمت إضافة المساعدة بنجاح')
      setForm({
        aidType: '',
        aidName: '',
        notes: '',
        quantity: '',
        dateReceived: '',
        donor: '',
        status: '',
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
          <div className="text-2xl font-semibold text-foreground">Add Aid</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Add Aid</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px]">
        <Card>
          <CardContent className="p-0">
            <div className="border-b px-4 py-4">
              <div className="text-lg font-semibold text-right">إضافة مساعدة جديدة</div>
              <div className="mt-1 text-sm text-muted-foreground text-right">
                أدخل بيانات المساعدة ليتم إضافتها إلى النظام
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div dir="rtl" className="grid grid-cols-1 gap-4 max-w-[700px] ms-auto">
                <div className="grid gap-2">
                  <div className="text-sm">نوع المساعدة</div>
                  <select
                    name="aidType"
                    value={form.aidType}
                    onChange={onChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">اختر نوع المساعدة</option>
                    {aidTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.aidType && (
                    <div className="text-sm text-red-600 text-right">{errors.aidType}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-sm">اسم المساعدة</div>
                  <select
                    name="aidName"
                    value={form.aidName}
                    onChange={onChange}
                    disabled={!form.aidType}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {form.aidType ? 'اختر اسم المساعدة' : 'اختر نوع المساعدة أولاً'}
                    </option>
                    {availableAidNames.map((aidName) => (
                      <option key={aidName} value={aidName}>
                        {aidName}
                      </option>
                    ))}
                  </select>
                  {errors.aidName && (
                    <div className="text-sm text-red-600 text-right">{errors.aidName}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-sm">الكمية</div>
                  <Input
                    name="quantity"
                    type="text"
                    value={form.quantity}
                    onChange={onChange}
                    placeholder="مثال: 50"
                    className="h-10"
                    autoComplete="off"
                    inputMode="numeric"
                  />
                  {errors.quantity && (
                    <div className="text-sm text-red-600 text-right">{errors.quantity}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-sm">تاريخ الإضافة أو الاستلام</div>
                  <Input
                    name="dateReceived"
                    type="date"
                    value={form.dateReceived}
                    onChange={onChange}
                    className="h-10"
                  />
                  {errors.dateReceived && (
                    <div className="text-sm text-red-600 text-right">{errors.dateReceived}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-sm">الجهة المانحة</div>
                  <Input
                    name="donor"
                    value={form.donor}
                    onChange={onChange}
                    placeholder="مثال: الهلال الأحمر"
                    className="h-10"
                    autoComplete="off"
                  />
                  {errors.donor && (
                    <div className="text-sm text-red-600 text-right">{errors.donor}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-sm">حالة المساعدة</div>
                  <select
                    name="status"
                    value={form.status}
                    onChange={onChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">اختر حالة المساعدة</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <div className="text-sm text-red-600 text-right">{errors.status}</div>
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-sm">ملاحظات</div>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={onChange}
                    placeholder="أي ملاحظات إضافية"
                    className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  {errors.notes && (
                    <div className="text-sm text-red-600 text-right">{errors.notes}</div>
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
                  {loading ? 'جاري الإضافة...' : 'إضافة المساعدة'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}