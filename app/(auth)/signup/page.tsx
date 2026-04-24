'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, LoaderCircleIcon, CheckCircle2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
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
  const [statusInfo, setStatusInfo] = useState<{ type: 'error' | 'success', message: string } | null>(null);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const isValid = await form.trigger();
    if (!isValid) return;

    try {
      const values = form.getValues();
      setIsProcessing(true);
      setStatusInfo(null);

      // استخدام fetch مباشر لضمان عدم وجود undefined في الرابط
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatusInfo({ type: 'error', message: data.message || 'فشل التسجيل' });
      } else {
        setStatusInfo({ type: 'success', message: data.message });
        // تأخير التوجيه قليلاً ليتمكن المستخدم من قراءة الرسالة
        setTimeout(() => router.push('/signin'), 3000);
      }
    } catch (err) {
      setStatusInfo({ type: 'error', message: 'تعذر الاتصال بالسيرفر. تأكد من اتصالك بالإنترنت.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50/50 p-4" dir="rtl">
        <div className="w-full max-w-[500px] rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
          
          <div className="mb-8 space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">إنشاء حساب جديد</h1>
            <p className="text-sm text-muted-foreground">أدخل بياناتك للانضمام إلى نظام الإغاثة</p>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <Button
                variant="outline"
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="h-12 w-full border-gray-200 shadow-sm hover:bg-gray-50"
              >
                <Icons.googleColorful className="size-5" />
                <span className="ms-2 font-medium">التسجيل بواسطة Google</span>
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-400">أو عبر البريد</span>
                </div>
              </div>

              {/* تنبيهات النجاح والفشل */}
              {statusInfo && (
                <Alert variant={statusInfo.type === 'error' ? "destructive" : "default"} className={statusInfo.type === 'success' ? "border-green-500 bg-green-50 text-green-700" : ""}>
                  {statusInfo.type === 'error' ? <AlertCircle className="size-4" /> : <CheckCircle2 className="size-4 text-green-600" />}
                  <AlertTitle>{statusInfo.type === 'error' ? 'تنبيه' : 'تم بنجاح'}</AlertTitle>
                  <AlertDescription>{statusInfo.message}</AlertDescription>
                </Alert>
              )}

              {/* حقول الإدخال */}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-semibold text-gray-700">الاسم الكامل</FormLabel>
                  <FormControl><Input placeholder="أحمد محمد" className="h-12" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-semibold text-gray-700">البريد الإلكتروني</FormLabel>
                  <FormControl><Input placeholder="ahmed@example.com" className="h-12" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-semibold text-gray-700">كلمة المرور</FormLabel>
                  <div className="relative">
                    <Input placeholder="••••••••" type={passwordVisible ? 'text' : 'password'} className="h-12 pe-12" {...field} />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute end-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:bg-transparent">
                      {passwordVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </Button>
                  </div>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="passwordConfirmation" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-semibold text-gray-700">تأكيد كلمة المرور</FormLabel>
                  <div className="relative">
                    <Input type={passwordConfirmationVisible ? 'text' : 'password'} placeholder="••••••••" className="h-12 pe-12" {...field} />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setPasswordConfirmationVisible(!passwordConfirmationVisible)} className="absolute end-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:bg-transparent">
                      {passwordConfirmationVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </Button>
                  </div>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField
                control={form.control}
                name="accept"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-3">
                      <FormControl>
                        <Checkbox
                          id="terms"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="size-5 border-gray-300"
                        />
                      </FormControl>
                      <label htmlFor="terms" className="cursor-pointer text-sm font-medium text-gray-600 select-none">
                        أوافق على <Link href="/privacy" className="font-bold text-blue-600 hover:underline">سياسة الخصوصية</Link> والشروط.
                      </label>
                    </div>
                    <FormMessage className="text-[10px] text-red-500" />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isProcessing} 
                  className="h-12 w-full bg-blue-600 font-bold text-white shadow-md hover:bg-blue-700 transition-all"
                >
                  {isProcessing ? <LoaderCircleIcon className="me-2 size-5 animate-spin" /> : "إنشاء الحساب"}
                </Button>
              </div>

              <p className="text-center text-sm text-gray-500">
                لديك حساب بالفعل؟ <Link href="/signin" className="font-bold text-blue-600 hover:underline">تسجيل الدخول</Link>
              </p>
            </form>
          </Form>
        </div>
      </div>
    </Suspense>
  );
}