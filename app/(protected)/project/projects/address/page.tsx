'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { z } from 'zod'

import { Card, CardContent } from '../../../../../components/ui/card'
import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../../../components/ui/dialog'

import { Pencil, Trash2, Save, X, Plus, Search } from 'lucide-react'

type CampOption = {
  id: string
  name: string
}

type Address = {
  id: string
  governorate: string
  city: string
  campId: string
  createdAt?: string
  updatedAt?: string
  camp?: {
    id: string
    name: string
  } | null
}

const ADDRESS_BASE_URL = '/api/project/projects/address'
const CAMPS_BASE_URL = '/api/project/projects/camps?forBeneficiary=true'

const createAddressSchema = z.object({
  governorate: z.string().trim().min(1, 'المحافظة مطلوبة'),
  city: z.string().trim().min(1, 'المدينة مطلوبة'),
  campId: z.string().trim().min(1, 'المخيم مطلوب'),
})

const updateAddressSchema = z
  .object({
    governorate: z.string().trim().min(1, 'المحافظة مطلوبة').optional(),
    city: z.string().trim().min(1, 'المدينة مطلوبة').optional(),
    campId: z.string().trim().min(1, 'المخيم مطلوب').optional(),
  })
  .strict()

const normalizeText = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()

function getErrorMessage(err: unknown) {
  if (err instanceof z.ZodError) {
    return err.issues[0]?.message ?? 'البيانات المدخلة غير صحيحة'
  }

  return err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
}

async function requestJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    cache: 'no-store',
  })

  const text = await res.text()
  let data: any = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text || null
  }

  if (!res.ok) {
    const msg = data?.message ?? `فشل الطلب: ${res.status}`
    throw new Error(msg)
  }

  return data as T
}

async function readAddresses(): Promise<Address[]> {
  return requestJSON<Address[]>(ADDRESS_BASE_URL)
}

async function readCampOptions(): Promise<CampOption[]> {
  return requestJSON<CampOption[]>(CAMPS_BASE_URL)
}

function findDuplicateAddress(
  items: Address[],
  input: { governorate: string; city: string; campId: string },
  excludeId?: string
) {
  const normalizedGovernorate = normalizeText(input.governorate)
  const normalizedCity = normalizeText(input.city)
  const normalizedCampId = input.campId.trim()

  const duplicate = items.find(
    (a) =>
      a.id !== excludeId &&
      normalizeText(a.governorate ?? '') === normalizedGovernorate &&
      normalizeText(a.city ?? '') === normalizedCity &&
      (a.campId ?? '') === normalizedCampId
  )

  if (duplicate) {
    return 'العنوان موجود بالفعل (بيانات مكررة).'
  }

  return ''
}

async function assertAddressBusinessValidation(
  input: { governorate: string; city: string; campId: string },
  items: Address[],
  excludeId?: string
) {
  const normalizedGovernorate = normalizeText(input.governorate)
  const normalizedCity = normalizeText(input.city)
  const normalizedCampId = input.campId.trim()

  if (!normalizedGovernorate) {
    throw new Error('المحافظة مطلوبة')
  }

  if (!normalizedCity) {
    throw new Error('المدينة مطلوبة')
  }

  if (!normalizedCampId) {
    throw new Error('المخيم مطلوب')
  }

  const duplicateMessage = findDuplicateAddress(items, input, excludeId)

  if (duplicateMessage) {
    throw new Error(duplicateMessage)
  }
}

async function createAddress(
  input: unknown,
  items: Address[]
): Promise<Address> {
  const body = createAddressSchema.parse(input)

  await assertAddressBusinessValidation(
    {
      governorate: body.governorate,
      city: body.city,
      campId: body.campId,
    },
    items
  )

  return requestJSON<Address>(ADDRESS_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

async function updateAddress(
  id: string,
  input: unknown,
  items: Address[]
): Promise<Address> {
  if (!id) throw new Error('معرّف العنوان مفقود')

  const body = updateAddressSchema.parse(input)
  const existing = items.find((x) => x.id === id)

  if (!existing) {
    throw new Error('العنوان غير موجود')
  }

  const merged = {
    governorate: body.governorate ?? existing.governorate ?? '',
    city: body.city ?? existing.city ?? '',
    campId: body.campId ?? existing.campId ?? '',
  }

  await assertAddressBusinessValidation(merged, items, id)

  return requestJSON<Address>(`${ADDRESS_BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

async function deleteAddress(id: string): Promise<void> {
  if (!id) throw new Error('معرّف العنوان مفقود')

  await requestJSON(`${ADDRESS_BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

async function deleteAllAddresses(): Promise<void> {
  await requestJSON(`${ADDRESS_BASE_URL}?all=true`, {
    method: 'DELETE',
  })
}

const addressesApi = {
  list: readAddresses,
  create: createAddress,
  update: updateAddress,
  remove: deleteAddress,
  removeAll: deleteAllAddresses,
}

export default function AddressPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Address[]>([])
  const [campOptions, setCampOptions] = useState<CampOption[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [campFilter, setCampFilter] = useState<'all' | string>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [governorate, setGovernorate] = useState('')
  const [city, setCity] = useState('')
  const [campId, setCampId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addFormError, setAddFormError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    governorate: string
    city: string
    campId: string
  }>({
    governorate: '',
    city: '',
    campId: '',
  })

  const topControlHeight = 'h-10 sm:h-11'
  const fixedButtonClass =
    'h-10 sm:h-11 min-w-[110px] sm:min-w-[130px] px-4 sm:px-5 rounded-lg text-xs sm:text-sm shrink-0 flex-none whitespace-nowrap'
  const fixedIconButtonClass =
    'inline-flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 flex-none items-center justify-center rounded-lg border'
  const tableBtnClass =
    'h-9 sm:h-10 rounded-lg px-3 sm:px-4 text-xs sm:text-sm font-semibold shrink-0 flex-none whitespace-nowrap'
  const selectBaseClass =
    'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-200'
  const inputBaseClass =
    'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-200'

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        const [addressesData, campsData] = await Promise.all([
          addressesApi.list(),
          readCampOptions(),
        ])

        setItems(Array.isArray(addressesData) ? addressesData : [])
        setCampOptions(Array.isArray(campsData) ? campsData : [])
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  const filtered = useMemo(() => {
    const s = normalizeText(q)

    return items.filter((a) => {
      const matchSearch =
        !s ||
        normalizeText(a.governorate ?? '').includes(s) ||
        normalizeText(a.city ?? '').includes(s) ||
        normalizeText(a.camp?.name ?? '').includes(s)

      const matchCamp = campFilter === 'all' ? true : a.campId === campFilter

      return matchSearch && matchCamp
    })
  }, [q, items, campFilter])

  useEffect(() => {
    setPage(1)
  }, [q, campFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const resetAddForm = () => {
    setGovernorate('')
    setCity('')
    setCampId('')
    setAddFormError('')
  }

  const isAddFormValid =
    !!governorate.trim() &&
    !!city.trim() &&
    !!campId.trim()

  const onAdd = async () => {
    const nextGovernorate = governorate.trim()
    const nextCity = city.trim()
    const nextCampId = campId.trim()

    if (!nextGovernorate || !nextCity || !nextCampId) {
      setAddFormError('يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح')
      return
    }

    setSubmitting(true)
    setError('')
    setAddFormError('')

    try {
      const created = await addressesApi.create(
        {
          governorate: nextGovernorate,
          city: nextCity,
          campId: nextCampId,
        },
        items
      )

      setItems((prev) => [created, ...prev])

      resetAddForm()
      setAddOpen(false)
    } catch (err) {
      setAddFormError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteOne = async (id: string) => {
    try {
      setError('')
      await addressesApi.remove(id)

      if (editingId === id) setEditingId(null)
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const startEditRow = (a: Address) => {
    setEditingId(a.id)
    setEditDraft({
      governorate: a.governorate ?? '',
      city: a.city ?? '',
      campId: a.campId ?? '',
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = async (id: string) => {
    const nextGovernorate = editDraft.governorate.trim()
    const nextCity = editDraft.city.trim()
    const nextCampId = editDraft.campId.trim()

    if (!nextGovernorate || !nextCity || !nextCampId) {
      setError('يرجى تعبئة البيانات بشكل صحيح قبل الحفظ')
      return
    }

    try {
      setError('')

      const updated = await addressesApi.update(
        id,
        {
          governorate: nextGovernorate,
          city: nextCity,
          campId: nextCampId,
        },
        items
      )

      setItems((prev) => prev.map((a) => (a.id === id ? updated : a)))
      setEditingId(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const onDeleteAll = async () => {
    try {
      setError('')
      await addressesApi.removeAll()
      setItems([])
      setEditingId(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-2 py-3 sm:px-4 sm:py-5 lg:px-6" dir="rtl">
      <div className="mb-4 sm:mb-6 text-right">
        <div className="text-base font-semibold text-foreground sm:text-xl lg:text-2xl">
          العناوين
        </div>

        <div className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
          الرئيسية <span className="mx-1">{'>'}</span>
          <span className="text-foreground">إدارة العناوين</span>
        </div>

        {loading && (
          <div className="mt-2 text-[11px] text-muted-foreground sm:text-sm">
            جارٍ التحميل...
          </div>
        )}

        {!!error && <div className="mt-2 text-[11px] text-red-600 sm:text-sm">{error}</div>}
      </div>

      <div className="w-full max-w-full">
        <Card className="overflow-hidden">
          <CardContent className="p-0" dir="rtl">
            <div className="p-2 sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-nowrap items-center gap-2 sm:gap-3 overflow-x-auto pb-1">
                  <div className="relative min-w-[170px] flex-1 sm:min-w-[220px] sm:max-w-[280px]">
                    <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="ابحث عن عنوان"
                      className={`${inputBaseClass} ${topControlHeight} pr-9 pl-3`}
                    />
                  </div>

                  <div className="min-w-[140px] max-w-[180px] sm:min-w-[180px] sm:max-w-[220px] shrink-0">
                    <select
                      value={campFilter}
                      onChange={(e) => setCampFilter(e.target.value)}
                      className={`${selectBaseClass} ${topControlHeight} truncate`}
                    >
                      <option value="all">كل المخيمات</option>
                      {campOptions.map((camp) => (
                        <option key={camp.id} value={camp.id}>
                          {camp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Button
                    className={`!bg-blue-600 !text-white hover:!bg-blue-700 ${fixedButtonClass}`}
                    onClick={() => {
                      setAddFormError('')
                      setAddOpen(true)
                    }}
                  >
                    <Plus className="ms-1 h-4 w-4 shrink-0" />
                    إضافة عنوان
                  </Button>

                  <Button
                    variant="outline"
                    className={`border-slate-200 text-slate-700 hover:bg-slate-50 ${fixedButtonClass}`}
                    onClick={onDeleteAll}
                    disabled={!items.length}
                  >
                    حذف الكل
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t" />

            <div className="overflow-hidden rounded-b-lg">
              <div className="w-full overflow-x-auto">
                <table
                  className="w-full min-w-[760px] sm:min-w-[860px] lg:min-w-[980px] table-fixed border-collapse text-xs sm:text-sm lg:text-base"
                  dir="rtl"
                >
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-right text-foreground/60">
                      <th className="w-[24%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        المحافظة
                      </th>
                      <th className="w-[24%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        المدينة
                      </th>
                      <th className="w-[24%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        المخيم
                      </th>
                      <th className="w-[28%] border-b px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((a) => {
                      const isEditing = editingId === a.id

                      return (
                        <tr key={a.id} className="align-top hover:bg-muted/30">
                          <td className="border-b border-l px-2 py-3 text-right font-medium break-words sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <Input
                                value={editDraft.governorate}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    governorate: e.target.value,
                                  }))
                                }
                                className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                              />
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {a.governorate}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right break-words sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <Input
                                value={editDraft.city}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    city: e.target.value,
                                  }))
                                }
                                className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                              />
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {a.city}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                            <div className="w-[160px] sm:w-[190px] lg:w-[220px] max-w-full">
                              {isEditing ? (
                                <select
                                  value={editDraft.campId}
                                  onChange={(e) =>
                                    setEditDraft((p) => ({
                                      ...p,
                                      campId: e.target.value,
                                    }))
                                  }
                                  className="h-9 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-xs sm:text-sm lg:text-base truncate"
                                >
                                  <option value="">اختر المخيم</option>
                                  {campOptions.map((camp) => (
                                    <option key={camp.id} value={camp.id}>
                                      {camp.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                  {a.camp?.name ?? '-'}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="border-b px-2 py-3 sm:px-4 sm:py-4 lg:px-5">
                            <div className="flex flex-nowrap items-center justify-start gap-2 overflow-x-auto">
                              {!isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className={`${fixedIconButtonClass} hover:bg-muted`}
                                    title="تعديل"
                                    onClick={() => startEditRow(a)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className={`${fixedIconButtonClass} hover:bg-muted`}
                                    title="حذف"
                                    onClick={() => onDeleteOne(a.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    className={tableBtnClass}
                                    onClick={() => saveEditRow(a.id)}
                                    disabled={
                                      !editDraft.governorate.trim() ||
                                      !editDraft.city.trim() ||
                                      !editDraft.campId.trim()
                                    }
                                  >
                                    <Save className="ms-1 size-4" />
                                    حفظ
                                  </Button>

                                  <Button
                                    variant="outline"
                                    className={tableBtnClass}
                                    onClick={cancelEditRow}
                                  >
                                    <X className="ms-1 size-4" />
                                    إلغاء
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
                          لا توجد عناوين
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground sm:text-sm">
                  <span>عدد الصفوف</span>

                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-8 sm:h-9 rounded-md border bg-background px-2 text-xs sm:text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="text-[11px] text-muted-foreground sm:text-sm">
                    {rangeStart} - {rangeEnd} من {filtered.length}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={tableBtnClass}
                    >
                      السابق
                    </Button>

                    <Button
                      variant="outline"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={tableBtnClass}
                    >
                      التالي
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open)
            if (!open) {
              setAddFormError('')
            }
          }}
        >
          <DialogContent
            className="w-[95vw] max-w-[95vw] rounded-xl sm:max-w-[560px]"
            dir="rtl"
          >
            <DialogHeader className="text-right">
              <DialogTitle>إضافة عنوان</DialogTitle>
              <DialogDescription>إدخال بيانات العنوان</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-right">
              <div className="grid gap-2">
                <div className="text-sm">المحافظة *</div>
                <Input
                  value={governorate}
                  onChange={(e) => {
                    setGovernorate(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: غزة"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المدينة *</div>
                <Input
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: غزة"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المخيم *</div>
                <select
                  value={campId}
                  onChange={(e) => {
                    setCampId(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  className={`h-10 rounded-md border bg-background px-3 text-right sm:h-11 ${
                    addFormError ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">اختر المخيم</option>
                  {campOptions.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name}
                    </option>
                  ))}
                </select>

                {!!addFormError && (
                  <div className="text-xs text-red-600 sm:text-sm">{addFormError}</div>
                )}
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  setAddOpen(false)
                  setAddFormError('')
                }}
                className={`w-full sm:w-auto ${fixedButtonClass}`}
              >
                إغلاق
              </Button>

              <Button
                onClick={onAdd}
                disabled={submitting || !isAddFormValid}
                className={`w-full sm:w-auto ${fixedButtonClass}`}
              >
                {submitting ? 'جارٍ الإضافة...' : 'إضافة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}