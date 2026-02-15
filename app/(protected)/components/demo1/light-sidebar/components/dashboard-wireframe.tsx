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

// ✅ import خريطتك (غيرت الاسم لتجنب التعارض مع MapPreview الموجود هنا)
import MapLibrePreview from '@/app/components/MapPreview';

// ✅ أماكن غزة (غيريها حسب بياناتك) — هذه بياناتك الخاصة
// ✅ هذه ستظهر كـ Markers (Pins) فوق الخريطة
const gazaPlaces = [
  { id: 'shelter_01', name: 'مأوى الأزهر', type: 'Shelter', lng: 34.4667, lat: 31.5017 },
  { id: 'aid_01', name: 'مركز توزيع', type: 'Aid Center', lng: 34.45, lat: 31.52 },
  { id: 'clinic_01', name: 'عيادة', type: 'Clinic', lng: 34.48, lat: 31.51 },
];

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
      <div dir="rtl" className="grid gap-4 md:grid-cols-3">
        {items.map((it) => (
          <Card key={it.key}>
            <CardContent className="p-4 flex flex-col gap-2 text-right">
              <div className="text-sm text-secondary-foreground">{it.title}</div>

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
          <DialogHeader dir="rtl" className="text-right">
            <DialogTitle>
              {selected ? `تفاصيل: ${selected.title}` : 'تفاصيل'}
            </DialogTitle>

            <DialogDescription dir="ltr" className="text-left">
              {selected ? selected.name : ''}
            </DialogDescription>
          </DialogHeader>

          {renderDetailsContent()}

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

/**
 * ✅ MapPreview (داخل الداشبورد)
 * - يعرض خريطة صغيرة داخل Card
 * - و Dialog للخريطة الكبيرة
 * - وتحت الخريطة 3 checkboxes للتحكم بإظهار/إخفاء الفئات
 */
const MapPreview = () => {
  const [fullOpen, setFullOpen] = useState(false);

  // ✅ 3 مفاتيح checkbox (هاي اللي طلبتيهم)
  const [showShelters, setShowShelters] = useState(true);
  const [showMedical, setShowMedical] = useState(true);
  const [showAid, setShowAid] = useState(true);

  /**
   * ✅ فلترة places الخاصة فيك (Markers)
   * حسب النوع (type) اللي انتي مخزناه في البيانات
   */
  const filteredPlaces = gazaPlaces.filter((p) => {
    const t = (p.type || '').toLowerCase();

    // ✅ مراكز الإيواء
    if (t.includes('shelter')) return showShelters;

    // ✅ طبي
    if (t.includes('clinic') || t.includes('pharmacy') || t.includes('hospital')) return showMedical;

    // ✅ توزيع (ماء/غذاء)
    if (t.includes('aid') || t.includes('water') || t.includes('food')) return showAid;

    return true;
  });

  return (
    <>
      <Card className="h-full">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle dir="ltr" className="text-base text-left">
              Map Preview
            </CardTitle>

            {/* ✅ الآن الزر يفتح Dialog */}
            <Button dir="ltr" variant="outline" size="sm" onClick={() => setFullOpen(true)}>
              Open Full Map
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {/* ✅ خريطة أكبر داخل الكارد */}
          <div dir="ltr" className="rounded-lg overflow-hidden">
            <MapLibrePreview
              lng={34.4667}
              lat={31.5}
              zoom={10}
              height={420}
              places={filteredPlaces} // ✅ نقاطك الخاصة بعد الفلترة
              osmEnabled={true}
              // ✅ نجلب كل الأنواع مرة واحدة من OSM
              // وبعدها نتحكم بعرضها/إخفائها عبر osmCategories
              osmAmenities={['hospital', 'clinic', 'school', 'pharmacy', 'doctors', 'drinking_water']}
              osmCategories={{
                shelters: showShelters, // ✅ مدارس = مراكز إيواء
                medical: showMedical,   // ✅ طبي
                aid: showAid,           // ✅ drinking_water (ماء)
              }}
            />
          </div>

          {/* ✅ أزرار/Checkboxes تحت الخريطة (مثل ما طلبتي) */}
          <div dir="rtl" className="mt-4 grid gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showShelters}
                onChange={(e) => setShowShelters(e.target.checked)}
              />
              <span>مراكز الإيواء (المدارس الحكومية والوكالة)</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showMedical}
                onChange={(e) => setShowMedical(e.target.checked)}
              />
              <span>العيادات الطبية والصيدليات</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showAid}
                onChange={(e) => setShowAid(e.target.checked)}
              />
              <span>مراكز توزيع الغذاء والماء</span>
            </label>

            {/* ✅ ملاحظة صغيرة توضيحية */}
            <div className="text-xs text-muted-foreground mt-1">
              * طبقة “مراكز التوزيع” من OSM هنا تمثل نقاط الماء (drinking_water)، أما الغذاء غالبًا يحتاج بياناتك الخاصة أو مصدر بيانات ميداني.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Dialog للخريطة الكاملة */}
      <Dialog open={fullOpen} onOpenChange={setFullOpen}>
        <DialogContent className="max-w-[1100px] p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div dir="ltr" className="font-semibold">Full Map</div>

            <Button variant="outline" size="sm" onClick={() => setFullOpen(false)}>
              Close
            </Button>
          </div>

          <div className="p-4">
            <MapLibrePreview
              lng={34.4667}
              lat={31.5}
              zoom={11}
              height={650}
              places={filteredPlaces}
              osmEnabled={true}
              osmAmenities={['hospital', 'clinic', 'school', 'pharmacy', 'doctors', 'drinking_water']}
              osmCategories={{
                shelters: showShelters,
                medical: showMedical,
                aid: showAid,
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const RightSidebar = () => {
  return (
    <Card className="h-full">
      <CardHeader className="py-4">
        <CardTitle dir="ltr" className="text-base text-left">
          Sidebar
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div dir="rtl" className="relative mb-4">
          <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
          <Input className="ps-9" placeholder="بحث..." />
        </div>

        <ScrollArea className="h-[520px] pr-2">
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