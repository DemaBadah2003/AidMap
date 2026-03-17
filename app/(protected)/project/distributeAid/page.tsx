'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { requireAdmin } from '@/app/(protected)/project/helpers/route-guards'
import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'

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
    <div className="w-full px-3 py-6 sm:px-6" dir="rtl">
      <div className="mb-6" dir="ltr">
        <div className="text-left">
          <div className="text-2xl font-semibold text-foreground">Distribute Aid</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Distribute Aid Form</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px]">
        <Card className="overflow-hidden border border-slate-200 shadow-none">
          <CardContent className="p-0">
            <div className="border-b bg-white px-6 py-5 text-right">
              <h2 className="text-xl font-semibold text-foreground">إضافة توزيع مساعدة جديد</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                أدخل بيانات توزيع المساعدة ليتم إضافتها إلى النظام
              </p>
            </div>

            <div className="bg-white px-6 py-6">
              {successMessage && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 text-right">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">المستفيد</label>
                  <Input
                    type="text"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    placeholder="أدخل اسم المستفيد"
                    className="h-12 rounded-md border-slate-200 text-right shadow-none"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">نوع المساعدة</label>
                  <select
                    value={aidType}
                    onChange={(e) => setAidType(e.target.value as AidType | '')}
                    className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:ring-2 focus:ring-slate-200"
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

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">الكمية</label>
                  <Input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    type="text"
                    value={quantity ? String(quantity) : ''}
                    onChange={(e) => setQuantity(toIntOnly(e.target.value))}
                    placeholder="مثال: 2"
                    className="h-12 rounded-md border-slate-200 text-right shadow-none"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">تاريخ التوزيع</label>
                  <Input
                    type="date"
                    value={distributionDate}
                    onChange={(e) => setDistributionDate(e.target.value)}
                    className="h-12 rounded-md border-slate-200 text-right shadow-none"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">الجهة الموزعة</label>
                  <Input
                    type="text"
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value)}
                    placeholder="مثال: الهلال الأحمر"
                    className="h-12 rounded-md border-slate-200 text-right shadow-none"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">حالة التوزيع</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DistributionStatus)}
                    className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="SCHEDULED">مجدول</option>
                    <option value="DONE">تم</option>
                    <option value="CANCELED">ملغي</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">ملاحظات</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أي ملاحظات إضافية"
                    rows={5}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-right text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="flex justify-end pt-2" dir="ltr">
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
                    className="h-10 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-600 disabled:text-white disabled:opacity-100"
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
  )
}