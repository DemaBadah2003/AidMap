'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ScreenLoader } from '@/components/common/screen-loader';
import { Demo1Layout } from '../components/layouts/demo1/layout';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <ScreenLoader />;
  }

  return session ? (
    <Demo1Layout>
      {/* التعديل الجذري هنا: 
          استخدمنا lg:pr-[285px] (Padding Right) لضمان دفع المحتوى بعيداً عن السايدبار الأيمن.
          أضفنا w-full لضمان استغلال المساحة المتبقية.
      */}
      <main className="w-full min-h-screen bg-[#f9fafb] lg:pr-[285px] transition-all duration-300">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </Demo1Layout>
  ) : null;
}