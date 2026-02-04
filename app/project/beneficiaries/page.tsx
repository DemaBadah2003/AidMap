'use client';

import { useMemo, useState, type ChangeEvent } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';

import {
  LayoutDashboard,
  Tent,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X as XIcon,
  Pencil,
  Trash2,
  Save,
  X,
} from 'lucide-react';

type Priority = 'عادي' | 'مستعجل' | 'حرج';

type Beneficiary = {
  id: string;
  nameAr: string;
  nameEn: string;
  phone: string;
  familyCount: number;
  campAr: string;
  priority: Priority;
  // (لو حابة تتركيهم بالمستقبل)
  lastAidDaysAgo?: number;
  notes?: string;
};

const beneficiariesSeed: Beneficiary[] = [
  {
    id: 'bf_01',
    nameAr: 'أحمد محمد',
    nameEn: 'Ahmed Mohammad',
    phone: '+970-111-222',
    familyCount: 6,
    campAr: 'مخيم الوسط B',
    priority: 'مستعجل',
    notes: 'حالة سكرية + يحتاج دواء',
  },
  {
    id: 'bf_02',
    nameAr: 'سارة علي',
    nameEn: 'Sara Ali',
    phone: '+970-333-444',
    familyCount: 3,
    campAr: 'مخيم الشمال A',
    priority: 'عادي',
  },
  {
    id: 'bf_03',
    nameAr: 'خالد حسن',
    nameEn: 'Khaled Hassan',
    phone: '+970-444-555',
    familyCount: 8,
    campAr: 'مخيم الجنوب C',
    priority: 'حرج',
    notes: 'إعاقة حركية',
  },
];

// ✅ أرقام صحيحة فقط (بدون كسور / بدون حروف)
const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

// ✅ FIX: استخدم ألوان theme (مضمونة الظهور) بدل amber/red
const priorityBadgeClass = (p: Priority) => {
  switch (p) {
    case 'حرج':
      return 'bg-destructive text-destructive-foreground';
    case 'مستعجل':
      return 'bg-primary text-primary-foreground';
    default:
      return 'bg-muted text-foreground';
  }
};

export default function BeneficiariesPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Beneficiary[]>(beneficiariesSeed);

  // فلترة حسب الأولوية
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');

  // ✅ Hamburger / Drawer sidebar للـ mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [nameAr, setNameAr] = useState('');
  const [phone, setPhone] = useState('');
  const [familyCount, setFamilyCount] = useState<number>(0);
  const [campAr, setCampAr] = useState('');
  const [priority, setPriority] = useState<Priority>('عادي');

  // Inline Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    nameAr: string;
    phone: string;
    familyCount: number;
    campAr: string;
    priority: Priority;
  }>({
    nameAr: '',
    phone: '',
    familyCount: 1,
    campAr: '',
    priority: 'عادي',
  });

  // ✅ فلترة search + فلترة priority
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return items.filter((b) => {
      const matchSearch =
        !s ||
        b.nameEn.toLowerCase().includes(s) ||
        b.nameAr.includes(q) ||
        b.phone.includes(q) ||
        b.campAr.includes(q);

      const matchPriority = priorityFilter === 'all' ? true : b.priority === priorityFilter;

      return matchSearch && matchPriority;
    });
  }, [q, items, priorityFilter]);

  // Reset page on filter change
  useMemo(() => {
    setPage(1);
  }, [q, priorityFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const onAdd = () => {
    const ar = nameAr.trim();
    const ph = phone.trim();
    const camp = campAr.trim();

    if (!ar || !ph || !camp || !Number.isInteger(familyCount) || familyCount <= 0) return;

    const newItem: Beneficiary = {
      id: `bf_${Math.random().toString(16).slice(2, 8)}`,
      nameAr: ar,
      nameEn: ar,
      phone: ph,
      familyCount,
      campAr: camp,
      priority, // ✅ مهم
    };

    setItems((prev) => [newItem, ...prev]);
    setNameAr('');
    setPhone('');
    setFamilyCount(0);
    setCampAr('');
    setPriority('عادي');
    setAddOpen(false);
  };

  const onDeleteOne = (id: string) => {
    if (editingId === id) setEditingId(null);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const startEditRow = (b: Beneficiary) => {
    setEditingId(b.id);
    setEditDraft({
      nameAr: b.nameAr,
      phone: b.phone,
      familyCount: b.familyCount,
      campAr: b.campAr,
      priority: b.priority ?? 'عادي',
    });
  };

  const cancelEditRow = () => setEditingId(null);

  const saveEditRow = (id: string) => {
    const ar = editDraft.nameAr.trim();
    const ph = editDraft.phone.trim();
    const camp = editDraft.campAr.trim();

    if (!ar || !ph || !camp) return;
    if (!Number.isInteger(editDraft.familyCount) || editDraft.familyCount <= 0) return;

    setItems((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              nameAr: ar,
              nameEn: ar,
              phone: ph,
              familyCount: editDraft.familyCount,
              campAr: camp,
              priority: editDraft.priority, // ✅ مهم
            }
          : b
      )
    );

    setEditingId(null);
  };

  // ===== Sidebar =====
  const Sidebar = ({ onClose }: { onClose?: () => void }) => (
    <div className="h-full w-64 bg-background border-r flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <div className="font-bold text-lg">Admin</div>
          <div className="text-xs text-muted-foreground">Control Panel</div>
        </div>

        {onClose ? (
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center rounded-md border h-9 w-9 hover:bg-muted"
            onClick={onClose}
            aria-label="Close"
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>

      <nav className="p-3 grid gap-1">
        <button type="button" className="w-full flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted text-sm" onClick={onClose}>
          <LayoutDashboard className="size-4" />
          Dashboard
        </button>

        <button type="button" className="w-full flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted text-sm" onClick={onClose}>
          <Tent className="size-4" />
          Camp management
        </button>

        <button type="button" className="w-full flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted text-sm" onClick={onClose}>
          <BarChart3 className="size-4" />
          Status
        </button>

        <button type="button" className="w-full flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted text-sm" onClick={onClose}>
          <SettingsIcon className="size-4" />
          Settings
        </button>
      </nav>

      <div className="mt-auto p-3 border-t">
        <button type="button" className="w-full flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted text-sm text-red-600" onClick={onClose}>
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div dir="ltr" className="min-h-screen w-full bg-muted/30">
      {/* Mobile Topbar */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-3 py-2">
          <Button variant="outline" size="sm" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="size-4" />
          </Button>
          <div className="font-semibold">Beneficiaries</div>
          <div className="w-9" />
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block">
          <Sidebar />
        </aside>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] shadow-xl">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main */}
        <main className="flex-1">
          <div dir="rtl" className="w-full flex justify-center">
            <div className="w-full max-w-[1200px] px-3 sm:px-6 py-6 grid gap-6">
              {/* Title (desktop) */}
              <div className="hidden lg:block text-center">
                <h1 className="text-2xl font-bold text-black">Beneficiaries</h1>
              </div>

              {/* Control Panel */}
              <div className="rounded-xl border bg-background p-4">
                <div className="text-lg font-semibold text-black mb-3 text-left" dir="ltr">
                  Control Panel
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center" dir="ltr">
                  <div className="flex-1">
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="Search by name / phone / camp..."
                      className="h-11"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button className="h-11 bg-black text-white hover:bg-black/90" onClick={() => setPriorityFilter('all')}>
                      Search
                    </Button>

                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value as 'all' | Priority)}
                      className="h-11 rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="all">Search by Priority</option>
                      <option value="عادي">عادي</option>
                      <option value="مستعجل">مستعجل</option>
                      <option value="حرج">حرج</option>
                    </select>

                    <Button className="h-11 bg-black text-white hover:bg-black/90" onClick={() => setAddOpen(true)}>
                      + إضافة مستفيد
                    </Button>

                    <Button
                      className="h-11 bg-black text-white hover:bg-black/90"
                      onClick={() => {
                        setItems([]);
                        setEditingId(null);
                      }}
                    >
                      Delete All
                    </Button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base">المستفيدين</CardTitle>
                </CardHeader>

                <CardContent className="p-4">
                  <div className="rounded-lg border overflow-hidden bg-background">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-sm border-collapse min-w-[900px]" dir="ltr">
                        <thead className="bg-muted/60">
                          <tr className="text-left">
                            <th className="px-4 py-3 font-semibold border-b border-r">Beneficiary's Name</th>
                            <th className="px-4 py-3 font-semibold border-b border-r">Phone</th>
                            <th className="px-4 py-3 font-semibold border-b border-r">Number Of Family</th>
                            <th className="px-4 py-3 font-semibold border-b border-r">Camp Name</th>
                            <th className="px-4 py-3 font-semibold border-b border-r">Priority</th>
                            <th className="px-4 py-3 font-semibold border-b">Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {pageItems.map((b) => {
                            const isEditing = editingId === b.id;
                            const showPriority: Priority = (b.priority ?? 'عادي') as Priority;

                            return (
                              <tr key={b.id} className="hover:bg-muted/30">
                                {/* Beneficiary Name */}
                                <td className="px-4 py-3 border-b border-r font-medium">
                                  {isEditing ? (
                                    <Input
                                      value={editDraft.nameAr}
                                      onChange={(e) => setEditDraft((p) => ({ ...p, nameAr: e.target.value }))}
                                      className="h-9"
                                    />
                                  ) : (
                                    b.nameAr
                                  )}
                                </td>

                                {/* Phone */}
                                <td className="px-4 py-3 border-b border-r">
                                  {isEditing ? (
                                    <Input
                                      value={editDraft.phone}
                                      onChange={(e) => setEditDraft((p) => ({ ...p, phone: e.target.value }))}
                                      className="h-9"
                                    />
                                  ) : (
                                    b.phone
                                  )}
                                </td>

                                {/* Number Of Family */}
                                <td className="px-4 py-3 border-b border-r">
                                  {isEditing ? (
                                    <Input
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      type="text"
                                      value={editDraft.familyCount ? String(editDraft.familyCount) : ''}
                                      onChange={(e) =>
                                        setEditDraft((p) => ({
                                          ...p,
                                          familyCount: toIntOnly(e.target.value),
                                        }))
                                      }
                                      className="h-9"
                                    />
                                  ) : (
                                    b.familyCount
                                  )}
                                </td>

                                {/* Camp Name */}
                                <td className="px-4 py-3 border-b border-r">
                                  {isEditing ? (
                                    <Input
                                      value={editDraft.campAr}
                                      onChange={(e) => setEditDraft((p) => ({ ...p, campAr: e.target.value }))}
                                      className="h-9"
                                    />
                                  ) : (
                                    b.campAr
                                  )}
                                </td>

                                {/* Priority */}
                                <td className="px-4 py-3 border-b border-r">
                                  {isEditing ? (
                                    <select
                                      value={editDraft.priority}
                                      onChange={(e) =>
                                        setEditDraft((p) => ({
                                          ...p,
                                          priority: e.target.value as Priority,
                                        }))
                                      }
                                      className="h-9 rounded-md border px-3 bg-background"
                                    >
                                      <option value="عادي">عادي</option>
                                      <option value="مستعجل">مستعجل</option>
                                      <option value="حرج">حرج</option>
                                    </select>
                                  ) : (
                                    <span
                                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${priorityBadgeClass(
                                        showPriority
                                      )}`}
                                    >
                                      {showPriority}
                                    </span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 border-b">
                                  <div className="flex items-center gap-2">
                                    {!isEditing ? (
                                      <>
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center rounded-md border h-9 w-9 hover:bg-muted"
                                          onClick={() => startEditRow(b)}
                                          title="Edit"
                                        >
                                          <Pencil className="size-4" />
                                        </button>

                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center rounded-md border h-9 w-9 hover:bg-muted"
                                          onClick={() => onDeleteOne(b.id)}
                                          title="Delete"
                                        >
                                          <Trash2 className="size-4" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          className="h-9 bg-black text-white hover:bg-black/90"
                                          onClick={() => saveEditRow(b.id)}
                                          disabled={!Number.isInteger(editDraft.familyCount) || editDraft.familyCount <= 0}
                                        >
                                          <Save className="size-4 me-2" />
                                          Save
                                        </Button>

                                        <Button size="sm" variant="outline" className="h-9" onClick={cancelEditRow}>
                                          <X className="size-4 me-2" />
                                          Cancel
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {!pageItems.length && (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                No beneficiaries found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-t" dir="ltr">
                      <div className="text-sm text-muted-foreground">
                        Page <span className="font-semibold text-foreground">{safePage}</span> of{' '}
                        <span className="font-semibold text-foreground">{totalPages}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rows:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                        </select>

                        <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                          Previous
                        </Button>

                        <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add Beneficiary Dialog */}
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-[640px]">
                  <DialogHeader dir="rtl" className="text-right">
                    <DialogTitle>إضافة مستفيد</DialogTitle>
                    <DialogDescription>إدخال بيانات المستفيد</DialogDescription>
                  </DialogHeader>

                  <div dir="rtl" className="grid gap-3">
                    <div className="grid gap-2">
                      <div className="text-sm">اسم المستفيد</div>
                      <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: أحمد محمد" />
                    </div>

                    <div className="grid gap-2">
                      <div className="text-sm">رقم الهاتف</div>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+970-..." />
                    </div>

                    <div className="grid gap-2">
                      <div className="text-sm">عدد أفراد الأسرة</div>
                      <Input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        type="text"
                        value={familyCount ? String(familyCount) : ''}
                        onChange={(e) => setFamilyCount(toIntOnly(e.target.value))}
                        placeholder="مثال: 6"
                      />
                    </div>

                    <div className="grid gap-2">
                      <div className="text-sm">المخيم</div>
                      <Input value={campAr} onChange={(e) => setCampAr(e.target.value)} placeholder="مثال: مخيم الوسط B" />
                    </div>

                    <div className="grid gap-2">
                      <div className="text-sm">الأولوية</div>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as Priority)}
                        className="h-11 rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="عادي">عادي</option>
                        <option value="مستعجل">مستعجل</option>
                        <option value="حرج">حرج</option>
                      </select>
                    </div>
                  </div>

                  <DialogFooter dir="rtl" className="gap-2">
                    <Button variant="outline" onClick={() => setAddOpen(false)}>
                      إغلاق
                    </Button>
                    <Button onClick={onAdd} disabled={!Number.isInteger(familyCount) || familyCount <= 0}>
                      إضافة
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}