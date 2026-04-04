import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';


export function BrandedLayout({ children }: { children: ReactNode }) {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-background px-4 py-8"
    >
      <Card className="w-full max-w-[420px] shadow-sm">
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
    
  );
}