'use client';

import { useEffect, useState } from 'react';
import { Mail, User, Lock } from 'lucide-react';
import Link from 'next/link';

type UserProfile = {
  name: string;
  email: string;
  image?: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (!res.ok) throw new Error('Failed to fetch profile');

        const data = await res.json();
        setUser(data);

        setForm({
          name: data.name,
          email: data.email,
          password: '',
        });
      } catch (error) {
        console.error(error);

        const fallback = {
          name: 'أحمد',
          email: 'ahmed4@gmail.com',
          image: '/media/avatars/300-2.png',
        };

        setUser(fallback);
        setForm({
          name: fallback.name,
          email: fallback.email,
          password: '',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
        headers: { 'Content-Type': 'application/json' },
      });

      alert('تم تحديث الملف الشخصي بنجاح');
    } catch (error) {
      console.error(error);
      alert('خطأ في تحديث الملف الشخصي');
    }
  };

  if (loading) {
    return (
      <div className="w-full py-10" dir="rtl">
        <div className="mx-auto max-w-[800px] px-6 text-right">
          <p className="text-sm text-muted-foreground">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full py-10" dir="rtl">
        <div className="mx-auto max-w-[800px] px-6 text-right">
          <p className="text-sm text-red-500">تعذر تحميل الملف الشخصي.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-10" dir="rtl">
      <div className="mx-auto w-full max-w-[800px] px-6 space-y-6">
        
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">ملفي الشخصي</h1>
          <p className="text-sm text-muted-foreground">
            عرض معلومات حسابك.
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            
            <img
              src={user.image || '/media/avatars/300-2.png'}
              alt={user.name}
              className="mx-auto h-24 w-24 rounded-full border object-cover md:mx-0"
            />

            <div className="flex-1 text-center md:text-right">
              <h2 className="text-xl font-semibold">{user.name}</h2>

              <div className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground md:justify-start">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            </div>

            {/* الأزرار */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/profile-page/edit"
                className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted text-center"
              >
                تعديل الملف الشخصي
              </Link>

              <Link
                href="/profile-page/security/change-password"
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 text-center"
              >
                تغيير كلمة المرور
              </Link>
            </div>
          </div>
        </div>

        {/* Account Info (Editable) */}
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-right">
            <User className="h-5 w-5" />
            <h3 className="font-semibold">معلومات الحساب</h3>
          </div>

          <div className="space-y-4 text-sm text-right">

            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground">الاسم الكامل</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary text-right"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground">البريد الإلكتروني</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary text-right"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-muted-foreground flex items-center gap-1">
                <Lock className="h-4 w-4" />
                كلمة المرور
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="أدخل كلمة مرور جديدة"
                className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary text-right"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                onClick={handleSave}
                className="w-full sm:w-auto rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:opacity-90"
              >
                حفظ التغييرات
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}