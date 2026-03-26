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

type Priority = 'مستعجل' | 'عادي' | 'حرج'

type Beneficiary = {
  id: string
  nameAr: string
  phone: string
  familyCount: number
  campName: string
  priority: Priority
}

const beneficiariesSeed: Beneficiary[] = [
  {
    id: 'bf_01',
    nameAr: 'أحمد محمد',
    phone: '+970-111-222',
    familyCount: 6,
    campName: 'مخيم الوسط B',
    priority: 'مستعجل',
  },
  {
    id: 'bf_02',
    nameAr: 'سلوى علي',
    phone: '+970-333-444',
    familyCount: 3,
    campName: 'مخيم الشمال A',
    priority: 'عادي',
  },
  {
    id: 'bf_03',
    nameAr: 'خالد حسن',
    phone: '+970-444-555',
    familyCount: 8,
    campName: 'مخيم الجنوب C',
    priority: 'حرج',
  },
]

// أرقام صحيحة فقط
const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

const normalizePhone = (v: string) => v.trim()

// ✅ FIX: استخدام theme colors بدل red-600
const badgeClassByPriority = (p: Priority) => {
  if (p === 'مستعجل') return 'bg-primary text-primary-foreground'
  if (p === 'حرج') return 'bg-destructive text-destructive-foreground'
  return 'bg-muted text-foreground'
}

export default function BeneficiariesPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Beneficiary[]>(beneficiariesSeed)

  const [priorityFilter, setPriorityFilter] =
    useState<'all' | 'مستعجل' | 'عادي' | 'حرج'>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [phone, setPhone] = useState('')
  const [familyCount, setFamilyCount] = useState<number>(0)
  const [campName, setCampName] = useState('')
  const [priority, setPriority] = useState<Priority>('عادي')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    nameAr: string
    phone: string
    familyCount: number
    campName: string
    priority: Priority
  }>({
    nameAr: '',
    phone: '',
    familyCount: 1,
    campName: '',
    priority: 'عادي',
  })

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((b) => {
      const matchSearch =
        !s ||
        b.nameAr.includes(q) ||
        b.phone.toLowerCase().includes(s) ||
        b.campName.includes(q)

      const matchPriority =
        priorityFilter === 'all' ? true : b.priority === priorityFilter

      return matchSearch && matchPriority
    })
  }, [q, items, priorityFilter])

  useMemo(() => {
    setPage(1)
  }, [q, priorityFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const onAdd = () => {
    const ar = nameAr.trim()
    const ph = normalizePhone(phone)
    const camp = campName.trim()

    if (!ar || !ph || !camp || !Number.isInteger(familyCount) || familyCount <= 0)
      return

    const newItem: Beneficiary = {
      id: `bf_${Math.random().toString(16).slice(2, 8)}`,
      nameAr: ar,
      phone: ph,
      familyCount,
      campName: camp,
      priority,
    }

    setItems((prev) => [newItem, ...prev])
    setNameAr('')
    setPhone('')
    setFamilyCount(0)
    setCampName('')
    setPriority('عادي')
    setAddOpen(false)
  }

  const onDeleteOne = (id: string) => {
    if (editingId === id) setEditingId(null)
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  const startEditRow = (b: Beneficiary) => {
    setEditingId(b.id)
    setEditDraft({
      nameAr: b.nameAr,
      phone: b.phone,
      familyCount: b.familyCount,
      campName: b.campName,
      priority: b.priority,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = (id: string) => {
    const ar = editDraft.nameAr.trim()
    const ph = normalizePhone(editDraft.phone)
    const camp = editDraft.campName.trim()

    if (!ar || !ph || !camp || !Number.isInteger(editDraft.familyCount) || editDraft.familyCount <= 0)
      return

    setItems((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              nameAr: ar,
              phone: ph,
              familyCount: editDraft.familyCount,
              campName: camp,
              priority: editDraft.priority,
            }
          : b
      )
    )

    setEditingId(null)
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 sm:px-6 py-6" dir="rtl">
      <div className="mb-6" dir="ltr">
        <div className="text-left">
          <div className="text-2xl font-semibold text-foreground">
            Beneficiaries
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Beneficiaries Management</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px]">
        <Card>
          <CardContent className="p-0" dir="ltr">
            {/* Toolbar */}
            <div className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setQ(e.target.value)
                      }
                      placeholder="Search beneficiaries"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm"
                    />
                  </div>

                  <select
                    value={priorityFilter}
                    onChange={(e) =>
                      setPriorityFilter(e.target.value as any)
                    }
                    className="h-10 w-full sm:w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="all">All priorities</option>
                    <option value="مستعجل">مستعجل</option>
                    <option value="عادي">عادي</option>
                    <option value="حرج">حرج</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button
                    className="!h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 inline-flex items-center gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add beneficiary
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
                <table className="w-full text-sm border-collapse min-w-[980px]">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-left text-foreground/60">
                      <th className="px-4 py-3 border-b border-r font-normal">
                        Beneficiary's Name
                      </th>
                      <th className="px-4 py-3 border-b border-r font-normal">
                        Phone
                      </th>
                      <th className="px-4 py-3 border-b border-r font-normal">
                        Number Of Family
                      </th>
                      <th className="px-4 py-3 border-b border-r font-normal">
                        Camp Name
                      </th>
                      <th className="px-4 py-3 border-b border-r font-normal">
                        Priority
                      </th>
                      <th className="px-4 py-3 border-b font-normal">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((b) => {
                      const isEditing = editingId === b.id

                      return (
                        <tr key={b.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 border-b border-r font-medium">
                            {b.nameAr}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {b.phone}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {b.familyCount}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {b.campName}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badgeClassByPriority(
                                b.priority
                              )}`}
                            >
                              {b.priority}
                            </span>
                          </td>

                          <td className="px-4 py-3 border-b">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                onClick={() => startEditRow(b)}
                              >
                                <Pencil className="size-4" />
                              </button>

                              <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                onClick={() => onDeleteOne(b.id)}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between p-4 border-t text-sm text-muted-foreground">
                <div>
                  {rangeStart} - {rangeEnd} of {filtered.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}