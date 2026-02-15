'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'

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

type Address = {
  id: string
  nameAr: string // اسم/وصف العنوان (مثلاً: عنوان الأسرة A)
  governorateAr: string // المحافظة
  cityAr: string // المدينة
  districtAr: string // الحي/المنطقة
  streetAr: string // الشارع
  buildingNo: number // رقم المبنى
}

const addressSeed: Address[] = [
  {
    id: 'ad_01',
    nameAr: 'عنوان الأسرة A',
    governorateAr: 'غزة',
    cityAr: 'غزة',
    districtAr: 'الرمال',
    streetAr: 'شارع عمر المختار',
    buildingNo: 12,
  },
  {
    id: 'ad_02',
    nameAr: 'عنوان الأسرة B',
    governorateAr: 'خانيونس',
    cityAr: 'خانيونس',
    districtAr: 'البلد',
    streetAr: 'شارع البحر',
    buildingNo: 4,
  },
  {
    id: 'ad_03',
    nameAr: 'عنوان المستفيد C',
    governorateAr: 'الوسطى',
    cityAr: 'دير البلح',
    districtAr: 'المعسكر',
    streetAr: 'شارع السوق',
    buildingNo: 18,
  },
]

// ✅ أرقام صحيحة فقط
const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

export default function AddressPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Address[]>(addressSeed)

  // فلترة المحافظة من فوق
  const [govFilter, setGovFilter] = useState<'all' | string>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [governorateAr, setGovernorateAr] = useState('')
  const [cityAr, setCityAr] = useState('')
  const [districtAr, setDistrictAr] = useState('')
  const [streetAr, setStreetAr] = useState('')
  const [buildingNo, setBuildingNo] = useState<number>(0)

  // Inline Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    nameAr: string
    governorateAr: string
    cityAr: string
    districtAr: string
    streetAr: string
    buildingNo: number
  }>({
    nameAr: '',
    governorateAr: '',
    cityAr: '',
    districtAr: '',
    streetAr: '',
    buildingNo: 0,
  })

  const governorates = useMemo(() => {
    const set = new Set(items.map((x) => x.governorateAr).filter(Boolean))
    return Array.from(set)
  }, [items])

  // ✅ فلترة search + فلترة المحافظة
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((a) => {
      const matchSearch =
        !s ||
        a.nameAr.toLowerCase().includes(s) ||
        a.governorateAr.toLowerCase().includes(s) ||
        a.cityAr.toLowerCase().includes(s) ||
        a.districtAr.toLowerCase().includes(s) ||
        a.streetAr.toLowerCase().includes(s) ||
        String(a.buildingNo).includes(s)

      const matchGov = govFilter === 'all' ? true : a.governorateAr === govFilter

      return matchSearch && matchGov
    })
  }, [q, items, govFilter])

  // ✅ reset page عند تغيير البحث/الفلتر/حجم الصفحة
  useEffect(() => {
    setPage(1)
  }, [q, govFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const onAdd = () => {
    const n = nameAr.trim()
    const g = governorateAr.trim()
    const c = cityAr.trim()
    const d = districtAr.trim()
    const st = streetAr.trim()

    if (!n || !g || !c || !d || !st || !Number.isInteger(buildingNo) || buildingNo <= 0) return

    const newItem: Address = {
      id: `ad_${Math.random().toString(16).slice(2, 8)}`,
      nameAr: n,
      governorateAr: g,
      cityAr: c,
      districtAr: d,
      streetAr: st,
      buildingNo,
    }

    setItems((prev) => [newItem, ...prev])
    setNameAr('')
    setGovernorateAr('')
    setCityAr('')
    setDistrictAr('')
    setStreetAr('')
    setBuildingNo(0)
    setAddOpen(false)
  }

  const onDeleteOne = (id: string) => {
    if (editingId === id) setEditingId(null)
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  const startEditRow = (a: Address) => {
    setEditingId(a.id)
    setEditDraft({
      nameAr: a.nameAr,
      governorateAr: a.governorateAr,
      cityAr: a.cityAr,
      districtAr: a.districtAr,
      streetAr: a.streetAr,
      buildingNo: a.buildingNo,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = (id: string) => {
    const n = editDraft.nameAr.trim()
    const g = editDraft.governorateAr.trim()
    const c = editDraft.cityAr.trim()
    const d = editDraft.districtAr.trim()
    const st = editDraft.streetAr.trim()

    if (!n || !g || !c || !d || !st || !Number.isInteger(editDraft.buildingNo) || editDraft.buildingNo <= 0)
      return

    setItems((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              nameAr: n,
              governorateAr: g,
              cityAr: c,
              districtAr: d,
              streetAr: st,
              buildingNo: editDraft.buildingNo,
            }
          : a
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
          <div className="text-2xl font-semibold text-foreground">Address</div>

          <div className="mt-1 text-sm text-muted-foreground">
            Home <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">Address Management</span>
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
                      placeholder="Search address"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  {/* Governorate filter */}
                  <select
                    value={govFilter}
                    onChange={(e) => setGovFilter(e.target.value)}
                    className="h-10 w-full sm:w-[200px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All governorates</option>
                    {governorates.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    className="!h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 inline-flex items-center gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add address
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
                      <th className="px-4 py-3 border-b border-r font-normal">Address Name</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Governorate</th>
                      <th className="px-4 py-3 border-b border-r font-normal">City</th>
                      <th className="px-4 py-3 border-b border-r font-normal">District</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Street</th>
                      <th className="px-4 py-3 border-b border-r font-normal">Building No</th>
                      <th className="px-4 py-3 border-b font-normal">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((a) => {
                      const isEditing = editingId === a.id

                      return (
                        <tr key={a.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 border-b border-r font-medium">
                            {isEditing ? (
                              <Input
                                value={editDraft.nameAr}
                                onChange={(e) => setEditDraft((p) => ({ ...p, nameAr: e.target.value }))}
                                className="h-10"
                              />
                            ) : (
                              a.nameAr
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.governorateAr}
                                onChange={(e) => setEditDraft((p) => ({ ...p, governorateAr: e.target.value }))}
                                className="h-10"
                              />
                            ) : (
                              a.governorateAr
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.cityAr}
                                onChange={(e) => setEditDraft((p) => ({ ...p, cityAr: e.target.value }))}
                                className="h-10"
                              />
                            ) : (
                              a.cityAr
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.districtAr}
                                onChange={(e) => setEditDraft((p) => ({ ...p, districtAr: e.target.value }))}
                                className="h-10"
                              />
                            ) : (
                              a.districtAr
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                value={editDraft.streetAr}
                                onChange={(e) => setEditDraft((p) => ({ ...p, streetAr: e.target.value }))}
                                className="h-10"
                              />
                            ) : (
                              a.streetAr
                            )}
                          </td>

                          <td className="px-4 py-3 border-b border-r">
                            {isEditing ? (
                              <Input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="text"
                                value={editDraft.buildingNo ? String(editDraft.buildingNo) : ''}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    buildingNo: toIntOnly(e.target.value),
                                  }))
                                }
                                className="h-10"
                              />
                            ) : (
                              a.buildingNo
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
                                    onClick={() => startEditRow(a)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted"
                                    title="Delete"
                                    onClick={() => onDeleteOne(a.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-10"
                                    onClick={() => saveEditRow(a.id)}
                                    disabled={!Number.isInteger(editDraft.buildingNo) || editDraft.buildingNo <= 0}
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
                          No address found
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

                  <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
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

        {/* Add Address Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة عنوان</DialogTitle>
              <DialogDescription>إدخال بيانات العنوان</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">اسم العنوان</div>
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: عنوان الأسرة A" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المحافظة</div>
                <Input value={governorateAr} onChange={(e) => setGovernorateAr(e.target.value)} placeholder="مثال: غزة" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المدينة</div>
                <Input value={cityAr} onChange={(e) => setCityAr(e.target.value)} placeholder="مثال: غزة" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحي / المنطقة</div>
                <Input value={districtAr} onChange={(e) => setDistrictAr(e.target.value)} placeholder="مثال: الرمال" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الشارع</div>
                <Input value={streetAr} onChange={(e) => setStreetAr(e.target.value)} placeholder="مثال: شارع عمر المختار" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">رقم المبنى</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={buildingNo ? String(buildingNo) : ''}
                  onChange={(e) => setBuildingNo(toIntOnly(e.target.value))}
                  placeholder="مثال: 12"
                />
              </div>
            </div>

            <DialogFooter dir="rtl" className="gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                إغلاق
              </Button>
              <Button
                onClick={onAdd}
                disabled={
                  !nameAr.trim() ||
                  !governorateAr.trim() ||
                  !cityAr.trim() ||
                  !districtAr.trim() ||
                  !streetAr.trim() ||
                  !Number.isInteger(buildingNo) ||
                  buildingNo <= 0
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