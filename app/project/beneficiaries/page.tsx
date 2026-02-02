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

import { Search, User, Phone, Hash, AlertTriangle } from 'lucide-react';


type Beneficiary = {
  id: string;
  fullNameAr: string;
  fullNameEn: string;
  nationalId: string;
  familyCount: number;
  priority: 'عادي' | 'مستعجل' | 'حرج';
  lastAidAr: string;
  phone?: string;
  campAr?: string;
  notesAr?: string;
};

const beneficiariesSeed: Beneficiary[] = [
  {
    id: 'bn_01',
    fullNameAr: 'أحمد محمد',
    fullNameEn: 'Ahmed Mohammad',
    nationalId: 'FK-10293',
    familyCount: 6,
    priority: 'مستعجل',
    lastAidAr: 'قبل 12 يوم',
    phone: '+970-111-222',
    campAr: 'مخيم الوسط B',
    notesAr: 'حالة سكري + يحتاج دواء',
  },
  {
    id: 'bn_02',
    fullNameAr: 'سارة علي',
    fullNameEn: 'Sara Ali',
    nationalId: 'FK-88310',
    familyCount: 3,
    priority: 'عادي',
    lastAidAr: 'قبل 5 أيام',
    campAr: 'مخيم الشمال A',
  },
  {
    id: 'bn_03',
    fullNameAr: 'خالد حسن',
    fullNameEn: 'Khaled Hassan',
    nationalId: 'FK-55120',
    familyCount: 8,
    priority: 'حرج',
    lastAidAr: 'قبل 20 يوم',
    phone: '+970-444-555',
    notesAr: 'إعاقة حركية',
  },
];

// ✅ حل badge variant بدون any
type BadgeVariant =
  | 'destructive'
  | 'secondary'
  | 'outline'
  | 'primary'
  | 'success'
  | 'warning'
  | 'info';

const prBadge = (p: Beneficiary['priority']) => {
  const variant: BadgeVariant =
    p === 'حرج' ? 'destructive' : p === 'مستعجل' ? 'secondary' : 'outline';

  return <Badge variant={variant}>{p}</Badge>;
};

export function BeneficiariesPage() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Beneficiary | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return beneficiariesSeed;

    return beneficiariesSeed.filter((b) => {
      return (
        b.fullNameEn.toLowerCase().includes(s) ||
        b.fullNameAr.includes(q) ||
        b.nationalId.toLowerCase().includes(s) ||
        (b.campAr?.includes(q) ?? false)
      );
    });
  }, [q]);

  const counts = useMemo(() => {
    const total = beneficiariesSeed.length;
    const urgent = beneficiariesSeed.filter((b) => b.priority !== 'عادي').length;
    const critical = beneficiariesSeed.filter((b) => b.priority === 'حرج').length;
    return { total, urgent, critical };
  }, []);

  const openDetails = (b: Beneficiary) => {
    setSelected(b);
    setOpen(true);
  };

  return (
    <div className="grid gap-6">
      {/* Top Cards */}
      <div dir="rtl" className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex flex-col gap-2 text-right">
            <div className="text-sm text-secondary-foreground">إجمالي المستفيدين</div>
            <div className="text-2xl font-semibold">{counts.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col gap-2 text-right">
            <div className="text-sm text-secondary-foreground">حالات مستعجلة/حرجة</div>
            <div className="text-2xl font-semibold">{counts.urgent}</div>
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1 justify-end">
              <AlertTriangle className="size-3.5" />
              أولوية عالية
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col gap-2 text-right">
            <div className="text-sm text-secondary-foreground">حالات حرجة</div>
            <div className="text-2xl font-semibold">{counts.critical}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* List */}
        <Card className="h-full">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle dir="rtl" className="text-base text-right">
                المستفيدين
              </CardTitle>
              <Button variant="outline" size="sm">
                Add Beneficiary
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div dir="rtl" className="relative mb-4">
              <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              <Input
                value={q}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                className="ps-9"
                placeholder="بحث بالاسم/الرقم التعريفي/المخيم..."
              />
            </div>

            <ScrollArea className="h-[520px] pr-2">
              <div dir="rtl" className="grid gap-3">
                {filtered.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-lg border p-3 flex items-start justify-between gap-3"
                  >
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-muted-foreground" />
                        <div className="font-semibold">{b.fullNameAr}</div>
                        <span className="text-xs text-muted-foreground">
                          {prBadge(b.priority)}
                        </span>
                      </div>

                      <div dir="ltr" className="text-sm text-left text-muted-foreground">
                        {b.fullNameEn}
                      </div>

                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <Hash className="size-3.5" />
                          <span dir="ltr">{b.nationalId}</span>
                        </span>

                        <span className="text-muted-foreground">
                          عدد أفراد الأسرة: {b.familyCount}
                        </span>
                        <span className="text-muted-foreground">
                          آخر مساعدة: {b.lastAidAr}
                        </span>

                        {b.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="size-3.5" />
                            <span dir="ltr">{b.phone}</span>
                          </span>
                        )}
                      </div>

                      {b.campAr && (
                        <div className="text-xs text-muted-foreground">المخيم: {b.campAr}</div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => openDetails(b)}>
                        عرض التفاصيل
                      </Button>
                      <Button size="sm" variant="outline">
                        تسجيل مساعدة
                      </Button>
                    </div>
                  </div>
                ))}

                {!filtered.length && (
                  <div className="text-sm text-muted-foreground text-center py-10">
                    لا يوجد نتائج.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <Card className="h-full">
          <CardHeader className="py-4">
            <CardTitle dir="rtl" className="text-base text-right">
              ملاحظات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div dir="rtl" className="grid gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <div className="font-semibold mb-1">اقتراح</div>
                <div className="text-muted-foreground">
                  لاحقًا: اعمل تصفية حسب “الأولوية” + “آخر مساعدة” + “المخيم”.
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="font-semibold mb-1">API</div>
                <div className="text-muted-foreground">
                  اربط المستفيدين بـ /beneficiaries + سجل المساعدات بـ /aid-logs.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader dir="rtl" className="text-right">
            <DialogTitle>تفاصيل المستفيد</DialogTitle>
            <DialogDescription dir="ltr" className="text-left">
              {selected ? selected.fullNameEn : ''}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div dir="rtl" className="grid gap-3 text-sm text-right">
              <div className="grid gap-2 rounded-lg border p-3">
                <div className="font-semibold">{selected.fullNameAr}</div>
                <div className="text-muted-foreground">
                  رقم تعريفي: <span dir="ltr">{selected.nationalId}</span>
                </div>
                <div className="text-muted-foreground">أولوية: {prBadge(selected.priority)}</div>
                <div className="text-muted-foreground">عدد أفراد الأسرة: {selected.familyCount}</div>
                <div className="text-muted-foreground">آخر مساعدة: {selected.lastAidAr}</div>

                {selected.campAr && (
                  <div className="text-muted-foreground">المخيم: {selected.campAr}</div>
                )}

                {selected.phone && (
                  <div className="text-muted-foreground">
                    هاتف: <span dir="ltr">{selected.phone}</span>
                  </div>
                )}

                {selected.notesAr && (
                  <div className="text-muted-foreground">ملاحظات: {selected.notesAr}</div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                * استبدل البيانات لاحقًا ببيانات حقيقية من API.
              </div>
            </div>
          )}

          <DialogFooter dir="rtl" className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              إغلاق
            </Button>
            <Button onClick={() => setOpen(false)}>تم</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}