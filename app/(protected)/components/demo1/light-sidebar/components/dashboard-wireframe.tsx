'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, MapPin, Search } from 'lucide-react';

const TopCards = () => {
  const items = [
    { title: 'أقرب مأوى', name: 'Al-Azhar Shelter', meta: 'يبعد 1.2 كم' },
    { title: 'توزيع غذاء وماء', name: 'Al-Rahfah Aid Center', meta: 'مفتوح - 09:00' },
    { title: 'المدارس المتاحة', name: 'Great Gaza Primary School', meta: 'سعة 120' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((it, idx) => (
        <Card key={idx}>
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="text-sm text-secondary-foreground">{it.title}</div>
            <div className="text-base font-semibold text-mono">{it.name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3.5" />
              {it.meta}
            </div>
            <Button className="mt-2" size="sm">
              عرض التفاصيل
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const MapPreview = () => {
  return (
    <Card className="h-full">
      <CardHeader className="py-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Map Preview</CardTitle>
          <Button variant="outline" size="sm">
            Open Full Map
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Placeholder للخريطة — استبدله لاحقاً بـ Leaflet/Google Map */}
        <div className="h-[260px] rounded-lg border bg-accent/40 flex items-center justify-center text-sm text-muted-foreground">
          Map Placeholder
        </div>

        {/* تنبيه صغير تحت الخريطة مثل الصورة */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border p-3">
          <AlertTriangle className="size-4 text-destructive mt-0.5" />
          <div className="text-sm">
            <div className="font-medium">تنبيه</div>
            <div className="text-muted-foreground">
              يرجى متابعة آخر التحديثات قبل التحرك.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AlertsList = () => {
  const alerts = [
    { title: 'تنبيه: ازدحام على نقطة توزيع', time: 'قبل 5 دقائق', level: 'high' },
    { title: 'ملاحظة: نقص مياه في حي X', time: 'قبل 30 دقيقة', level: 'medium' },
    { title: 'تحديث: فتح مأوى جديد', time: 'قبل ساعتين', level: 'low' },
  ];

  const levelBadge = (lvl: string) => {
    if (lvl === 'high') return <Badge variant="destructive">عاجل</Badge>;
    if (lvl === 'medium') return <Badge variant="secondary">متوسط</Badge>;
    return <Badge variant="outline">منخفض</Badge>;
  };

  return (
    <Card className="h-full">
      <CardHeader className="py-4">
        <CardTitle className="text-base">Alerts</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-3">
        {alerts.map((a, idx) => (
          <div key={idx} className="flex items-start justify-between gap-3 rounded-lg border p-3">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-mono">{a.title}</div>
              <div className="text-xs text-muted-foreground">{a.time}</div>
            </div>
            {levelBadge(a.level)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const RightSidebar = () => {
  return (
    <Card className="h-full">
      <CardHeader className="py-4">
        <CardTitle className="text-base">Sidebar</CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="relative mb-4">
          <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
          <Input className="ps-9" placeholder="بحث..." />
        </div>

        <ScrollArea className="h-[520px] pr-2">
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-sm font-semibold mb-2">Admins & Supervisors</div>
              <div className="text-sm text-muted-foreground">- admin1</div>
              <div className="text-sm text-muted-foreground">- supervisor1</div>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">Shelters</div>
              <div className="text-sm text-muted-foreground">- shelter_01</div>
              <div className="text-sm text-muted-foreground">- shelter_02</div>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">Contacts</div>
              <div className="text-sm text-muted-foreground">- contact_01</div>
              <div className="text-sm text-muted-foreground">- contact_02</div>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2">Dictionary</div>
              <div className="text-sm text-muted-foreground">- refugee</div>
              <div className="text-sm text-muted-foreground">- urgent</div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

const DashboardWireframe = () => {
  return (
    <div className="grid gap-6">
      {/* صف البطاقات العلوية */}
      <TopCards />

      {/* محتوى رئيسي + سايدبار يمين */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* العمود الرئيسي */}
        <div className="grid gap-6">
          <MapPreview />
          <AlertsList />
        </div>

        {/* السايدبار */}
        <RightSidebar />
      </div>
    </div>
  );
};

export { DashboardWireframe };
