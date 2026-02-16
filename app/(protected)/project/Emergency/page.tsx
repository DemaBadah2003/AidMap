'use client'

import { useMemo, useState, type ChangeEvent, useEffect } from 'react'

import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../components/ui/dialog'

import { Pencil, Trash2, Save, X, Plus, Search } from 'lucide-react'

type EmergencyStatus = 'جديدة' | 'قيد المعالجة' | 'مغلقة'
type EmergencyLevel = 'منخفض' | 'متوسط' | 'مرتفع'

type Emergency = {
  emergencyId: string // PK
  shelterId: number // FK
  emergencyType: string
  emergencyDescription: string
  emergencyStatus: EmergencyStatus
  emergencyTime: string // نص (مثال: 2026-02-16 11:30)
  emergencyLevel: EmergencyLevel
  supervisor: string // رقم أو اسم
}

const emergencySeed: Emergency[] = [
  {
    emergencyId: 'em_01',
    shelterId: 12,
    emergencyType: 'حريق',
    emergencyDescription: 'حريق بسيط في المطبخ',
    emergencyStatus: 'قيد المعالجة',
    emergencyTime: '2026-02-16 10:20',
    emergencyLevel: 'مرتفع',
    supervisor: '1001',
  },
  {
    emergencyId: 'em_02',
    shelterId: 15,
    emergencyType: 'نقص مياه',
    emergencyDescription: 'انقطاع المياه عن المأوى',
    emergencyStatus: 'جديدة',
    emergencyTime: '2026-02-16 09:05',
    emergencyLevel: 'متوسط',
    supervisor: '1002',
  },
  {
    emergencyId: 'em_03',
    shelterId: 8,
    emergencyType: 'إصابة',
    emergencyDescription: 'إصابة طفل أثناء اللعب',
    emergencyStatus: 'مغلقة',
    emergencyTime: '2026-02-15 18:40',
    emergencyLevel: 'منخفض',
    supervisor: '1003',
  },
]

// ✅ أرقام صحيحة فقط
const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

export default function EmergencyPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Emergency[]>(emergencySeed)

  // فلترة Status من فوق
  const [statusFilter, setStatusFilter] = useState<'all' | EmergencyStatus>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)

  const [shelterId, setShelterId] = useState<number>(0)
  const [emergencyType, setEmergencyType] = useState('')
  const [emergencyDescription, setEmergencyDescription] = useState('')
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStatus>('جديدة')
  const [emergencyTime, setEmergencyTime] = useState('')
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>('متوسط')
  const [supervisor, setSupervisor] = useState('')

  // Inline Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    shelterId: number
    emergencyType: string
    emergencyDescription: string
    emergencyStatus: EmergencyStatus
    emergencyTime: string
    emergencyLevel: EmergencyLevel
    supervisor: string
  }>({
    shelterId: 0,
    emergencyType: '',
    emergencyDescription: '',
    emergencyStatus: 'جديدة',
    emergencyTime: '',
    emergencyLevel: 'متوسط',
    supervisor: '',
  })

  // ✅ فلترة search + فلترة status
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((x) => {
      const matchSearch =
        !s ||
        x.emergencyId.toLowerCase().includes(s) ||
        String(x.shelterId).includes(s) ||
        x.emergencyType.toLowerCase().includes(s) ||
        x.emergencyDescription.toLowerCase().includes(s) ||
        x.emergencyTime.toLowerCase().includes(s) ||
        x.supervisor.toLowerCase().includes(s)

      const matchStatus = statusFilter === 'all' ? true : x.emergencyStatus === statusFilter

      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

  // reset page
  useEffect(() => {
    setPage(1)
  }, [q, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const onAdd = () => {
    if (!Number.isInteger(shelterId) || shelterId <= 0) return
    if (!emergencyType.trim()) return
    if (!emergencyDescription.trim()) return
    if (!emergencyTime.trim()) return
    if (!supervisor.trim()) return

    const newItem: Emergency = {
      emergencyId: `em_${Math.random().toString(16).slice(2, 8)}`,
      shelterId,
      emergencyType: emergencyType.trim(),
      emergencyDescription: emergencyDescription.trim(),
      emergencyStatus,
      emergencyTime: emergencyTime.trim(),
      emergencyLevel,
      supervisor: supervisor.trim(),
    }

    setItems((prev) => [newItem, ...prev])

    setShelterId(0)
    setEmergencyType('')
    setEmergencyDescription('')
    setEmergencyStatus('جديدة')
    setEmergencyTime('')
    setEmergencyLevel('متوسط')
    setSupervisor('')
    setAddOpen(false)
  }

  const onDeleteOne = (id: string) => {
    if (editingId === id) setEditingId(null)
    setItems((prev) => prev.filter((x) => x.emergencyId !== id))
  }

  const startEditRow = (row: Emergency) => {
    setEditingId(row.emergencyId)
    setEditDraft({
      shelterId: row.shelterId,
      emergencyType: row.emergencyType,
      emergencyDescription: row.emergencyDescription,
      emergencyStatus: row.emergencyStatus,
      emergencyTime: row.emergencyTime,
      emergencyLevel: row.emergencyLevel,
      supervisor: row.supervisor,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = (id: string) => {
    if (!Number.isInteger(editDraft.shelterId) || editDraft.shelterId <= 0) return
    if (!editDraft.emergencyType.trim()) return
    if (!editDraft.emergencyDescription.trim()) return
    if (!editDraft.emergencyTime.trim()) return
    if (!editDraft.supervisor.trim()) return

    setItems((prev) =>
      prev.map((x) =>
        x.emergencyId === id
          ? {
              ...x,
              shelterId: editDraft.shelterId,
              emergencyType: editDraft.emergencyType.trim(),
              emergencyDescription: editDraft.emergencyDescription.trim(),
              emergencyStatus: editDraft.emergencyStatus,
              emergencyTime: editDraft.emergencyTime.trim(),
              emergencyLevel: editDraft.emergencyLevel,
              supervisor: editDraft.supervisor.trim(),
            }
          : x
      )
    )

    setEditingId(null)
  }

  // Pagination label
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 sm:px-6 py-6" dir="rtl">
      {/* Header */}
      <div className="mb-6" dir="ltr">
        <div className="text-left">
          <div className="text-2xl font-semibold text-foreground">Emergency</div>

          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Emergency Management</span>
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
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="Search emergency"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | EmergencyStatus)}
                    className="h-10 w-full sm:w-[190px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All status</option>
                    <option value="جديدة">جديدة</option>
                    <option value="قيد المعالجة">قيد المعالجة</option>
                    <option value="مغلقة">مغلقة</option>
                  </select>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    className="!h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 inline-flex items-center gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add emergency
                  </Button>

                  <Button
                    variant="outline"
                    className="!h-10 !rounded-lg !px-4 !text-sm !font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setItems([])
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
                <table className="w-full text-sm border-collapse min-w-[1200px]">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-left text-foreground/60">
                      <th className="px-4 py-3 border-b border-r font-normal">Emergency ID (PK)</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Shelter ID (FK)</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Emergency Type</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Description</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Status</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Time</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Level</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Supervisor</th>
                      <th className="px-4 py-3 border-b font-normal">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((row) => {
                      const isEditing = editingId === row.emergencyId

                      return (
                        <tr key={row.emergencyId} className="hover:bg-muted/30">
                          <td className="px-4 py-3 border-b border-r font-medium">{row.emergencyId}</td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="text"
                                value={editDraft.shelterId ? String(editDraft.shelterId) : ''}
                                onChange={(e) => setEditDraft((p) => ({ ...p, shelterId: toIntOnly(e.target.value) }))}
                                className="h-10"
                              />
                            ) : (
                              row.shelterId
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r" dir="rtl">
                            {isEditing ? (
                              <Input
                                value={editDraft.emergencyType}
                                onChange={(e) => setEditDraft((p) => ({ ...p, emergencyType: e.target.value }))}
                                className="h-10"
                              />
                            ) : (
                              row.emergencyType
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r" dir="rtl">
                            {isEditing ? (
                              <Input
                                value={editDraft.emergencyDescription}
                                onChange={(e) =>
                                  setEditDraft((p) => ({ ...p, emergencyDescription: e.target.value }))
                                }
                                className="h-10"
                              />
                            ) : (
                              row.emergencyDescription
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r" dir="rtl">
                            {isEditing ? (
                              <select
                                value={editDraft.emergencyStatus}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    emergencyStatus: e.target.value as EmergencyStatus,
                                  }))
                                }
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                              >
                                <option value="جديدة">جديدة</option>
                                <option value="قيد المعالجة">قيد المعالجة</option>
                                <option value="مغلقة">مغلقة</option>
                              </select>
                            ) : (
                              <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs">
                                {row.emergencyStatus}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.emergencyTime}
                                onChange={(e) => setEditDraft((p) => ({ ...p, emergencyTime: e.target.value }))}
                                className="h-10"
                              />
                            ) : (
                              row.emergencyTime
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r" dir="rtl">
                            {isEditing ? (
                              <select
                                value={editDraft.emergencyLevel}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    emergencyLevel: e.target.value as EmergencyLevel,
                                  }))
                                }
                                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                              >
                                <option value="منخفض">منخفض</option>
                                <option value="متوسط">متوسط</option>
                                <option value="مرتفع">مرتفع</option>
                              </select>
                            ) : (
                              <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs">
                                {row.emergencyLevel}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r" dir="rtl">
                            {isEditing ? (
                              <Input
                                value={editDraft.supervisor}
                                onChange={(e) => setEditDraft((p) => ({ ...p, supervisor: e.target.value }))}
                                className="h-10"
                              />
                            ) : (
                              row.supervisor
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
                                    onClick={() => startEditRow(row)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                    title="Delete"
                                    onClick={() => onDeleteOne(row.emergencyId)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" className="h-10" onClick={() => saveEditRow(row.emergencyId)}>
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
                        <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                          No emergency found
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

        {/* Add Emergency Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة طوارئ</DialogTitle>
              <DialogDescription>إدخال بيانات الطوارئ</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">Shelter ID (FK)</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={shelterId ? String(shelterId) : ''}
                  onChange={(e) => setShelterId(toIntOnly(e.target.value))}
                  placeholder="مثال: 12"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">نوع الطوارئ</div>
                <Input value={emergencyType} onChange={(e) => setEmergencyType(e.target.value)} placeholder="مثال: حريق" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">وصف الطوارئ</div>
                <Input
                  value={emergencyDescription}
                  onChange={(e) => setEmergencyDescription(e.target.value)}
                  placeholder="مثال: حريق بسيط في المطبخ"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">حالة الطوارئ</div>
                <select
                  value={emergencyStatus}
                  onChange={(e) => setEmergencyStatus(e.target.value as EmergencyStatus)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="جديدة">جديدة</option>
                  <option value="قيد المعالجة">قيد المعالجة</option>
                  <option value="مغلقة">مغلقة</option>
                </select>
              </div>

              <div className="grid gap-2">
                <div className="text-sm">وقت الطوارئ</div>
                <Input
                  value={emergencyTime}
                  onChange={(e) => setEmergencyTime(e.target.value)}
                  placeholder="مثال: 2026-02-16 11:30"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">درجة الطوارئ</div>
                <select
                  value={emergencyLevel}
                  onChange={(e) => setEmergencyLevel(e.target.value as EmergencyLevel)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="منخفض">منخفض</option>
                  <option value="متوسط">متوسط</option>
                  <option value="مرتفع">مرتفع</option>
                </select>
              </div>

              <div className="grid gap-2">
                <div className="text-sm">رقم/اسم المسؤول</div>
                <Input value={supervisor} onChange={(e) => setSupervisor(e.target.value)} placeholder="مثال: 1001" />
              </div>
            </div>

            <DialogFooter dir="rtl" className="gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                إغلاق
              </Button>
              <Button
                onClick={onAdd}
                disabled={
                  !Number.isInteger(shelterId) ||
                  shelterId <= 0 ||
                  !emergencyType.trim() ||
                  !emergencyDescription.trim() ||
                  !emergencyTime.trim() ||
                  !supervisor.trim()
                }
              >
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}