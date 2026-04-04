'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saved:', formData);
    alert('تم تحديث كلمة المرور بنجاح');
  };

  return (
    <div className="w-full py-10" dir="rtl">
      <div className="mx-auto w-full max-w-[800px] px-6 space-y-6">
        
        {/* العنوان */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#181c32]">
            تغيير كلمة المرور
          </h1>
          <p className="text-sm text-muted-foreground">
            تحديث كلمة مرور حسابك
          </p>
        </div>

        {/* بطاقة النموذج */}
        <form
          onSubmit={handleSave}
          className="rounded-2xl border bg-background p-5 shadow-sm"
        >
          <h3 className="mb-4 font-semibold text-right">الأمان</h3>

          <div className="space-y-4 text-sm text-right">
            {/* كلمة المرور الحالية */}
            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground">
                كلمة المرور الحالية
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="أدخل كلمة المرور الحالية"
                className="h-9 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary text-right"
              />
            </div>

            {/* كلمة المرور الجديدة */}
            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground">
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="أدخل كلمة المرور الجديدة"
                className="h-9 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary text-right"
              />
            </div>

            {/* تأكيد كلمة المرور */}
            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground">
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="تأكيد كلمة المرور الجديدة"
                className="h-9 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary text-right"
              />
            </div>

            {/* الأزرار */}
            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/profile-page"
                className="h-9 rounded-md border px-4 text-xs font-medium hover:bg-muted flex items-center justify-center"
              >
                إلغاء
              </Link>

              <button
                type="submit"
                className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-white hover:opacity-90 flex items-center justify-center"
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}