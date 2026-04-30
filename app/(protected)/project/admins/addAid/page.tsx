'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { requireCitizen } from '@/app/(protected)/project/helpers/route-guards'

// ... (نفس الـ Type والـ Regex الموجود في كودك) ...

export default function MyAidPage() {
  const router = useRouter()
  const [nationalId, setNationalId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<AidResult | null>(null)

  useEffect(() => {
    // تم تعطيل التحقق من الصلاحية مؤقتاً بناءً على طلبك
    // requireCitizen(router)
  }, [router])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setResult(null) // تصفير النتائج السابقة قبل البحث الجديد

    if (!/^\d{9}$/.test(nationalId)) {
      setMessage('يرجى إدخال رقم هوية صحيح (9 أرقام)')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/project/admins/addAid?nationalId=${nationalId}`)
      const data = await res.json()

      if (data.found) {
        setResult(data)
      } else {
        setMessage(data.message || 'رقم الهوية غير موجود في النظام')
      }
    } catch {
      setMessage('تعذر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  // ... (getStatusClasses و getStatusText تبقى كما هي في كودك) ...

  return (
    <div className="w-full py-10" dir="rtl">
      <div className="mx-auto w-full max-w-[800px] px-4 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">مساعدتي</h1>
          <p className="text-sm text-slate-500">تحقق من حالة طلب المساعدة الخاص بك</p>
        </div>

        {/* كرت البحث */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form onSubmit={handleSearch} className="flex gap-3 items-end">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-medium text-slate-700">رقم الهوية</label>
              <input
                type="text"
                placeholder="أدخل رقم الهوية هنا..."
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-10 rounded-md bg-blue-600 px-6 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'جارٍ الفحص...' : 'فحص الحالة'}
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {message}
            </div>
          )}
        </div>

        {/* كرت النتيجة - يظهر فقط عند وجود بيانات */}
        {result && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <h2 className="text-base font-semibold text-slate-900 border-b pb-3">تفاصيل النتيجة</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">اسم المستفيد</label>
                <div className="h-10 flex items-center px-3 rounded-md bg-slate-50 border border-slate-100 text-sm">
                  {result.beneficiaryName}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">حالة الطلب</label>
                <div className={`h-10 flex items-center px-3 rounded-md border text-sm font-medium ${getStatusClasses(result.status)}`}>
                  {getStatusText(result.status)}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500">العنوان بالتفصيل</label>
              <div className="h-10 flex items-center px-3 rounded-md bg-slate-50 border border-slate-100 text-sm">
                {result.address}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500">ملاحظات إضافية من الإدارة</label>
              <div className="p-3 rounded-md bg-slate-50 border border-slate-100 text-sm min-h-[80px]">
                {result.notes || "لا توجد ملاحظات حالياً"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}