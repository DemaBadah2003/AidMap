// صفحة الاستدعاء (مثلاً في صفحة أخرى داخل المشروع)
'use client'

// استيراد المكون باستخدام المسار الذي ظهر في الصورة
import MyAidSearch from '@/app/(public)/users/myAid/page'

export default function DashboardPage() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-8 text-slate-800 border-r-4 border-blue-600 pr-4">
        لوحة التحكم - الاستعلام عن المساعدات
      </h1>

      {/* استدعاء المكون الأصلي هنا */}
      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <MyAidSearch />
      </section>

      <div className="mt-6 text-xs text-slate-400 text-center">
        تم استدعاء المكون من مسار: (public)/users/myAid
      </div>
    </div>
  )
}