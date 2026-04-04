'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiErrorWarningFill } from '@remixicon/react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
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
import { LoaderCircleIcon } from 'lucide-react';
import { Icons } from '@/components/common/icons';
import { getSigninSchema, SigninSchemaType } from '../forms/signin-schema';

// ✅ استيراد مساعد حفظ بيانات المستخدم
import { saveCurrentUser } from '@/app/api/project/helpers/helpers';

export default function Page() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SigninSchemaType>({
    resolver: zodResolver(getSigninSchema()),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  async function onSubmit(values: SigninSchemaType) {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      });

      if (response?.error) {
        try {
            const errorData = JSON.parse(response.error);
            setError(errorData.message);
        } catch {
            setError('خطأ في البريد الإلكتروني أو كلمة المرور');
        }
      } else {
        const session = await fetch('/api/auth/session').then((r) => r.json());

        let role: 'admin' | 'user' = 'user';
        if (session?.user?.roleId === '8bec7f4f-e5a1-42d3-b001-8bbd5059fffd') {
          role = 'admin';
        }

        saveCurrentUser({
          id: session.user.id,
          email: session.user.email,
          role,
        });

        router.push('/dashboard');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="block w-full space-y-5"
        dir="rtl"
      >
        {/* العنوان باللون الأسود */}
        <div className="space-y-1.5 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-center text-black">
            نظام الإغاثة
          </h1>
        </div>

        <Alert size="sm" close={false}>
          <AlertIcon>
            <RiErrorWarningFill className="text-primary" />
          </AlertIcon>
          <AlertTitle className="text-accent-foreground text-right">
            استخدم البريد <span className="text-mono font-semibold">demo@kt.com</span>{' '}
            وكلمة المرور{' '}
            <span className="text-mono font-semibold">demo123</span> للدخول التجريبي.
          </AlertTitle>
        </Alert>

        <div className="flex flex-col gap-3.5">
          <Button
            variant="outline"
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/' })}
          >
            <Icons.googleColorful className="ml-2 size-5! opacity-100!" /> تسجيل الدخول بواسطة Google
          </Button>
        </div>

        <div className="relative py-1.5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">أو من خلال</span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle className="text-right">{error}</AlertTitle>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="text-right">
              <FormLabel>البريد الإلكتروني</FormLabel>
              <FormControl>
                <Input placeholder="أدخل بريدك الإلكتروني" {...field} className="text-right" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="text-right">
              <div className="flex justify-between items-center gap-2.5">
                <FormLabel>كلمة المرور</FormLabel>
                <Link
                  href="/reset-password"
                  className="text-sm font-semibold text-foreground hover:text-primary"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <Input
                  placeholder="أدخل كلمة المرور"
                  type={passwordVisible ? 'text' : 'password'}
                  {...field}
                  className="text-right pl-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  mode="icon"
                  size="sm"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-7 ms-1.5 bg-transparent!"
                >
                  {passwordVisible ? (
                    <EyeOff className="text-muted-foreground" />
                  ) : (
                    <Eye className="text-muted-foreground" />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center space-x-2 space-x-reverse justify-start">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <>
                <Checkbox
                  id="remember-me"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm leading-none text-muted-foreground mr-2"
                >
                  تذكرني على هذا الجهاز
                </label>
              </>
            )}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <Button type="submit" disabled={isProcessing} className="w-full">
            {isProcessing ? (
              <LoaderCircleIcon className="ml-2 size-4 animate-spin" />
            ) : null}
            تسجيل الدخول
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          ليس لديك حساب؟{' '}
          <Link
            href="/signup"
            className="text-sm font-semibold text-foreground hover:text-primary"
          >
            إنشاء حساب جديد
          </Link>
        </p>
      </form>
    </Form>
  );
}