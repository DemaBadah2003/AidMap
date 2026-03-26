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

type ContactType = 'اتصال' | 'واتساب' | 'إيميل' | 'زيارة'
type ContactStatus = 'تم' | 'لم يتم'

type Contact = {
  id: string
  citizenId: string
  institutionId: string
  contactType: ContactType
  notes: string
  status: ContactStatus
}

const contactsSeed: Contact[] = [
  {
    id: 'ct_01',
    citizenId: 'cit_01',
    institutionId: 'ins_01',
    contactType: 'اتصال',
    notes: 'تم التواصل وتأكيد البيانات',
    status: 'تم',
  },
  {
    id: 'ct_02',
    citizenId: 'cit_02',
    institutionId: 'ins_02',
    contactType: 'واتساب',
    notes: 'لم يتم الرد حتى الآن',
    status: 'لم يتم',
  },
  {
    id: 'ct_03',
    citizenId: 'cit_03',
    institutionId: 'ins_01',
    contactType: 'زيارة',
    notes: 'تمت الزيارة وتم تقديم المساعدة',
    status: 'تم',
  },
]

export default function ContactsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Contact[]>(contactsSeed)

  // فلترة status من فوق
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'notdone'>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [citizenId, setCitizenId] = useState('')
  const [institutionId, setInstitutionId] = useState('')
  const [contactType, setContactType] = useState<ContactType>('اتصال')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<ContactStatus>('لم يتم')

  // Inline Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    citizenId: string
    institutionId: string
    contactType: ContactType
    notes: string
    status: ContactStatus
  }>({
    citizenId: '',
    institutionId: '',
    contactType: 'اتصال',
    notes: '',
    status: 'لم يتم',
  })

  // ✅ فلترة search + status
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((c) => {
      const matchSearch =
        !s ||
        c.id.toLowerCase().includes(s) ||
        c.citizenId.toLowerCase().includes(s) ||
        c.institutionId.toLowerCase().includes(s) ||
        c.notes.toLowerCase().includes(s) ||
        c.contactType.includes(q)

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'done'
            ? c.status === 'تم'
            : c.status === 'لم يتم'

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
    const cit = citizenId.trim()
    const ins = institutionId.trim()
    const n = notes.trim()

    if (!cit || !ins || !n) return

    const newItem: Contact = {
      id: `ct_${Math.random().toString(16).slice(2, 8)}`,
      citizenId: cit,
      institutionId: ins,
      contactType,
      notes: n,
      status,
    }

    setItems((prev) => [newItem, ...prev])
    setCitizenId('')
    setInstitutionId('')
    setContactType('اتصال')
    setNotes('')
    setStatus('لم يتم')
    setAddOpen(false)
  }

  const onDeleteOne = (id: string) => {
    if (editingId === id) setEditingId(null)
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  const startEditRow = (c: Contact) => {
    setEditingId(c.id)
    setEditDraft({
      citizenId: c.citizenId,
      institutionId: c.institutionId,
      contactType: c.contactType,
      notes: c.notes,
      status: c.status,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = (id: string) => {
    const cit = editDraft.citizenId.trim()
    const ins = editDraft.institutionId.trim()
    const n = editDraft.notes.trim()

    if (!cit || !ins || !n) return

    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              citizenId: cit,
              institutionId: ins,
              contactType: editDraft.contactType,
              notes: n,
              status: editDraft.status,
            }
          : c
      )
    )

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
          <div className="text-2xl font-semibold text-foreground">Contacts</div>

          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Contacts Management</span>
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
                      placeholder="Search contacts"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="h-10 w-full sm:w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All status</option>
                    <option value="done">تم</option>
                    <option value="notdone">لم يتم</option>
                  </select>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    className="!h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 inline-flex items-center gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add contact
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
                      <th className="px-4 py-3 border-b border-r font-normal">Citizen ID</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Institution ID</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Contact Type</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Notes</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Status</th>
                      <th className="px-4 py-3 border-b font-normal">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((c) => {
                      const isEditing = editingId === c.id

                      return (
                        <tr key={c.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 border-b border-r font-medium">
                            {isEditing ? (
                              <Input
                                value={editDraft.citizenId}
                                onChange={(e) => setEditDraft((p) => ({...p, citizenId: e.target.value}))}
                                className="h-9"
                              />
                            ) : (
                              c.citizenId
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.institutionId}
                                onChange={(e) => setEditDraft((p) => ({...p, institutionId: e.target.value}))}
                                className="h-9"
                              />
                            ) : (
                              c.institutionId
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <select
                                value={editDraft.contactType}
                                onChange={(e) =>
                                  setEditDraft((p) => ({...p, contactType: e.target.value as ContactType}))
                                }
                                className="h-9 rounded-md border px-3 bg-background"
                              >
                                <option value="اتصال">اتصال</option>
                                <option value="واتساب">واتساب</option>
                                <option value="إيميل">إيميل</option>
                                <option value="زيارة">زيارة</option>
                              </select>
                            ) : (
                              c.contactType
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.notes}
                                onChange={(e) => setEditDraft((p) => ({...p, notes: e.target.value}))}
                                className="h-9"
                              />
                            ) : (
                              c.notes
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <select
                                value={editDraft.status}
                                onChange={(e) =>
                                  setEditDraft((p) => ({...p, status: e.target.value as ContactStatus}))
                                }
                                className="h-9 rounded-md border px-3 bg-background"
                              >
                                <option value="تم">تم</option>
                                <option value="لم يتم">لم يتم</option>
                              </select>
                            ) : (
                              <select
                                value={c.status}
                                onChange={(e) => {
                                  const next = e.target.value as ContactStatus
                                  setItems((prev) => prev.map((x) => (x.id === c.id ? {...x, status: next} : x)))
                                }}
                                className="h-9 rounded-md border px-3 bg-background"
                              >
                                <option value="تم">تم</option>
                                <option value="لم يتم">لم يتم</option>
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
                                    onClick={() => startEditRow(c)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                    title="Delete"
                                    onClick={() => onDeleteOne(c.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" className="h-10" onClick={() => saveEditRow(c.id)}>
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
                          No contacts found
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
                    {(filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1)} -{' '}
                    {Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
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

        {/* Add Contact Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة تواصل</DialogTitle>
              <DialogDescription>إدخال بيانات التواصل</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">Citizen ID</div>
                <Input value={citizenId} onChange={(e) => setCitizenId(e.target.value)} placeholder="مثال: cit_01" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">Institution ID</div>
                <Input
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  placeholder="مثال: ins_01"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">نوع التواصل</div>
                <select
                  value={contactType}
                  onChange={(e) => setContactType(e.target.value as ContactType)}
                  className="h-10 rounded-md border px-3 bg-background"
                >
                  <option value="اتصال">اتصال</option>
                  <option value="واتساب">واتساب</option>
                  <option value="إيميل">إيميل</option>
                  <option value="زيارة">زيارة</option>
                </select>
              </div>

              <div className="grid gap-2">
                <div className="text-sm">ملاحظات التواصل</div>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مثال: تم التواصل..." />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">حالة التواصل</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContactStatus)}
                  className="h-10 rounded-md border px-3 bg-background"
                >
                  <option value="تم">تم</option>
                  <option value="لم يتم">لم يتم</option>
                </select>
              </div>
            </div>

            <DialogFooter dir="rtl" className="gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                إغلاق
              </Button>
              <Button onClick={onAdd} disabled={!citizenId.trim() || !institutionId.trim() || !notes.trim()}>
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}