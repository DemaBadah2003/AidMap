'use client'
import { useState } from 'react'

export default function MyAidPage() {
  const [nationalId, setNationalId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    // التحقق من طول رقم الهوية قبل الإرسال
    if (nationalId.length !== 9) {
      setError('يرجى إدخال رقم هوية صحيح (9 أرقام)')
      setLoading(false)
      return
    }

    try {
      // جلب البيانات من الـ API الحقيقي
      const res = await fetch(`/api/project/admins/addAid?nationalId=${nationalId}`)
      const data = await res.json()

      if (data.found) {
        setResult(data)
      } else {
        setError(data.message || 'رقم الهوية غير موجود في السجلات')
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالسيرفر')
    } finally {
      setLoading(false)
    }
  }

  // دالة لتحديد نص ولون الحالة
  const getStatusDisplay = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'approved':
        return { text: 'تمت الموافقة', color: 'text-green-600 bg-green-50 border-green-100' };
      case 'pending':
        return { text: 'قيد المراجعة', color: 'text-amber-600 bg-amber-50 border-amber-100' };
      case 'rejected':
        return { text: 'مرفوض', color: 'text-red-600 bg-red-50 border-red-100' };
      case 'no_request':
        return { text: 'لا يوجد طلب مقدم', color: 'text-slate-500 bg-slate-50 border-slate-200' };
      default:
        return { text: 'تحت الفحص', color: 'text-slate-600 bg-slate-50 border-slate-100' };
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 pb-32" dir="rtl">
      <div className="mx-auto max-w-4xl px-4 py-12">
        
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">مساعدتي</h1>
          <p className="mt-2 text-slate-500">تأكد من حالة طلبك وتفاصيل المساعدة من خلال رقم الهوية</p>
        </div>

        {/* كارد البحث */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-bold text-slate-700 mr-1">رقم الهوية</label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                maxLength={9}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-left"
                placeholder="000000000"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-blue-600 px-10 font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'جارٍ الفحص...' : 'فحص الحالة'}
            </button>
          </form>

          {error && (
            <div className="mt-4 text-sm text-red-600 font-bold mr-2">
              {error}
            </div>
          )}
        </div>

        {/* كارد النتائج الحقيقي */}
        {result && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md md:p-10 animate-in fade-in zoom-in duration-300">
            <h2 className="mb-8 text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">تفاصيل النتيجة</h2>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              
              {/* حقل اسم المستفيد */}
              <div className="space-y-2">
                <span className="text-sm font-bold text-slate-400 mr-1">اسم المستفيد</span>
                <div className="flex h-12 items-center rounded-xl border border-slate-100 bg-slate-50 px-4 font-bold text-slate-700">
                  {result.beneficiaryName}
                </div>
              </div>

              {/* حقل حالة الطلب */}
              <div className="space-y-2">
                <span className="text-sm font-bold text-slate-400 mr-1">حالة الطلب</span>
                <div className={`flex h-12 items-center rounded-xl border px-4 font-bold ${getStatusDisplay(result.status).color}`}>
                  {getStatusDisplay(result.status).text}
                </div>
              </div>

              {/* حقل العنوان */}
              <div className="md:col-span-2 space-y-2">
                <span className="text-sm font-bold text-slate-400 mr-1">العنوان بالتفصيل</span>
                <div className="flex min-h-[48px] items-center rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 font-bold text-slate-700">
                  {result.address}
                </div>
              </div>

              {/* حقل الملاحظات */}
              <div className="md:col-span-2 space-y-2">
                <span className="text-sm font-bold text-slate-400 mr-1">ملاحظات إضافية من الإدارة</span>
                <div className="min-h-[120px] rounded-xl border border-slate-100 bg-slate-50 p-4 font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {result.notes}
                </div>
              </div>

            </div>
          </div>
        )}

        <div className="mt-12 text-center text-slate-400 text-sm">
          نظام الإغاثة الموحد - 2026
        </div>
      </div>
    </div>
  )
}