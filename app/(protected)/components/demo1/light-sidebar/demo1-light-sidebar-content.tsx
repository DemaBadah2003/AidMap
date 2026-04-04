'use client';

// استيراد الـ Container لكي نتمكن من التحكم في العرض
import { Container } from '@/components/common/container';
import { DashboardWireframe } from './components/dashboard-wireframe';

export function Demo1LightSidebarContent() {
  return (
    /* استخدام width="fluid" يلغي الحد الأقصى للعرض (max-w-[1320px]).
       استخدام className="!p-0" يضمن إزالة أي هوامش جانبية داخلية (Padding) تسبب فراغاً أبيض.
    */
    <Container width="fluid" className="!p-0">
      <div className="flex flex-col gap-6 w-full">
        <DashboardWireframe />
      </div>
    </Container>
  );
}