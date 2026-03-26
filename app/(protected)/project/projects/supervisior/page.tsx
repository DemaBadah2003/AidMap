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

type Supervisor = {
  id: string
  nameAr: string
  phone: string
  status: 'نشط' | 'موقوف'
}

const supervisorsSeed: Supervisor[] = [
  {id: 'sp_01', nameAr: 'أحمد محمد', phone: '0599123456', status: 'نشط'},
  {id: 'sp_02', nameAr: 'سارة علي', phone: '0569876543', status: 'نشط'},
  {id: 'sp_03', nameAr: 'محمود حسن', phone: '0599001122', status: 'موقوف'},
]

const normalizePhone = (value: string) => value.replace(/[^\d+]/g, '')

export default function SupervisorsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Supervisor[]>(supervisorsSeed)

  // فلترة status من فوق
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<Supervisor['status']>('نشط')

  // Inline Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    nameAr: string
    phone: string
    status: Supervisor['status']
  }>({
    nameAr: '',
    phone: '',
    status: 'نشط',
  })

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((sp) => {
      const matchSearch =
        !s ||
        sp.id.toLowerCase().includes(s) ||
        sp.nameAr.includes(q) ||
        sp.phone.includes(q)

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? sp.status === 'نشط'
            : sp.status === 'موقوف'

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
    const ar = nameAr.trim()
    const ph = normalizePhone(phone.trim())
    if (!ar || !ph) return

    const newItem: Supervisor = {
      id: `sp_${Math.random().toString(16).slice(2, 8)}`,
      nameAr: ar,
      phone: ph,
      status,
    }

    setItems((prev) => [newItem, ...prev])
    setNameAr('')
    setPhone('')
    setStatus('نشط')
    setAddOpen(false)
  }

  const onDeleteOne = (id: string) => {
    if (editingId === id) setEditingId(null)
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  const startEditRow = (sp: Supervisor) => {
    setEditingId(sp.id)
    setEditDraft({
      nameAr: sp.nameAr,
      phone: sp.phone,
      status: sp.status,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = (id: string) => {
    const ar = editDraft.nameAr.trim()
    const ph = normalizePhone(editDraft.phone.trim())
    if (!ar || !ph) return

    setItems((prev) =>
      prev.map((sp) =>
        sp.id === id
          ? {
              ...sp,
              nameAr: ar,
              phone: ph,
              status: editDraft.status,
            }
          : sp
      )
    )

    setEditingId(null)
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 sm:px-6 py-6" dir="rtl">
      {/* Header */}
      <div className="mb-6" dir="ltr">
        <div className="text-left">
          <div className="text-2xl font-semibold text-foreground">Supervisors</div>

          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Supervisors Management</span>
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
                      placeholder="Search supervisors"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
                    className="h-10 w-full sm:w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All status</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    className="!h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 inline-flex items-center gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add supervisor
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
                <table className="w-full text-sm border-collapse min-w-[920px]">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-left text-foreground/60">
                      <th className="px-4 py-3 border-b border-r font-normal">Supervisor</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Phone</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Status</th>
                      <th className="px-4 py-3 border-b font-normal">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((sp) => {
                      const isEditing = editingId === sp.id
                      return (
                        <tr key={sp.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 border-b border-r font-medium">
                            {/* نفس نمط Users: الاسم + id تحت */}
                            {isEditing ? (
                              <Input
                                value={editDraft.nameAr}
                                onChange={(e) => setEditDraft((p) => ({...p, nameAr: e.target.value}))}
                                className="h-9"
                              />
                            ) : (
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">{sp.nameAr}</span>
                                <span className="text-xs text-muted-foreground">{sp.id}</span>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.phone}
                                onChange={(e) => setEditDraft((p) => ({...p, phone: normalizePhone(e.target.value)}))}
                                className="h-9"
                              />
                            ) : (
                              sp.phone
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <select
                                value={editDraft.status}
                                onChange={(e) =>
                                  setEditDraft((p) => ({...p, status: e.target.value as Supervisor['status']}))
                                }
                                className="h-9 rounded-md border px-3 bg-background"
                              >
                                <option value="نشط">نشط</option>
                                <option value="موقوف">موقوف</option>
                              </select>
                            ) : (
                              <span
                                className={
                                  sp.status === 'نشط'
                                    ? 'inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700'
                                    : 'inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700'
                                }
                              >
                                {sp.status}
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
                                    onClick={() => startEditRow(sp)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                    title="Delete"
                                    onClick={() => onDeleteOne(sp.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" className="h-10" onClick={() => saveEditRow(sp.id)}>
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
                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                          No supervisors found
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

        {/* Add Supervisor Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة مشرف</DialogTitle>
              <DialogDescription>إدخال بيانات المشرف</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">اسم المشرف</div>
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: أحمد محمد" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">رقم الجوال</div>
                <Input value={phone} onChange={(e) => setPhone(normalizePhone(e.target.value))} placeholder="مثال: 0599123456" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحالة</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Supervisor['status'])}
                  className="h-10 rounded-md border px-3 bg-background"
                >
                  <option value="نشط">نشط</option>
                  <option value="موقوف">موقوف</option>
                </select>
              </div>
            </div>

            <DialogFooter dir="rtl" className="gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                إغلاق
              </Button>
              <Button onClick={onAdd} disabled={!nameAr.trim() || !phone.trim()}>
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}