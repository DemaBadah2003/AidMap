'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Button } from '../../../../../../components/ui/button';
import { Input } from '../../../../../../components/ui/input';
import { ScrollArea } from '../../../../../../components/ui/scroll-area';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../../../components/ui/dialog';

import { MapPin, Search } from 'lucide-react';

type TopItem = {
  key: 'shelter' | 'aid' | 'school';
  title: string; // عربي
  name: string;  // إنجليزي
  meta: string;  // عربي
};

const TopCards = () => {
  const items: TopItem[] = [
    { key: 'shelter', title: 'أقرب مأوى', name: 'Al-Azhar Shelter', meta: 'يبعد 1.2 كم' },
    { key: 'aid', title: 'توزيع غذاء وماء', name: 'Al-Rahfah Aid Center', meta: 'مفتوح - 09:00' },
    { key: 'school', title: 'المدارس المتاحة', name: 'Great Gaza Primary School', meta: 'سعة 120' },
  ];

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<TopItem | null>(null);

  const onOpenDetails = (item: TopItem) => {
    setSelected(item);
    setOpen(true);
  };

  const renderDetailsContent = () => {
    if (!selected) return null;

    // ✅ محتوى عربي: RTL + يمين
    // ✅ النص الإنجليزي (selected.name) نخليه LTR + يسار
    if (selected.key === 'shelter') {
      return (
        <div dir="rtl" className="grid gap-3 text-sm text-right">
          <div className="text-muted-foreground">تفاصيل المأوى:</div>

          <div className="grid gap-2 rounded-lg border p-3">
            <div dir="ltr" className="font-medium text-left">
              {selected.name}
            </div>

            <div className="text-muted-foreground">المسافة: {selected.meta}</div>
            <div className="text-muted-foreground">السعة المتوقعة: 250</div>
            <div className="text-muted-foreground">الحالة: متاح</div>
          </div>

          <div className="text-xs text-muted-foreground">
            * استبدل هذه البيانات لاحقًا ببيانات حقيقية من API.
          </div>
        </div>
      );
    }

    if (selected.key === 'aid') {
      return (
        <div dir="rtl" className="grid gap-3 text-sm text-right">
          <div className="text-muted-foreground">تفاصيل مركز التوزيع:</div>

          <div className="grid gap-2 rounded-lg border p-3">
            <div dir="ltr" className="font-medium text-left">
              {selected.name}
            </div>

            <div className="text-muted-foreground">المواعيد: {selected.meta}</div>
            <div className="text-muted-foreground">المواد المتوفرة: غذاء + ماء</div>
            <div className="text-muted-foreground">مستوى الازدحام: متوسط</div>
          </div>

          <div className="text-xs text-muted-foreground">
            * تقدر تضيف زر “طلب دور/حجز” هنا لاحقًا.
          </div>
        </div>
      );
    }

    return (
      <div dir="rtl" className="grid gap-3 text-sm text-right">
        <div className="text-muted-foreground">تفاصيل المدرسة:</div>

        <div className="grid gap-2 rounded-lg border p-3">
          <div dir="ltr" className="font-medium text-left">
            {selected.name}
          </div>

          <div className="text-muted-foreground">السعة: {selected.meta}</div>
          <div className="text-muted-foreground">الفئات: ابتدائي</div>
          <div className="text-muted-foreground">الدوام: صباحي</div>
        </div>

        <div className="text-xs text-muted-foreground">
          * لاحقًا اربطها بخريطة/موقع وإحصائيات حضور.
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ✅ الكروت عربية: RTL */}
      <div dir="rtl" className="grid gap-4 md:grid-cols-3">
        {items.map((it) => (
          <Card key={it.key}>
            <CardContent className="p-4 flex flex-col gap-2 text-right">
              <div className="text-sm text-secondary-foreground">{it.title}</div>

              {/* ✅ الاسم إنجليزي: LTR */}
              <div dir="ltr" className="text-base font-semibold text-mono text-left">
                {it.name}
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <MapPin className="size-3.5" />
                {it.meta}
              </div>

              <Button className="mt-2" size="sm" onClick={() => onOpenDetails(it)}>
                عرض التفاصيل
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          {/* ✅ عنوان عربي: RTL */}
          <DialogHeader dir="rtl" className="text-right">
            <DialogTitle>
              {selected ? `تفاصيل: ${selected.title}` : 'تفاصيل'}
            </DialogTitle>

            {/* ✅ الاسم إنجليزي: LTR */}
            <DialogDescription dir="ltr" className="text-left">
              {selected ? selected.name : ''}
            </DialogDescription>
          </DialogHeader>

          {renderDetailsContent()}

          {/* ✅ أزرار عربية: RTL */}
          <DialogFooter dir="rtl" className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              إغلاق
            </Button>
            <Button onClick={() => setOpen(false)}>تم</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const MapPreview = () => {
  return (
    <Card className="h-full">
      <CardHeader className="py-4">
        <div className="flex items-center justify-between gap-3">
          {/* ✅ إنجليزي: LTR */}
          <CardTitle dir="ltr" className="text-base text-left">
            Map Preview
          </CardTitle>

          <Button dir="ltr" variant="outline" size="sm">
            Open Full Map
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div dir="ltr" className="h-[260px] rounded-lg border bg-accent/40 flex items-center justify-center text-sm text-muted-foreground text-left">
          Map Placeholder
        </div>
      </CardContent>
    </Card>
  );
};

const RightSidebar = () => {
  return (
    <Card className="h-full">
      <CardHeader className="py-4">
        {/* ✅ إنجليزي */}
        <CardTitle dir="ltr" className="text-base text-left">
          Sidebar
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        {/* ✅ بحث عربي: RTL */}
        <div dir="rtl" className="relative mb-4">
          <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
          <Input className="ps-9" placeholder="بحث..." />
        </div>

        <ScrollArea className="h-[520px] pr-2">
          {/* ✅ أقسام إنجليزية: LTR */}
          <div dir="ltr" className="flex flex-col gap-4 text-left">
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
      <TopCards />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <MapPreview />
        </div>

        <RightSidebar />
      </div>
    </div>
  );
};

export { DashboardWireframe };
