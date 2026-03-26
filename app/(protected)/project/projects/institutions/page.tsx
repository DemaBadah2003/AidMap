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

type PresenceStatus = 'متاح' | 'مشغول' | 'غير متاح'

type Institution = {
  id: string
  instagramId: string
  nameAr: string
  email: string
  serviceType: string
  presence: PresenceStatus
}

const institutionsSeed: Institution[] = [
  {
    id: 'ins_01',
    instagramId: 'inst_redcrescent',
    nameAr: 'الهلال الأحمر',
    email: 'info@redcrescent.org',
    serviceType: 'إغاثة',
    presence: 'متاح',
  },
  {
    id: 'ins_02',
    instagramId: 'inst_unicef',
    nameAr: 'يونيسف',
    email: 'contact@unicef.org',
    serviceType: 'دعم نفسي',
    presence: 'مشغول',
  },
  {
    id: 'ins_03',
    instagramId: 'inst_wfp',
    nameAr: 'برنامج الغذاء العالمي',
    email: 'support@wfp.org',
    serviceType: 'مساعدات غذائية',
    presence: 'غير متاح',
  },
]

const normalizeInstagram = (v: string) => v.trim().replace(/\s+/g, '_')
const normalizeEmail = (v: string) => v.trim()

export default function InstitutionsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Institution[]>(institutionsSeed)

  // فلترة presence من فوق
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'busy' | 'unavailable'>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [instagramId, setInstagramId] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [email, setEmail] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [presence, setPresence] = useState<PresenceStatus>('متاح')

  // Inline Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    instagramId: string
    nameAr: string
    email: string
    serviceType: string
    presence: PresenceStatus
  }>({
    instagramId: '',
    nameAr: '',
    email: '',
    serviceType: '',
    presence: 'متاح',
  })

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((ins) => {
      const matchSearch =
        !s ||
        ins.id.toLowerCase().includes(s) ||
        ins.instagramId.toLowerCase().includes(s) ||
        ins.nameAr.includes(q) ||
        ins.email.toLowerCase().includes(s) ||
        ins.serviceType.includes(q)

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'available'
            ? ins.presence === 'متاح'
            : statusFilter === 'busy'
              ? ins.presence === 'مشغول'
              : ins.presence === 'غير متاح'

      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

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
    const inst = normalizeInstagram(instagramId)
    const ar = nameAr.trim()
    const em = normalizeEmail(email)
    const st = serviceType.trim()

    if (!inst || !ar || !em || !st) return

    const newItem: Institution = {
      id: `ins_${Math.random().toString(16).slice(2, 8)}`,
      instagramId: inst,
      nameAr: ar,
      email: em,
      serviceType: st,
      presence,
    }

    setItems((prev) => [newItem, ...prev])
    setInstagramId('')
    setNameAr('')
    setEmail('')
    setServiceType('')
    setPresence('متاح')
    setAddOpen(false)
  }

  const onDeleteOne = (id: string) => {
    if (editingId === id) setEditingId(null)
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  const startEditRow = (ins: Institution) => {
    setEditingId(ins.id)
    setEditDraft({
      instagramId: ins.instagramId,
      nameAr: ins.nameAr,
      email: ins.email,
      serviceType: ins.serviceType,
      presence: ins.presence,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = (id: string) => {
    const inst = normalizeInstagram(editDraft.instagramId)
    const ar = editDraft.nameAr.trim()
    const em = normalizeEmail(editDraft.email)
    const st = editDraft.serviceType.trim()

    if (!inst || !ar || !em || !st) return

    setItems((prev) =>
      prev.map((ins) =>
        ins.id === id
          ? {
              ...ins,
              instagramId: inst,
              nameAr: ar,
              email: em,
              serviceType: st,
              presence: editDraft.presence,
            }
          : ins
      )
    )

    setEditingId(null)
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  const presenceBadgeClass = (p: PresenceStatus) =>
    p === 'متاح'
      ? 'bg-emerald-50 text-emerald-700'
      : p === 'مشغول'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-red-50 text-red-700'

  return (
    <div className="w-full px-3 sm:px-6 py-6" dir="rtl">
      {/* Header */}
      <div className="mb-6" dir="ltr">
        <div className="text-left">
          <div className="text-2xl font-semibold text-foreground">Institutions</div>

          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Institutions Management</span>
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
                  {/* Search */}
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="Search institutions"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  {/* Presence Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="h-10 w-full sm:w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All status</option>
                    <option value="available">متاح</option>
                    <option value="busy">مشغول</option>
                    <option value="unavailable">غير متاح</option>
                  </select>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    className="!h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 inline-flex items-center gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add institution
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
                <table className="w-full text-sm border-collapse min-w-[1100px]">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-left text-foreground/60">
                      <th className="px-4 py-3 border-b border-r font-normal">Institution</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Instagram ID</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Email</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Service Type</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Presence</th>
                      <th className="px-4 py-3 border-b font-normal">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((ins) => {
                      const isEditing = editingId === ins.id

                      return (
                        <tr key={ins.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 border-b border-r font-medium">
                            {isEditing ? (
                              <Input
                                value={editDraft.nameAr}
                                onChange={(e) => setEditDraft((p) => ({...p, nameAr: e.target.value}))}
                                className="h-9"
                              />
                            ) : (
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">{ins.nameAr}</span>
                                <span className="text-xs text-muted-foreground">{ins.id}</span>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.instagramId}
                                onChange={(e) => setEditDraft((p) => ({...p, instagramId: e.target.value}))}
                                className="h-9"
                              />
                            ) : (
                              ins.instagramId
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.email}
                                onChange={(e) => setEditDraft((p) => ({...p, email: e.target.value}))}
                                className="h-9"
                              />
                            ) : (
                              ins.email
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.serviceType}
                                onChange={(e) => setEditDraft((p) => ({...p, serviceType: e.target.value}))}
                                className="h-9"
                              />
                            ) : (
                              ins.serviceType
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <select
                                value={editDraft.presence}
                                onChange={(e) =>
                                  setEditDraft((p) => ({...p, presence: e.target.value as PresenceStatus}))
                                }
                                className="h-9 rounded-md border px-3 bg-background"
                              >
                                <option value="متاح">متاح</option>
                                <option value="مشغول">مشغول</option>
                                <option value="غير متاح">غير متاح</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${presenceBadgeClass(ins.presence)}`}
                              >
                                {ins.presence}
                              </span>
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
                                    onClick={() => startEditRow(ins)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                    title="Delete"
                                    onClick={() => onDeleteOne(ins.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" className="h-10" onClick={() => saveEditRow(ins.id)}>
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
                        <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                          No institutions found
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

        {/* Add Institution Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة مؤسسة</DialogTitle>
              <DialogDescription>إدخال بيانات المؤسسة</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">Instagram ID</div>
                <Input value={instagramId} onChange={(e) => setInstagramId(e.target.value)} placeholder="مثال: inst_org" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">اسم المؤسسة</div>
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: الهلال الأحمر" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">إيميل المؤسسة</div>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="مثال: info@org.com" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">نوع الخدمة</div>
                <Input value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="مثال: إغاثة" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">حالة التواجد</div>
                <select
                  value={presence}
                  onChange={(e) => setPresence(e.target.value as PresenceStatus)}
                  className="h-10 rounded-md border px-3 bg-background"
                >
                  <option value="متاح">متاح</option>
                  <option value="مشغول">مشغول</option>
                  <option value="غير متاح">غير متاح</option>
                </select>
              </div>
            </div>

            <DialogFooter dir="rtl" className="gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                إغلاق
              </Button>
              <Button
                onClick={onAdd}
                disabled={!instagramId.trim() || !nameAr.trim() || !email.trim() || !serviceType.trim()}
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