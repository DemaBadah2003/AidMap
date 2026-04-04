import type { ReactNode } from 'react';
import Link from 'next/link';

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      dir="rtl"
      /* التعديل: استخدام min-h-screen بدلاً من h-full وإزالة overflow-hidden */
      className="flex min-h-screen w-full flex-col bg-slate-100 text-slate-800 m-0 p-0"
    >
      <header className="sticky top-0 z-50 h-16 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <span className="font-bold">R</span>
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-extrabold text-slate-900 sm:text-base">
                Relief System
              </h1>
              <p className="text-[11px] text-slate-500">
                واجهة المواطن والخدمات
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium lg:flex">
            <Link href="/" className="text-slate-600 hover:text-blue-600">الرئيسية</Link>
            <Link href="/users/MapPreview" className="text-slate-600 hover:text-blue-600">الخريطة</Link>
            <Link href="/users/RegisterBeneficiary" className="text-slate-600 hover:text-blue-600">تسجيل مستفيد</Link>
            <Link href="/users/requestAid" className="text-slate-600 hover:text-blue-600">طلب مساعدة</Link>
            <Link href="/users/myAid" className="text-slate-600 hover:text-blue-600">مساعداتي</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/signin" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">تسجيل الدخول</Link>
            <Link href="/signup" className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">إنشاء حساب</Link>
          </div>
        </div>
      </header>

      {/* التعديل: إزالة overflow-hidden و h-full من الـ main */}
      <main className="flex-1 w-full">
        <div className="w-full m-0 p-0">
          {children}
        </div>
      </main>
    </div>
  );
}