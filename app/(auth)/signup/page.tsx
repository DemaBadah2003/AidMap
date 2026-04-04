'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, LoaderCircleIcon } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { apiFetch } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/common/icons';
import { getSignupSchema, SignupSchemaType } from '../forms/signup-schema';

export default function Page() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordConfirmationVisible, setPasswordConfirmationVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignupSchemaType>({
    resolver: zodResolver(getSignupSchema()),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      accept: false,
    },
  });

  async function onSubmit(values: SignupSchemaType) {
    try {
      setIsProcessing(true);
      setError(null);
      const response = await apiFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'حدث خطأ أثناء إنشاء الحساب');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">جاري التحميل...</div>}>
      {/* الحاوية الرئيسية للتمركز ومنع السكرول */}
      <div className="fixed inset-0 flex items-center justify-center bg-[#f8fafc] p-4 overflow-hidden" dir="rtl">
        
        {/* الكارد الموحد */}
        <div className="w-full max-w-[450px] bg-white rounded-3xl border border-gray-100 shadow-2xl p-8 md:p-10">
          
          {/* النصوص الجديدة لنظام الإغاثة */}
          <div className="text-center mb-8 space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">إنشاء حساب جديد</h1>
            <p className="text-sm text-gray-500">أدخل بياناتك للانضمام إلى نظام الإغاثة</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* تسجيل الدخول عبر جوجل */}
              <Button
                variant="outline"
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="h-12 w-full border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-3 rounded-xl transition-all"
              >
                <Icons.googleColorful className="size-5" />
                <span className="text-sm font-semibold text-gray-700">التسجيل بواسطة Google</span>
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-3 text-gray-400 font-medium">أو عبر البريد</span>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="py-2 animate-in fade-in zoom-in duration-300">
                  <AlertDescription className="text-xs text-center">{error}</AlertDescription>
                </Alert>
              )}

              {/* حقول الإدخال */}
              <div className="space-y-3">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-bold text-gray-600">الاسم الكامل</FormLabel>
                    <FormControl><Input placeholder="أدخل اسمك الثلاثي" className="h-11 rounded-lg" {...field} /></FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-bold text-gray-600">البريد الإلكتروني</FormLabel>
                    <FormControl><Input placeholder="example@relief.org" className="h-11 rounded-lg" {...field} /></FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />

                {/* حقل كلمة المرور */}
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-bold text-gray-600">كلمة المرور</FormLabel>
                    <div className="relative">
                      <Input type={passwordVisible ? 'text' : 'password'} placeholder="••••••••" className="h-11 rounded-lg pe-10" {...field} />
                      <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />

                {/* حقل تأكيد كلمة المرور - الآن أصبح تحت حقل كلمة المرور مباشرة */}
                <FormField control={form.control} name="passwordConfirmation" render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-bold text-gray-600">تأكيد كلمة المرور</FormLabel>
                    <div className="relative">
                      <Input type={passwordConfirmationVisible ? 'text' : 'password'} placeholder="أعد كتابة كلمة المرور" className="h-11 rounded-lg pe-10" {...field} />
                      <button type="button" onClick={() => setPasswordConfirmationVisible(!passwordConfirmationVisible)} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {passwordConfirmationVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )} />
              </div>

              {/* زر الموافقة والشروط */}
              <FormField
                control={form.control}
                name="accept"
                render={({ field }) => (
                  <FormItem className="pt-1">
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox id="terms" checked={field.value} onCheckedChange={field.onChange} className="rounded-md border-gray-300" />
                      </FormControl>
                      <label htmlFor="terms" className="text-xs text-gray-600 cursor-pointer select-none font-medium">
                        أوافق على <Link href="#" className="text-blue-600 font-bold hover:underline">سياسة الخصوصية</Link> لنظام الإغاثة.
                      </label>
                    </div>
                    <FormMessage className="text-[10px] mr-7" />
                  </FormItem>
                )}
              />

              {/* زر الإرسال */}
              <Button 
                type="submit" 
                disabled={isProcessing} 
                className="h-12 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    <span>جاري الإنشاء...</span>
                  </div>
                ) : 'إنشاء الحساب'}
              </Button>

              <p className="text-center text-sm text-gray-500 pt-2">
                لديك حساب بالفعل؟ <Link href="/signin" className="text-blue-600 font-bold hover:underline">تسجيل الدخول</Link>
              </p>
            </form>
          </Form>
        </div>
      </div>
    </Suspense>
  );
}