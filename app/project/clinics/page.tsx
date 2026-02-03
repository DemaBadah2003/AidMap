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
  Pencil,
  Trash2,
  Save,
  X,
  LayoutDashboard,
  Stethoscope,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X as XIcon,
} from 'lucide-react';

type Clinic = {
  id: string;
  nameAr: string;
  nameEn: string;
  specialtyAr: string;
  capacityPerDay: number;
  status: 'Open' | 'Closed';
};

const clinicsSeed: Clinic[] = [
  {
    id: 'cl_01',
    nameAr: 'عيادة الشفاء',
    nameEn: 'Al-Shifa Clinic',
    specialtyAr: 'طب عام',
    capacityPerDay: 120,
    status: 'Open',
  },
  {
    id: 'cl_02',
    nameAr: 'عيادة الأمل للنساء',
    nameEn: 'Hope Women Clinic',
    specialtyAr: 'نسائية',
    capacityPerDay: 60,
    status: 'Closed',
  },
  {
    id: 'cl_03',
    nameAr: 'مركز رعاية الطفل',
    nameEn: 'Child Care Center',
    specialtyAr: 'أطفال',
    capacityPerDay: 80,
    status: 'Open',
  },
];

// ✅ أرقام صحيحة فقط
const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

export default function ClinicsPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Clinic[]>(clinicsSeed);

  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

  // ✅ sidebar drawer للموبايل
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [nameAr, setNameAr] = useState('');
  const [specialtyAr, setSpecialtyAr] = useState('');
  const [capacity, setCapacity] = useState<number>(0);

  // Inline Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    nameAr: string;
    specialtyAr: string;
    capacityPerDay: number;
    status: 'Open' | 'Closed';
  }>({
    nameAr: '',
    specialtyAr: '',
    capacityPerDay: 1,
    status: 'Closed',
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return items.filter((c) => {
      const matchSearch =
        !s ||
        c.nameEn.toLowerCase().includes(s) ||
        c.nameAr.includes(q) ||
        c.specialtyAr.includes(q);

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'open'
          ? c.status === 'Open'
          : c.status === 'Closed';

      return matchSearch && matchStatus;
    });
  }, [q, items, statusFilter]);

  useMemo(() => {
    setPage(1);
  }, [q, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const onAdd = () => {
    const ar = nameAr.trim();
    const sp = specialtyAr.trim();
    if (!ar || !sp || !Number.isInteger(capacity) || capacity <= 0) return;

    const newItem: Clinic = {
      id: `cl_${Math.random().toString(16).slice(2, 8)}`,
      nameAr: ar,
      nameEn: ar,
      specialtyAr: sp,
      capacityPerDay: capacity,
      status: 'Closed',
    };

    setItems((prev) => [newItem, ...prev]);
    setNameAr('');
    setSpecialtyAr('');
    setCapacity(0);
    setAddOpen(false);
  };

  const onDeleteOne = (id: string) => {
    if (editingId === id) setEditingId(null);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const startEditRow = (c: Clinic) => {
    setEditingId(c.id);
    setEditDraft({
      nameAr: c.nameAr,
      specialtyAr: c.specialtyAr,
      capacityPerDay: c.capacityPerDay,
      status: c.status,
    });
  };

  const cancelEditRow = () => setEditingId(null);

  const saveEditRow = (id: string) => {
    const ar = editDraft.nameAr.trim();
    const sp = editDraft.specialtyAr.trim();
    if (!ar || !sp || !Number.isInteger(editDraft.capacityPerDay) || editDraft.capacityPerDay <= 0) return;

    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              nameAr: ar,
              nameEn: ar,
              specialtyAr: sp,
              capacityPerDay: editDraft.capacityPerDay,
              status: editDraft.status,
            }
          : c
      )
    );

    setEditingId(null);
  };

  // ===== Sidebar (icon + text) =====
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
        <button
          type="button"
          className="w-full flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted text-sm text-left"
          onClick={onClose}
        >
          <LayoutDashboard className="size-4" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          className="w-full flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted text-sm text-left"
          onClick={onClose}
        >
          <Stethoscope className="size-4" />
          <span>Clinics</span>
        </button>

        <button
          type="button"
          className="w-full flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted text-sm text-left"
          onClick={onClose}
        >
          <BarChart3 className="size-4" />
          <span>Status</span>
        </button>

        <button
          type="button"
          className="w-full flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted text-sm text-left"
          onClick={onClose}
        >
          <SettingsIcon className="size-4" />
          <span>Settings</span>
        </button>
      </nav>

      <div className="mt-auto p-3 border-t">
        <button
          type="button"
          className="w-full flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted text-sm text-red-600 text-left"
          onClick={onClose}
        >
          <LogOut className="size-4" />
          <span>Logout</span>
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
          <div className="font-semibold">Clinics</div>
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
            <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] shadow-xl bg-background">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main */}
        <main className="flex-1">
          {/* ✅ Full width content */}
          <div className="w-full px-3 sm:px-6 lg:px-8 py-6 grid gap-6">
            {/* Title */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-black">Clinics</h1>
            </div>

            {/* ✅ Control Panel: صف واحد مثل Camps + يملي العرض */}
            <div className="rounded-xl border bg-background p-4">
              <div className="text-lg font-semibold text-black mb-3 text-left" dir="ltr">
                Control Panel
              </div>

              <div
                dir="ltr"
                className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
              >
                {/* input */}
                <div className="flex-1 min-w-0">
                  <Input
                    value={q}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                    placeholder="Search"
                    className="h-11 w-full"
                  />
                </div>

                {/* actions */}
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                  <Button size="sm" className="h-11 bg-black text-white hover:bg-black/90 px-5" onClick={() => {}}>
                    Search
                  </Button>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'closed')}
                    className="h-11 rounded-md border bg-background px-3 text-sm min-w-[170px]"
                  >
                    <option value="all">Search by Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>

                  <Button size="sm" className="h-11 bg-black text-white hover:bg-black/90 px-5" onClick={() => setAddOpen(true)}>
                    + Create Clinics
                  </Button>

                  <Button
                    size="sm"
                    className="h-11 bg-black text-white hover:bg-black/90 px-5"
                    onClick={() => {
                      setItems([]);
                      setEditingId(null);
                      setPage(1);
                    }}
                  >
                    Delete All
                  </Button>
                </div>
              </div>
            </div>

            {/* ✅ Table - LTR order */}
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base text-right" dir="rtl">العيادات</CardTitle>
              </CardHeader>

              <CardContent className="p-4">
                <div className="rounded-lg border overflow-hidden bg-background">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-sm border-collapse min-w-[900px]" dir="ltr">
                      <thead className="bg-muted/60">
                        <tr className="text-left">
                          <th className="px-4 py-3 font-semibold border-b border-r whitespace-nowrap">Clinic Name</th>
                          <th className="px-4 py-3 font-semibold border-b border-r whitespace-nowrap">Specialty</th>
                          <th className="px-4 py-3 font-semibold border-b border-r whitespace-nowrap">Capacity/Day</th>
                          <th className="px-4 py-3 font-semibold border-b border-r whitespace-nowrap">Status</th>
                          <th className="px-4 py-3 font-semibold border-b whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {pageItems.map((c) => {
                          const isEditing = editingId === c.id;

                          return (
                            <tr key={c.id} className="hover:bg-muted/30">
                              {/* Clinic Name */}
                              <td className="px-4 py-3 border-b border-r font-medium">
                                {isEditing ? (
                                  <Input
                                    value={editDraft.nameAr}
                                    onChange={(e) => setEditDraft((p) => ({ ...p, nameAr: e.target.value }))}
                                    className="h-9 min-w-[220px]"
                                  />
                                ) : (
                                  c.nameAr
                                )}
                              </td>

                              {/* Specialty */}
                              <td className="px-4 py-3 border-b border-r">
                                {isEditing ? (
                                  <Input
                                    value={editDraft.specialtyAr}
                                    onChange={(e) => setEditDraft((p) => ({ ...p, specialtyAr: e.target.value }))}
                                    className="h-9 min-w-[180px]"
                                  />
                                ) : (
                                  c.specialtyAr
                                )}
                              </td>

                              {/* Capacity */}
                              <td className="px-4 py-3 border-b border-r">
                                {isEditing ? (
                                  <Input
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    type="text"
                                    value={editDraft.capacityPerDay ? String(editDraft.capacityPerDay) : ''}
                                    onChange={(e) =>
                                      setEditDraft((p) => ({
                                        ...p,
                                        capacityPerDay: toIntOnly(e.target.value),
                                      }))
                                    }
                                    className="h-9 w-28"
                                  />
                                ) : (
                                  c.capacityPerDay
                                )}
                              </td>

                              {/* Status */}
                              <td className="px-4 py-3 border-b border-r">
                                {isEditing ? (
                                  <select
                                    value={editDraft.status}
                                    onChange={(e) =>
                                      setEditDraft((p) => ({
                                        ...p,
                                        status: e.target.value as 'Open' | 'Closed',
                                      }))
                                    }
                                    className="h-9 rounded-md border px-3 bg-background min-w-[120px]"
                                  >
                                    <option value="Open">Open</option>
                                    <option value="Closed">Closed</option>
                                  </select>
                                ) : (
                                  <select
                                    value={c.status}
                                    onChange={(e) =>
                                      setItems((prev) =>
                                        prev.map((x) =>
                                          x.id === c.id ? { ...x, status: e.target.value as 'Open' | 'Closed' } : x
                                        )
                                      )
                                    }
                                    className="h-9 rounded-md border px-3 bg-background min-w-[120px]"
                                  >
                                    <option value="Open">Open</option>
                                    <option value="Closed">Closed</option>
                                  </select>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3 border-b">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {!isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        className="inline-flex items-center justify-center rounded-md border h-9 w-9 hover:bg-muted"
                                        title="Edit"
                                        onClick={() => startEditRow(c)}
                                      >
                                        <Pencil className="size-4" />
                                      </button>

                                      <button
                                        type="button"
                                        className="inline-flex items-center justify-center rounded-md border h-9 w-9 hover:bg-muted"
                                        title="Delete"
                                        onClick={() => onDeleteOne(c.id)}
                                      >
                                        <Trash2 className="size-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        size="sm"
                                        className="h-9 bg-black text-white hover:bg-black/90"
                                        onClick={() => saveEditRow(c.id)}
                                        disabled={!Number.isInteger(editDraft.capacityPerDay) || editDraft.capacityPerDay <= 0}
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
                            <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                              No clinics found
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

                    <div className="flex flex-wrap items-center gap-2">
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

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={safePage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={safePage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Clinic Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader dir="rtl" className="text-right">
                  <DialogTitle>إضافة عيادة</DialogTitle>
                  <DialogDescription>إدخال بيانات العيادة</DialogDescription>
                </DialogHeader>

                <div dir="rtl" className="grid gap-3">
                  <div className="grid gap-2">
                    <div className="text-sm">اسم العيادة</div>
                    <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: عيادة الشفاء" />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-sm">التخصص</div>
                    <Input value={specialtyAr} onChange={(e) => setSpecialtyAr(e.target.value)} placeholder="مثال: طب عام" />
                  </div>

                  <div className="grid gap-2">
                    <div className="text-sm">الطاقة اليومية</div>
                    <Input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      type="text"
                      value={capacity ? String(capacity) : ''}
                      onChange={(e) => setCapacity(toIntOnly(e.target.value))}
                      placeholder="مثال: 120"
                    />
                  </div>
                </div>

                <DialogFooter dir="rtl" className="gap-2">
                  <Button variant="outline" onClick={() => setAddOpen(false)}>إغلاق</Button>
                  <Button onClick={onAdd} disabled={!Number.isInteger(capacity) || capacity <= 0}>
                    إضافة
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
