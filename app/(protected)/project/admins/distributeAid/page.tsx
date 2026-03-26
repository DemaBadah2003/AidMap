'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { requireAdmin } from '@/app/(protected)/project/helpers/route-guards'
import { Card, CardContent } from '../../../../../components/ui/card'
import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'

type DistributionStatus = 'SCHEDULED' | 'DONE' | 'CANCELED'
type AidType = 'غذائية' | 'مياه' | 'دواء' | 'ملابس' | 'مواد نظافة' | 'بطانيات'

const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

export default function DistributeAidPage() {
  const router = useRouter()

  useEffect(() => {
    requireAdmin(router)
  }, [router])

  const [beneficiaryName, setBeneficiaryName] = useState('')
  const [aidType, setAidType] = useState<AidType | ''>('')
  const [quantity, setQuantity] = useState<number>(0)
  const [distributionDate, setDistributionDate] = useState('')
  const [institutionId, setInstitutionId] = useState('')
  const [status, setStatus] = useState<DistributionStatus>('SCHEDULED')
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const resetForm = () => {
    setBeneficiaryName('')
    setAidType('')
    setQuantity(0)
    setDistributionDate('')
    setInstitutionId('')
    setStatus('SCHEDULED')
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSuccessMessage('')
    setErrorMessage('')

    if (
      !beneficiaryName.trim() ||
      !aidType ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !distributionDate.trim()
    ) {
      setErrorMessage('يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح')
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch('/api/project/distributeAid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beneficiaryName: beneficiaryName.trim(),
          aidType,
          institutionId: institutionId.trim() || null,
          quantity,
          distributionDate,
          status,
          notes: notes.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.message ||
            data.issues?.map((i: any) => i.message).join(' - ') ||
            'فشل في حفظ عملية التوزيع'
        )
      }

      setSuccessMessage('تم تسجيل توزيع المساعدة بنجاح')
      resetForm()
    } catch (error: any) {
      setErrorMessage(error.message || 'حدث خطأ غير متوقع')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full py-10" dir="rtl">
      <div className="mx-auto w-full max-w-[800px] space-y-6 px-4 sm:px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">إضافة توزيع مساعدة جديد</h1>
          <p className="text-sm text-slate-500">
            أدخل بيانات توزيع المساعدة ليتم إضافتها إلى النظام
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="p-5">
              <div className="mx-auto w-full max-w-[700px] space-y-5">
                {successMessage && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-right text-sm text-green-700">
                    {successMessage}
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-right text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 text-right">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">المستفيد</label>
                    <Input
                      type="text"
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                      placeholder="أدخل اسم المستفيد"
                      className="h-10 rounded-md border-slate-200 bg-white px-3 text-right text-sm shadow-none outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">نوع المساعدة</label>
                    <select
                      value={aidType}
                      onChange={(e) => setAidType(e.target.value as AidType | '')}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">اختر نوع المساعدة</option>
                      <option value="غذائية">غذائية</option>
                      <option value="مياه">مياه</option>
                      <option value="دواء">دواء</option>
                      <option value="ملابس">ملابس</option>
                      <option value="مواد نظافة">مواد نظافة</option>
                      <option value="بطانيات">بطانيات</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">الكمية</label>
                    <Input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      type="text"
                      value={quantity ? String(quantity) : ''}
                      onChange={(e) => setQuantity(toIntOnly(e.target.value))}
                      placeholder="مثال: 2"
                      className="h-10 rounded-md border-slate-200 bg-white px-3 text-right text-sm shadow-none outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">تاريخ التوزيع</label>
                    <Input
                      type="date"
                      value={distributionDate}
                      onChange={(e) => setDistributionDate(e.target.value)}
                      className="h-10 rounded-md border-slate-200 bg-white px-3 text-right text-sm shadow-none outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">الجهة الموزعة</label>
                    <Input
                      type="text"
                      value={institutionId}
                      onChange={(e) => setInstitutionId(e.target.value)}
                      placeholder="مثال: الهلال الأحمر"
                      className="h-10 rounded-md border-slate-200 bg-white px-3 text-right text-sm shadow-none outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">حالة التوزيع</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as DistributionStatus)}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="SCHEDULED">مجدول</option>
                      <option value="DONE">تم</option>
                      <option value="CANCELED">ملغي</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">ملاحظات</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="أي ملاحظات إضافية"
                      rows={5}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-right text-sm outline-none transition focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button
                      type="submit"
                      disabled={
                        submitting ||
                        !beneficiaryName.trim() ||
                        !aidType ||
                        !Number.isInteger(quantity) ||
                        quantity <= 0 ||
                        !distributionDate.trim()
                      }
                      className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submitting ? 'جاري الحفظ...' : 'حفظ التوزيع'}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}