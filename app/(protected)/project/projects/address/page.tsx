'use client'

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'

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
  governorate: string | null
  city: string | null
  campId: string | null
  createdAt?: string
  updatedAt?: string
  camp?: {
    id: string
    name: string
  } | null
}

type AddressForm = {
  governorate: string
  city: string
  campId: string
}

type FieldKey = keyof AddressForm
type FieldErrors = Partial<Record<FieldKey, string>>

const emptyForm: AddressForm = {
  governorate: '',
  city: '',
  campId: '',
}

const normalizeText = (value: string) => value.trim().toLocaleLowerCase()

export default function AddressPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Address[]>([])
  const [campFilter, setCampFilter] = useState<'all' | string>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<AddressForm>(emptyForm)
  const [addFieldErrors, setAddFieldErrors] = useState<FieldErrors>({})

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<AddressForm>(emptyForm)
  const [editFieldErrors, setEditFieldErrors] = useState<FieldErrors>({})

  const [campOptions, setCampOptions] = useState<CampOption[]>([])

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchAddresses = async () => {
    try {
      setLoading(true)
      setErrorMessage('')

      const res = await fetch('/api/project/projects/address', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في جلب العناوين')
      }

      setItems(Array.isArray(data) ? data : [])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  const fetchCamps = async () => {
    try {
      const res = await fetch('/api/project/projects/camps?forBeneficiary=true', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في جلب المخيمات')
      }

      setCampOptions(Array.isArray(data) ? data : [])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء جلب المخيمات')
    }
  }

  useEffect(() => {
    fetchAddresses()
    fetchCamps()
  }, [])

  const campNames = useMemo(() => {
    const set = new Set(
      items
        .map((x) => x.camp?.name)
        .filter((value): value is string => Boolean(value))
    )

    return Array.from(set)
  }, [items])

  const filtered = useMemo(() => {
    const s = normalizeText(q)

    return items.filter((a) => {
      const matchSearch =
        !s ||
        normalizeText(a.governorate ?? '').includes(s) ||
        normalizeText(a.city ?? '').includes(s) ||
        normalizeText(a.camp?.name ?? '').includes(s)

      const matchCamp =
        campFilter === 'all' ? true : (a.camp?.name ?? '') === campFilter

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

  const findDuplicateAddress = (
    governorate: string,
    city: string,
    campId: string,
    excludeId?: string
  ) => {
    const normalizedGovernorate = normalizeText(governorate)
    const normalizedCity = normalizeText(city)
    const normalizedCampId = campId.trim()

    return items.some((item) => {
      if (excludeId && item.id === excludeId) return false

      return (
        normalizeText(item.governorate ?? '') === normalizedGovernorate &&
        normalizeText(item.city ?? '') === normalizedCity &&
        (item.campId ?? '') === normalizedCampId
      )
    })
  }

  const validateField = (field: FieldKey, value: string): string => {
    const trimmed = value.trim()

    switch (field) {
      case 'governorate':
        if (trimmed.length > 100) return 'المحافظة يجب ألا تزيد عن 100 حرف'
        return ''

      case 'city':
        if (trimmed.length > 100) return 'المدينة يجب ألا تزيد عن 100 حرف'
        return ''

      case 'campId':
        return ''

      default:
        return ''
    }
  }

  const validateAddForm = (): boolean => {
    const nextErrors: FieldErrors = {
      governorate: validateField('governorate', addForm.governorate),
      city: validateField('city', addForm.city),
      campId: validateField('campId', addForm.campId),
    }

    const hasBasicErrors = Object.values(nextErrors).some(Boolean)

    if (!hasBasicErrors) {
      const isDuplicate = findDuplicateAddress(
        addForm.governorate.trim(),
        addForm.city.trim(),
        addForm.campId.trim(),
        undefined
      )

      if (isDuplicate) {
        nextErrors.governorate = 'العنوان مكرر مسبقاً'
        nextErrors.city = 'العنوان مكرر مسبقاً'
      }
    }

    setAddFieldErrors(nextErrors)
    return Object.values(nextErrors).every((x) => !x)
  }

  const validateEditForm = (id: string): boolean => {
    const nextErrors: FieldErrors = {
      governorate: validateField('governorate', editDraft.governorate),
      city: validateField('city', editDraft.city),
      campId: validateField('campId', editDraft.campId),
    }

    const hasBasicErrors = Object.values(nextErrors).some(Boolean)

    if (!hasBasicErrors) {
      const isDuplicate = findDuplicateAddress(
        editDraft.governorate.trim(),
        editDraft.city.trim(),
        editDraft.campId.trim(),
        id
      )

      if (isDuplicate) {
        nextErrors.governorate = 'العنوان مكرر مسبقاً'
        nextErrors.city = 'العنوان مكرر مسبقاً'
      }
    }

    setEditFieldErrors(nextErrors)
    return Object.values(nextErrors).every((x) => !x)
  }

  const isFormValid = (form: AddressForm, errors: FieldErrors) => {
    const hasErrors = Object.values(errors).some(Boolean)
    return !hasErrors
  }

  const handleAddFieldChange = (field: FieldKey, value: string) => {
    setAddForm((prev) => {
      const nextForm = {
        ...prev,
        [field]: value,
      }

      const nextErrors: FieldErrors = {
        governorate: validateField('governorate', nextForm.governorate),
        city: validateField('city', nextForm.city),
        campId: validateField('campId', nextForm.campId),
      }

      if (
        !Object.values(nextErrors).some(Boolean) &&
        findDuplicateAddress(nextForm.governorate, nextForm.city, nextForm.campId)
      ) {
        nextErrors.governorate = 'العنوان مكرر مسبقاً'
        nextErrors.city = 'العنوان مكرر مسبقاً'
      }

      setAddFieldErrors(nextErrors)
      return nextForm
    })
  }

  const handleEditFieldChange = (field: FieldKey, value: string) => {
    setEditDraft((prev) => {
      const nextForm = {
        ...prev,
        [field]: value,
      }

      const nextErrors: FieldErrors = {
        governorate: validateField('governorate', nextForm.governorate),
        city: validateField('city', nextForm.city),
        campId: validateField('campId', nextForm.campId),
      }

      if (
        !Object.values(nextErrors).some(Boolean) &&
        findDuplicateAddress(nextForm.governorate, nextForm.city, nextForm.campId, editingId || undefined)
      ) {
        nextErrors.governorate = 'العنوان مكرر مسبقاً'
        nextErrors.city = 'العنوان مكرر مسبقاً'
      }

      setEditFieldErrors(nextErrors)
      return nextForm
    })
  }

  const onAdd = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault()

    if (!validateAddForm()) return

    try {
      setSubmitting(true)
      setErrorMessage('')
      setAddFieldErrors({})

      const payload = {
        governorate: addForm.governorate.trim() || null,
        city: addForm.city.trim() || null,
        campId: addForm.campId.trim() || null,
      }

      const res = await fetch('/api/project/projects/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشلت إضافة العنوان')
      }

      setItems((prev) => [data, ...prev])
      setAddForm(emptyForm)
      setAddFieldErrors({})
      setAddOpen(false)
      setPage(1)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء الإضافة')
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteOne = async (id: string) => {
    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch(`/api/project/projects/address?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل حذف العنوان')
      }

      if (editingId === id) setEditingId(null)
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء الحذف')
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteAll = async () => {
    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch('/api/project/projects/address?all=true', {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل حذف جميع العناوين')
      }

      setItems([])
      setEditingId(null)
      setPage(1)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف الكل')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditRow = (a: Address) => {
    setEditingId(a.id)
    setEditDraft({
      governorate: a.governorate ?? '',
      city: a.city ?? '',
      campId: a.campId ?? '',
    })
    setEditFieldErrors({})
  }

  const cancelEditRow = () => {
    setEditingId(null)
    setEditFieldErrors({})
  }

  const saveEditRow = async (id: string) => {
    if (!validateEditForm(id)) return

    try {
      setSubmitting(true)
      setErrorMessage('')
      setEditFieldErrors({})

      const payload = {
        governorate: editDraft.governorate.trim() || null,
        city: editDraft.city.trim() || null,
        campId: editDraft.campId.trim() || null,
      }

      const res = await fetch(`/api/project/projects/address?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل تعديل العنوان')
      }

      setItems((prev) => prev.map((a) => (a.id === id ? data : a)))
      setEditingId(null)
      setEditFieldErrors({})
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء التعديل')
    } finally {
      setSubmitting(false)
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 py-6 sm:px-6" dir="rtl">
      <div className="mb-6 text-right">
        <div className="text-2xl font-semibold text-foreground">العناوين</div>

        <div className="mt-1 text-sm text-muted-foreground">
          الرئيسية <span className="mx-1">{'>'}</span>{' '}
          <span className="text-foreground">إدارة العناوين</span>
        </div>
      </div>

      {!!errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="w-full max-w-[1400px]">
        <Card>
          <CardContent className="p-0" dir="rtl">
            <div className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="ابحث عن عنوان"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pr-9 pl-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  <select
                    value={campFilter}
                    onChange={(e) => setCampFilter(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200 sm:w-[200px]"
                  >
                    <option value="all">كل المخيمات</option>
                    {campNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    className="inline-flex items-center gap-2 !h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700"
                    onClick={() => {
                      setAddForm(emptyForm)
                      setAddFieldErrors({})
                      setAddOpen(true)
                    }}
                    disabled={submitting}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة عنوان
                  </Button>

                  <Button
                    variant="outline"
                    className="!h-10 !rounded-lg border-slate-200 !px-4 !text-sm !font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={onDeleteAll}
                    disabled={submitting || items.length === 0}
                  >
                    حذف الكل
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t" />

            <div className="overflow-hidden rounded-b-lg">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[800px] w-full border-collapse text-sm">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-right text-foreground/60">
                      <th className="border-b border-r px-4 py-3 font-normal">المحافظة</th>
                      <th className="border-b border-r px-4 py-3 font-normal">المدينة</th>
                      <th className="border-b border-r px-4 py-3 font-normal">المخيم</th>
                      <th className="border-b px-4 py-3 font-normal">الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                          جاري تحميل البيانات...
                        </td>
                      </tr>
                    ) : (
                      <>
                        {pageItems.map((a) => {
                          const isEditing = editingId === a.id

                          return (
                            <tr key={a.id} className="hover:bg-muted/30 align-top">
                              <td className="border-b border-r px-4 py-3 font-medium">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <Input
                                      value={editDraft.governorate}
                                      onChange={(e) => handleEditFieldChange('governorate', e.target.value)}
                                      className="h-9"
                                      placeholder="مثال: غزة"
                                    />
                                    {!!editFieldErrors.governorate && (
                                      <div className="text-xs text-red-600">{editFieldErrors.governorate}</div>
                                    )}
                                  </div>
                                ) : (
                                  a.governorate || '-'
                                )}
                              </td>

                              <td className="border-b border-r px-4 py-3">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <Input
                                      value={editDraft.city}
                                      onChange={(e) => handleEditFieldChange('city', e.target.value)}
                                      className="h-9"
                                      placeholder="مثال: غزة"
                                    />
                                    {!!editFieldErrors.city && (
                                      <div className="text-xs text-red-600">{editFieldErrors.city}</div>
                                    )}
                                  </div>
                                ) : (
                                  a.city || '-'
                                )}
                              </td>

                              <td className="border-b border-r px-4 py-3">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <select
                                      value={editDraft.campId}
                                      onChange={(e) => handleEditFieldChange('campId', e.target.value)}
                                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    >
                                      <option value="">بدون مخيم</option>
                                      {campOptions.map((camp) => (
                                        <option key={camp.id} value={camp.id}>
                                          {camp.name}
                                        </option>
                                      ))}
                                    </select>
                                    {!!editFieldErrors.campId && (
                                      <div className="text-xs text-red-600">{editFieldErrors.campId}</div>
                                    )}
                                  </div>
                                ) : (
                                  a.camp?.name || '-'
                                )}
                              </td>

                              <td className="border-b px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {!isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border hover:bg-muted"
                                        title="تعديل"
                                        onClick={() => startEditRow(a)}
                                        disabled={submitting}
                                      >
                                        <Pencil className="size-4" />
                                      </button>

                                      <button
                                        type="button"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border hover:bg-muted"
                                        title="حذف"
                                        onClick={() => onDeleteOne(a.id)}
                                        disabled={submitting}
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
                                        disabled={submitting || !isFormValid(editDraft, editFieldErrors)}
                                      >
                                        <Save className="size-4 ms-2" />
                                        حفظ
                                      </Button>

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-10"
                                        onClick={cancelEditRow}
                                        disabled={submitting}
                                      >
                                        <X className="size-4 ms-2" />
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
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>عدد الصفوف</span>
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
                    {rangeStart} - {rangeEnd} من {filtered.length}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    السابق
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    التالي
                  </Button>
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
              setAddForm(emptyForm)
              setAddFieldErrors({})
            }
          }}
        >
          <DialogContent className="sm:max-w-[560px]" dir="rtl">
            <DialogHeader className="text-right">
              <DialogTitle>إضافة عنوان</DialogTitle>
              <DialogDescription>إدخال بيانات العنوان</DialogDescription>
            </DialogHeader>

            <form onSubmit={onAdd} className="grid gap-3 text-right">
              <div className="grid gap-2">
                <div className="text-sm">المحافظة</div>
                <Input
                  value={addForm.governorate}
                  onChange={(e) => handleAddFieldChange('governorate', e.target.value)}
                  placeholder="مثال: غزة"
                />
                {!!addFieldErrors.governorate && (
                  <div className="text-xs text-red-600">{addFieldErrors.governorate}</div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المدينة</div>
                <Input
                  value={addForm.city}
                  onChange={(e) => handleAddFieldChange('city', e.target.value)}
                  placeholder="مثال: غزة"
                />
                {!!addFieldErrors.city && (
                  <div className="text-xs text-red-600">{addFieldErrors.city}</div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المخيم</div>
                <select
                  value={addForm.campId}
                  onChange={(e) => handleAddFieldChange('campId', e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">بدون مخيم</option>
                  {campOptions.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name}
                    </option>
                  ))}
                </select>
                {!!addFieldErrors.campId && (
                  <div className="text-xs text-red-600">{addFieldErrors.campId}</div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
                  إغلاق
                </Button>
                <Button type="submit" disabled={submitting || !isFormValid(addForm, addFieldErrors)}>
                  {submitting ? 'جاري الإضافة...' : 'إضافة'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}