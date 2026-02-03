'use client';

import { useMemo, useState, type ChangeEvent } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Badge } from '../../../components/ui/badge';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';

import { MapPin, Search, Stethoscope, Clock, Users, Phone, Plus } from 'lucide-react';

type BadgeVariant =
  | 'destructive'
  | 'secondary'
  | 'outline'
  | 'primary'
  | 'success'
  | 'warning'
  | 'info';

type Clinic = {
  id: string;
  nameEn: string;
  nameAr: string;
  distanceKm: number;
  openNow: boolean;
  workingHours: string;
  specialtyAr: string;
  doctorsCount: number;
  capacityPerDay: number;
  crowdLevel: 'منخفض' | 'متوسط' | 'مرتفع';
  phone?: string;
  addressAr: string;
};

const clinicsSeed: Clinic[] = [
  { id: 'cl_01', nameEn: 'Al-Shifa Clinic', nameAr: 'عيادة الشفاء', distanceKm: 1.1, openNow: true, workingHours: '09:00 - 17:00', specialtyAr: 'طب عام', doctorsCount: 4, capacityPerDay: 120, crowdLevel: 'متوسط', phone: '+970-000-000', addressAr: 'غزة - شارع الجلاء' },
  { id: 'cl_02', nameEn: 'Hope Women Clinic', nameAr: 'عيادة الأمل للنساء', distanceKm: 2.6, openNow: false, workingHours: '10:00 - 16:00', specialtyAr: 'نسائية', doctorsCount: 2, capacityPerDay: 60, crowdLevel: 'منخفض', addressAr: 'غزة - الرمال' },
  { id: 'cl_03', nameEn: 'Child Care Center', nameAr: 'مركز رعاية الطفل', distanceKm: 0.8, openNow: true, workingHours: '08:00 - 14:00', specialtyAr: 'أطفال', doctorsCount: 3, capacityPerDay: 80, crowdLevel: 'مرتفع', addressAr: 'غزة - النصر' },
];

const crowdBadgeVariant = (v: Clinic['crowdLevel']): BadgeVariant => {
  if (v === 'مرتفع') return 'destructive';
  if (v === 'متوسط') return 'secondary';
  return 'outline';
};

const statusBadgeVariant = (openNow: boolean): BadgeVariant => (openNow ? 'success' : 'warning');

export default function ClinicsPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Clinic[]>(clinicsSeed);

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [nameAr, setNameAr] = useState('');
  const [specialtyAr, setSpecialtyAr] = useState('');
  const [addressAr, setAddressAr] = useState('');
  const [phone, setPhone] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((c) => c.nameEn.toLowerCase().includes(s) || c.nameAr.includes(q) || c.specialtyAr.includes(q) || c.addressAr.includes(q));
  }, [q, items]);

  const nearest = useMemo(() => {
    if (!items.length) return null;
    return [...items].sort((a, b) => a.distanceKm - b.distanceKm)[0];
  }, [items]);

  const openCount = useMemo(() => items.filter((c) => c.openNow).length, [items]);
  const totalCapacity = useMemo(() => items.reduce((acc, c) => acc + c.capacityPerDay, 0), [items]);

  const onAdd = () => {
    const ar = nameAr.trim();
    const sp = specialtyAr.trim();
    const addr = addressAr.trim();
    if (!ar || !sp || !addr) return;

    const newItem: Clinic = {
      id: `cl_${Math.random().toString(16).slice(2, 8)}`,
      nameAr: ar,
      nameEn: ar, // مؤقتًا
      specialtyAr: sp,
      addressAr: addr,
      phone: phone.trim() || undefined,
      distanceKm: 0,
      openNow: false,
      workingHours: '—',
      doctorsCount: 0,
      capacityPerDay: 0,
      crowdLevel: 'منخفض',
    };

    setItems((prev) => [newItem, ...prev]);
    setNameAr('');
    setSpecialtyAr('');
    setAddressAr('');
    setPhone('');
    setAddOpen(false);
  };

  return (
    <div className="grid gap-6">
      {/* Top cards */}
      <div dir="rtl" className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex flex-col gap-2 text-right">
            <div className="text-sm text-secondary-foreground">أقرب عيادة</div>
            <div dir="ltr" className="text-base font-semibold text-mono text-left">
              {nearest ? nearest.nameEn : '—'}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              <MapPin className="size-3.5" />
              {nearest ? `${nearest.distanceKm.toFixed(1)} كم` : '—'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col gap-2 text-right">
            <div className="text-sm text-secondary-foreground">العيادات المفتوحة الآن</div>
            <div className="text-2xl font-semibold">{openCount}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              <Clock className="size-3.5" /> حسب حالة الدوام
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col gap-2 text-right">
            <div className="text-sm text-secondary-foreground">الطاقة اليومية الإجمالية</div>
            <div className="text-2xl font-semibold">{totalCapacity}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              <Users className="size-3.5" /> مراجع/يوم
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* List */}
        <Card className="h-full">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle dir="rtl" className="text-base text-right">العيادات الطبية</CardTitle>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="size-4 me-1" /> إضافة عيادة
                </Button>
                <Button variant="outline" size="sm">Export</Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div dir="rtl" className="relative mb-4">
              <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              <Input
                value={q}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                className="ps-9"
                placeholder="بحث باسم العيادة/التخصص/المنطقة..."
              />
            </div>

            <ScrollArea className="h-[520px] pr-2">
              <div dir="rtl" className="grid gap-3">
                {filtered.map((c) => (
                  <div key={c.id} className="rounded-lg border p-3 flex items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="size-4 text-muted-foreground" />
                        <div className="font-semibold">{c.nameAr}</div>
                        <span className="text-xs text-muted-foreground">({c.specialtyAr})</span>
                      </div>

                      <div dir="ltr" className="text-sm text-left text-muted-foreground">{c.nameEn}</div>

                      <div className="text-xs text-muted-foreground flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" /> {c.distanceKm.toFixed(1)} كم
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" /> {c.workingHours}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3.5" /> {c.capacityPerDay} / يوم
                        </span>
                      </div>

                      <div className="text-xs flex items-center gap-2">
                        <span className="text-muted-foreground">الازدحام:</span>
                        <Badge variant={crowdBadgeVariant(c.crowdLevel)}>{c.crowdLevel}</Badge>

                        <span className="text-muted-foreground">الحالة:</span>
                        <Badge variant={statusBadgeVariant(c.openNow)}>
                          {c.openNow ? 'مفتوحة' : 'مغلقة'}
                        </Badge>
                      </div>

                      {c.addressAr && <div className="text-xs text-muted-foreground">العنوان: {c.addressAr}</div>}
                      {c.phone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Phone className="size-4" />
                          <span dir="ltr">{c.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline">عرض</Button>
                      <Button size="sm" variant="outline">حجز دور</Button>
                    </div>
                  </div>
                ))}

                {!filtered.length && (
                  <div className="text-sm text-muted-foreground text-center py-10">لا يوجد نتائج.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <Card className="h-full">
          <CardHeader className="py-4">
            <CardTitle dir="rtl" className="text-base text-right">ملخص سريع</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div dir="rtl" className="grid gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <div className="font-semibold mb-1">مؤشرات</div>
                <div className="text-muted-foreground">عدد العيادات: {items.length}</div>
                <div className="text-muted-foreground">مفتوحة الآن: {openCount}</div>
                <div className="text-muted-foreground">طاقة يومية: {totalCapacity}</div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="font-semibold mb-1">ملاحظة</div>
                <div className="text-muted-foreground">لاحقًا اربط البيانات بـ API + إحداثيات خريطة.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader dir="rtl" className="text-right">
            <DialogTitle>إضافة عيادة</DialogTitle>
            <DialogDescription>إضافة سريعة (مؤقتًا Local State).</DialogDescription>
          </DialogHeader>

          <div dir="rtl" className="grid gap-3">
            <div className="grid gap-2">
              <div className="text-sm">اسم العيادة</div>
              <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: عيادة الأمل" />
            </div>

            <div className="grid gap-2">
              <div className="text-sm">التخصص</div>
              <Input value={specialtyAr} onChange={(e) => setSpecialtyAr(e.target.value)} placeholder="مثال: طب عام" />
            </div>

            <div className="grid gap-2">
              <div className="text-sm">العنوان</div>
              <Input value={addressAr} onChange={(e) => setAddressAr(e.target.value)} placeholder="مثال: غزة - الرمال" />
            </div>

            <div className="grid gap-2">
              <div className="text-sm">الهاتف (اختياري)</div>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+970-..." />
            </div>
          </div>

          <DialogFooter dir="rtl" className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>إغلاق</Button>
            <Button onClick={onAdd}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
