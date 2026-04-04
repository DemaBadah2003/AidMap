'use client'
import { useEffect, useState } from 'react'

export default function MyAidPage() {
  const [nationalId, setNationalId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    // محاكاة جلب البيانات للتوضيح
    setTimeout(() => {
      setResult({ 
        found: true, 
        beneficiaryName: 'أحمد محمود علي', 
        status: 'pending', // يمكن أن تكون 'approved' أو 'rejected'
        address: 'غزة - الرمال - شارع الشهداء', 
        notes: 'يرجى إحضار الهوية الأصلية عند الاستلام وتجنب الازدحام.' 
      })
      setLoading(false)
    }, 500)
  }

  // دالة لتحديد نص ولون الحالة
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'قيد المراجعة', color: 'text-amber-600 bg-amber-50 border-amber-100' };
      case 'approved':
        return { text: 'تمت الموافقة', color: 'text-green-600 bg-green-50 border-green-100' };
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
                onChange={(e) => setNationalId(e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="أدخل رقم الهوية هنا..."
              />
            </div>
            <button className="h-12 rounded-xl bg-blue-600 px-10 font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95">
              {loading ? 'جارٍ الفحص...' : 'فحص الحالة'}
            </button>
          </form>
        </div>

        {/* كارد النتائج المعدل */}
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

              {/* حقل حالة الطلب - بجانب الاسم */}
              <div className="space-y-2">
                <span className="text-sm font-bold text-slate-400 mr-1">حالة الطلب</span>
                <div className={`flex h-12 items-center rounded-xl border px-4 font-bold ${getStatusDisplay(result.status).color}`}>
                  {getStatusDisplay(result.status).text}
                </div>
              </div>

              {/* حقل العنوان - يأخذ العرض كاملاً */}
              <div className="md:col-span-2 space-y-2">
                <span className="text-sm font-bold text-slate-400 mr-1">العنوان بالتفصيل</span>
                <div className="flex min-h-[48px] items-center rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 font-bold text-slate-700">
                  {result.address}
                </div>
              </div>

              {/* حقل الملاحظات - يأخذ العرض كاملاً */}
              <div className="md:col-span-2 space-y-2">
                <span className="text-sm font-bold text-slate-400 mr-1">ملاحظات إضافية من الإدارة</span>
                <div className="min-h-[120px] rounded-xl border border-slate-100 bg-slate-50 p-4 font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {result.notes}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* تذييل الصفحة للتأكد من وجود مساحة سفلية */}
        <div className="mt-12 text-center text-slate-400 text-sm">
          نظام الإغاثة الموحد - 2026
        </div>
      </div>
    </div>
  )
}