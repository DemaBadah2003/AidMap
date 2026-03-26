'use client'

import {useMemo, useState, type ChangeEvent} from 'react'

import {Card, CardContent} from '../../../../../components/ui/card'
import {Button} from '../../../../../components/ui/button'
import {Input} from '../../../../../components/ui/input'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../../components/ui/dialog'

import {Pencil, Trash2, Save, X, Plus, Search} from 'lucide-react'

type Shelter = {
  id: string
  nameAr: string
  areaAr: string
  supervisorAr: string
  phone: string
  familiesCount: number
  capacity: number
}

const sheltersSeed: Shelter[] = [
  {
    id: 'sh_01',
    nameAr: 'مركز إيواء الشمال A',
    areaAr: 'شمال غزة',
    supervisorAr: 'أحمد علي',
    phone: '0599123456',
    familiesCount: 320,
    capacity: 2000,
  },
  {
    id: 'sh_02',
    nameAr: 'مركز إيواء الوسط B',
    areaAr: 'الوسطى',
    supervisorAr: 'سارة محمد',
    phone: '0569876543',
    familiesCount: 1400,
    capacity: 1400,
  },
  {
    id: 'sh_03',
    nameAr: 'مركز إيواء الجنوب C',
    areaAr: 'خانيونس',
    supervisorAr: 'محمود حسن',
    phone: '0599001122',
    familiesCount: 850,
    capacity: 900,
  },
]

type FillStatus = 'Full' | 'Not Full'

const defaultFillStatus = (families: number, capacity: number): FillStatus =>
  families >= capacity ? 'Full' : 'Not Full'

// ✅ أرقام صحيحة فقط
const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

export default function SheltersPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Shelter[]>(sheltersSeed)

  // فلترة status (Full / Not Full) من فوق
  const [statusFilter, setStatusFilter] = useState<'all' | 'full' | 'notfull'>('all')

  // اختيار status لكل صف
  const [statusPick, setStatusPick] = useState<Record<string, FillStatus>>({})

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [areaAr, setAreaAr] = useState('')
  const [supervisorAr, setSupervisorAr] = useState('')
  const [phone, setPhone] = useState('')
  const [capacity, setCapacity] = useState<number>(0)

  // Inline Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    nameAr: string
    areaAr: string
    supervisorAr: string
    phone: string
    capacity: number
    fillStatus: FillStatus
  }>({
    nameAr: '',
    areaAr: '',
    supervisorAr: '',
    phone: '',
    capacity: 1,
    fillStatus: 'Not Full',
  })

  // ✅ فلترة search + فلترة status
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((sh) => {
      const matchSearch =
        !s ||
        sh.id.toLowerCase().includes(s) ||
        sh.nameAr.includes(q) ||
        sh.areaAr.includes(q) ||
        sh.supervisorAr.includes(q) ||
        sh.phone.includes(q)

      const rowStatus: FillStatus =
        statusPick[sh.id] ?? defaultFillStatus(sh.familiesCount, sh.capacity)

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'full'
            ? rowStatus === 'Full'
            : rowStatus === 'Not Full'

      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter, statusPick])

  useMemo(() => {
    setPage(1)
  }, [q, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const onAdd = () => {
    const ar = nameAr.trim()
    const area = areaAr.trim()
    const sup = supervisorAr.trim()
    const ph = phone.trim()

    if (!ar || !area || !sup || !ph || !Number.isInteger(capacity) || capacity <= 0) return

    const newItem: Shelter = {
      id: `sh_${Math.random().toString(16).slice(2, 8)}`,
      nameAr: ar,
      areaAr: area,
      supervisorAr: sup,
      phone: ph,
      familiesCount: 0,
      capacity,
    }

    setItems((prev) => [newItem, ...prev])
    setNameAr('')
    setAreaAr('')
    setSupervisorAr('')
    setPhone('')
    setCapacity(0)
    setAddOpen(false)
  }

  const onDeleteOne = (id: string) => {
    if (editingId === id) setEditingId(null)

    setItems((prev) => prev.filter((x) => x.id !== id))
    setStatusPick((prev) => {
      const next = {...prev}
      delete next[id]
      return next
    })
  }

  const startEditRow = (sh: Shelter) => {
    const currentStatus: FillStatus =
      statusPick[sh.id] ?? defaultFillStatus(sh.familiesCount, sh.capacity)

    setEditingId(sh.id)
    setEditDraft({
      nameAr: sh.nameAr,
      areaAr: sh.areaAr,
      supervisorAr: sh.supervisorAr,
      phone: sh.phone,
      capacity: sh.capacity,
      fillStatus: currentStatus,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = (id: string) => {
    const ar = editDraft.nameAr.trim()
    const area = editDraft.areaAr.trim()
    const sup = editDraft.supervisorAr.trim()
    const ph = editDraft.phone.trim()

    if (!ar || !area || !sup || !ph || !Number.isInteger(editDraft.capacity) || editDraft.capacity <= 0) return

    setItems((prev) =>
      prev.map((sh) =>
        sh.id === id
          ? {
              ...sh,
              nameAr: ar,
              areaAr: area,
              supervisorAr: sup,
              phone: ph,
              capacity: editDraft.capacity,
            }
          : sh
      )
    )

    setStatusPick((prev) => ({...prev, [id]: editDraft.fillStatus}))
    setEditingId(null)
  }

  // Pagination label: "1 - 10 of N"
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 sm:px-6 py-6" dir="rtl">
      {/* Header */}
      <div className="mb-6" dir="ltr">
        <div className="text-left">
          <div className="text-2xl font-semibold text-foreground">Shelters</div>

          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Shelters Management</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px]">
        <Card>
          <CardContent className="p-0" dir="ltr">
            {/* Toolbar */}
            <div className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Left */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {/* ✅ Search مطابق Users */}
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="Search shelters"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  {/* ✅ Select مطابق Users */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'full' | 'notfull')}
                    className="h-10 w-full sm:w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All status</option>
                    <option value="full">Full</option>
                    <option value="notfull">Not Full</option>
                  </select>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 justify-end">
                  {/* ✅ زر Add shelter مطابق */}
                  <Button
                    className="!h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 inline-flex items-center gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add shelter
                  </Button>

                  <Button
                    variant="outline"
                    className="!h-10 !rounded-lg !px-4 !text-sm !font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setItems([])
                      setStatusPick({})
                      setEditingId(null)
                    }}
                  >
                    Delete all
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* Table */}
            <div className="rounded-b-lg overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[980px]">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-left text-foreground/60">
                      <th className="px-4 py-3 border-b border-r font-normal">Shelter Name</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Area</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Supervisor</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Phone</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Capacity</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Status</th>
                      <th className="px-4 py-3 border-b font-normal">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((sh) => {
                      const isEditing = editingId === sh.id
                      const currentStatus: FillStatus =
                        statusPick[sh.id] ?? defaultFillStatus(sh.familiesCount, sh.capacity)

                      return (
                        <tr key={sh.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 border-b border-r font-medium">
                            {isEditing ? (
                              <Input
                                value={editDraft.nameAr}
                                onChange={(e) => setEditDraft((p) => ({...p, nameAr: e.target.value}))}
                                className="h-9"
                              />
                            ) : (
                              sh.nameAr
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.areaAr}
                                onChange={(e) => setEditDraft((p) => ({...p, areaAr: e.target.value}))}
                                className="h-9"
                              />
                            ) : (
                              sh.areaAr
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.supervisorAr}
                                onChange={(e) => setEditDraft((p) => ({...p, supervisorAr: e.target.value}))}
                                className="h-9"
                              />
                            ) : (
                              sh.supervisorAr
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.phone}
                                onChange={(e) => setEditDraft((p) => ({...p, phone: e.target.value}))}
                                className="h-9"
                              />
                            ) : (
                              sh.phone
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="text"
                                value={editDraft.capacity ? String(editDraft.capacity) : ''}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    capacity: toIntOnly(e.target.value),
                                  }))
                                }
                                className="h-9"
                              />
                            ) : (
                              sh.capacity
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <select
                                value={editDraft.fillStatus}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    fillStatus: e.target.value as FillStatus,
                                  }))
                                }
                                className="h-9 rounded-md border px-3 bg-background"
                              >
                                <option value="Full">Full</option>
                                <option value="Not Full">Not Full</option>
                              </select>
                            ) : (
                              <select
                                value={currentStatus}
                                onChange={(e) =>
                                  setStatusPick((prev) => ({
                                    ...prev,
                                    [sh.id]: e.target.value as FillStatus,
                                  }))
                                }
                                className="h-9 rounded-md border px-3 bg-background"
                              >
                                <option value="Full">Full</option>
                                <option value="Not Full">Not Full</option>
                              </select>
                            )}
                          </td>

                          <td className="px-4 py-3 border-b">
                            <div className="flex items-center gap-2">
                              {!isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                    title="Edit"
                                    onClick={() => startEditRow(sh)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                    title="Delete"
                                    onClick={() => onDeleteOne(sh.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-10"
                                    onClick={() => saveEditRow(sh.id)}
                                    disabled={!Number.isInteger(editDraft.capacity) || editDraft.capacity <= 0}
                                  >
                                    <Save className="size-4 me-2" />
                                    Save
                                  </Button>

                                  <Button size="sm" variant="outline" className="h-10" onClick={cancelEditRow}>
                                    <X className="size-4 me-2" />
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}

                    {!pageItems.length && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                          No shelters found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {rangeStart} - {rangeEnd} of {filtered.length}
                  </div>

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

        {/* Add Shelter Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة مركز إيواء</DialogTitle>
              <DialogDescription>إدخال بيانات المركز</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">اسم المركز</div>
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: مركز إيواء الشمال A" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المنطقة</div>
                <Input value={areaAr} onChange={(e) => setAreaAr(e.target.value)} placeholder="مثال: شمال غزة" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المشرف</div>
                <Input value={supervisorAr} onChange={(e) => setSupervisorAr(e.target.value)} placeholder="مثال: أحمد علي" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">رقم التواصل</div>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="مثال: 0599123456" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">السعة</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={capacity ? String(capacity) : ''}
                  onChange={(e) => setCapacity(toIntOnly(e.target.value))}
                  placeholder="مثال: 1500"
                />
              </div>
            </div>

            <DialogFooter dir="rtl" className="gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                إغلاق
              </Button>
              <Button onClick={onAdd} disabled={!Number.isInteger(capacity) || capacity <= 0}>
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}