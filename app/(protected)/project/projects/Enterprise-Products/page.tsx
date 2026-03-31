'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'

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

type AvailabilityStatus = 'متوفر' | 'غير متوفر'

type RelatedInstitution = {
  id: string
  name?: string | null
  number?: string | number | null
  code?: string | number | null
  institutionNumber?: string | number | null
}

type RelatedProduct = {
  id: string
  name?: string | null
  title?: string | null
  number?: string | number | null
  code?: string | number | null
  productNumber?: string | number | null
}

type EnterpriseProduct = {
  id: string
  institutionId: string
  productId: string
  quantity: number
  availability: AvailabilityStatus
  institution?: RelatedInstitution | null
  product?: RelatedProduct | null
}

type SelectOption = {
  id: string
  label: string
}

function buildInstitutionLabel(item: any): string {
  const number =
    item?.number ??
    item?.code ??
    item?.institutionNumber ??
    item?.institutionNo ??
    item?.institution_id ??
    null

  const name = item?.name ?? item?.title ?? item?.institutionName ?? null

  if (number && name) return `${number} - ${name}`
  if (number) return String(number)
  if (name) return String(name)
  return String(item?.id ?? '')
}

function buildProductLabel(item: any): string {
  const number =
    item?.number ??
    item?.code ??
    item?.productNumber ??
    item?.productNo ??
    item?.product_id ??
    null

  const name = item?.name ?? item?.title ?? item?.productName ?? null

  if (number && name) return `${number} - ${name}`
  if (number) return String(number)
  if (name) return String(name)
  return String(item?.id ?? '')
}

export default function EnterpriseProductsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<EnterpriseProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [institutions, setInstitutions] = useState<SelectOption[]>([])
  const [products, setProducts] = useState<SelectOption[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)

  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'notavailable'>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [institutionId, setInstitutionId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState<number>(0)
  const [availability, setAvailability] = useState<AvailabilityStatus>('متوفر')
  const [submitting, setSubmitting] = useState(false)
  const [addFormError, setAddFormError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    institutionId: string
    productId: string
    quantity: number
    availability: AvailabilityStatus
  }>({
    institutionId: '',
    productId: '',
    quantity: 0,
    availability: 'متوفر',
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

  const institutionMap = useMemo(() => {
    return new Map(institutions.map((item) => [item.id, item.label]))
  }, [institutions])

  const productMap = useMemo(() => {
    return new Map(products.map((item) => [item.id, item.label]))
  }, [products])

  const getInstitutionLabel = (row: EnterpriseProduct) => {
    return (
      row.institution
        ? buildInstitutionLabel(row.institution)
        : institutionMap.get(row.institutionId) || row.institutionId
    )
  }

  const getProductLabel = (row: EnterpriseProduct) => {
    return row.product ? buildProductLabel(row.product) : productMap.get(row.productId) || row.productId
  }

  const fetchOptions = async () => {
    try {
      setOptionsLoading(true)

      const [institutionsRes, productsRes] = await Promise.all([
        fetch('/api/project/projects/institutions', {
          method: 'GET',
          cache: 'no-store',
        }),
        fetch('/api/project/projects/products', {
          method: 'GET',
          cache: 'no-store',
        }),
      ])

      const institutionsData = await institutionsRes.json()
      const productsData = await productsRes.json()

      if (!institutionsRes.ok) {
        throw new Error(institutionsData?.message || 'فشل تحميل المؤسسات')
      }

      if (!productsRes.ok) {
        throw new Error(productsData?.message || 'فشل تحميل المنتجات')
      }

      const normalizedInstitutions: SelectOption[] = Array.isArray(institutionsData)
        ? institutionsData.map((item: any) => ({
            id: String(item.id),
            label: buildInstitutionLabel(item),
          }))
        : []

      const normalizedProducts: SelectOption[] = Array.isArray(productsData)
        ? productsData.map((item: any) => ({
            id: String(item.id),
            label: buildProductLabel(item),
          }))
        : []

      setInstitutions(normalizedInstitutions)
      setProducts(normalizedProducts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل القوائم')
    } finally {
      setOptionsLoading(false)
    }
  }

  const fetchItems = async () => {
    try {
      setLoading(true)
      setError('')

      const res = await fetch('/api/project/projects/Enterprise-Products', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل تحميل البيانات')
      }

      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل البيانات')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
    fetchOptions()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((x) => {
      const institutionLabel = getInstitutionLabel(x).toLowerCase()
      const productLabel = getProductLabel(x).toLowerCase()

      const matchSearch =
        !s ||
        x.id.toLowerCase().includes(s) ||
        institutionLabel.includes(s) ||
        productLabel.includes(s) ||
        String(x.quantity).includes(s)

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'available'
            ? x.availability === 'متوفر'
            : x.availability === 'غير متوفر'

      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter, institutions, products])

  useEffect(() => {
    setPage(1)
  }, [q, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const resetAddForm = () => {
    setInstitutionId('')
    setProductId('')
    setQuantity(0)
    setAvailability('متوفر')
    setAddFormError('')
  }

  const isAddFormValid =
    institutionId.trim().length > 0 &&
    productId.trim().length > 0 &&
    Number.isInteger(quantity) &&
    quantity >= 0

  const findDuplicateItem = (
    institutionIdValue: string,
    productIdValue: string,
    excludeId?: string
  ) => {
    return items.some(
      (item) =>
        item.id !== excludeId &&
        item.institutionId === institutionIdValue &&
        item.productId === productIdValue
    )
  }

  const onAdd = async () => {
    if (!institutionId.trim()) {
      setAddFormError('المؤسسة مطلوبة')
      return
    }

    if (!productId.trim()) {
      setAddFormError('المنتج مطلوب')
      return
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      setAddFormError('الكمية يجب أن تكون 0 أو أكثر')
      return
    }

    if (findDuplicateItem(institutionId, productId)) {
      setAddFormError('هذا الربط بين المؤسسة والمنتج موجود بالفعل')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      setAddFormError('')

      const res = await fetch('/api/project/projects/Enterprise-Products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institutionId,
          productId,
          quantity,
          availability,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'حدث خطأ أثناء الإضافة')
      }

      setItems((prev) => [data, ...prev])
      resetAddForm()
      setAddOpen(false)
      setPage(1)
    } catch (err) {
      setAddFormError(err instanceof Error ? err.message : 'حدث خطأ أثناء الإضافة')
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteOne = async (id: string) => {
    try {
      setError('')

      const res = await fetch(`/api/project/projects/Enterprise-Products?id=${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'حدث خطأ أثناء الحذف')
      }

      if (editingId === id) setEditingId(null)
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف')
    }
  }

  const startEditRow = (row: EnterpriseProduct) => {
    setEditingId(row.id)
    setEditDraft({
      institutionId: row.institutionId,
      productId: row.productId,
      quantity: row.quantity,
      availability: row.availability,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = async (id: string) => {
    if (!editDraft.institutionId.trim()) {
      setError('المؤسسة مطلوبة')
      return
    }

    if (!editDraft.productId.trim()) {
      setError('المنتج مطلوب')
      return
    }

    if (!Number.isInteger(editDraft.quantity) || editDraft.quantity < 0) {
      setError('الكمية يجب أن تكون 0 أو أكثر')
      return
    }

    if (findDuplicateItem(editDraft.institutionId, editDraft.productId, id)) {
      setError('هذا الربط بين المؤسسة والمنتج موجود بالفعل')
      return
    }

    try {
      setError('')

      const res = await fetch(`/api/project/projects/Enterprise-Products?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institutionId: editDraft.institutionId,
          productId: editDraft.productId,
          quantity: editDraft.quantity,
          availability: editDraft.availability,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'حدث خطأ أثناء التعديل')
      }

      setItems((prev) => prev.map((x) => (x.id === id ? data : x)))
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التعديل')
    }
  }

  const onDeleteAll = async () => {
    try {
      setError('')

      const res = await fetch('/api/project/projects/Enterprise-Products?all=true', {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'حدث خطأ أثناء حذف الكل')
      }

      setItems([])
      setEditingId(null)
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حذف الكل')
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-2 py-3 sm:px-4 sm:py-5 lg:px-6" dir="rtl">
      <div className="mb-4 sm:mb-6 text-right">
        <div className="text-base font-semibold text-foreground sm:text-xl lg:text-2xl">
          منتجات المؤسسات
        </div>

        <div className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
          الرئيسية <span className="mx-1">{'>'}</span>
          <span className="text-foreground">إدارة منتجات المؤسسات</span>
        </div>

        {(loading || optionsLoading) && (
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
                      placeholder="ابحث عن منتج مؤسسة"
                      className={`${inputBaseClass} ${topControlHeight} pr-9 pl-3`}
                    />
                  </div>

                  <div className="min-w-[120px] max-w-[140px] sm:min-w-[150px] sm:max-w-[160px] shrink-0">
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as 'all' | 'available' | 'notavailable')
                      }
                      className={`${selectBaseClass} ${topControlHeight} truncate`}
                    >
                      <option value="all">كل الحالات</option>
                      <option value="available">متوفر</option>
                      <option value="notavailable">غير متوفر</option>
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
                    إضافة منتج
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
                      <th className="w-[18%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        المعرّف
                      </th>
                      <th className="w-[20%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        المؤسسة
                      </th>
                      <th className="w-[20%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        المنتج
                      </th>
                      <th className="w-[16%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الكمية
                      </th>
                      <th className="w-[16%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الحالة
                      </th>
                      <th className="w-[22%] border-b px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((row) => {
                      const isEditing = editingId === row.id

                      return (
                        <tr key={row.id} className="align-top hover:bg-muted/30">
                          <td className="border-b border-l px-2 py-3 text-right font-medium break-words sm:px-4 sm:py-4 lg:px-5">
                            <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                              {row.id}
                            </span>
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <select
                                value={editDraft.institutionId}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    institutionId: e.target.value,
                                  }))
                                }
                                className="h-9 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-xs sm:text-sm lg:text-base"
                              >
                                <option value="">اختر المؤسسة</option>
                                {institutions.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {getInstitutionLabel(row)}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <select
                                value={editDraft.productId}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    productId: e.target.value,
                                  }))
                                }
                                className="h-9 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-xs sm:text-sm lg:text-base"
                              >
                                <option value="">اختر المنتج</option>
                                {products.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {getProductLabel(row)}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <Input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="number"
                                min={0}
                                value={String(editDraft.quantity)}
                                onChange={(e) =>
                                  setEditDraft((p) => ({
                                    ...p,
                                    quantity: Number(e.target.value || '0'),
                                  }))
                                }
                                className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                              />
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {row.quantity}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                            <div className="w-[120px] sm:w-[135px] lg:w-[150px] max-w-full">
                              {isEditing ? (
                                <select
                                  value={editDraft.availability}
                                  onChange={(e) =>
                                    setEditDraft((p) => ({
                                      ...p,
                                      availability: e.target.value as AvailabilityStatus,
                                    }))
                                  }
                                  className="h-9 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-xs sm:text-sm lg:text-base truncate"
                                >
                                  <option value="متوفر">متوفر</option>
                                  <option value="غير متوفر">غير متوفر</option>
                                </select>
                              ) : (
                                <span
                                  className={`inline-flex rounded-md border px-2 py-1 text-xs sm:text-sm ${
                                    row.availability === 'متوفر'
                                      ? 'border-green-200 bg-green-50 text-green-700'
                                      : 'border-slate-200 bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  {row.availability}
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
                                    onClick={() => startEditRow(row)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className={`${fixedIconButtonClass} hover:bg-muted`}
                                    title="حذف"
                                    onClick={() => onDeleteOne(row.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    className={tableBtnClass}
                                    onClick={() => saveEditRow(row.id)}
                                    disabled={
                                      !editDraft.institutionId.trim() ||
                                      !editDraft.productId.trim() ||
                                      !Number.isInteger(editDraft.quantity) ||
                                      editDraft.quantity < 0
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
                        <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                          لا توجد منتجات مؤسسات
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
              <DialogTitle>إضافة منتج مؤسسة</DialogTitle>
              <DialogDescription>إدخال بيانات المنتج المرتبط بالمؤسسة</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-right">
              <div className="grid gap-2">
                <div className="text-sm">المؤسسة *</div>
                <select
                  value={institutionId}
                  onChange={(e) => {
                    setInstitutionId(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  className="h-10 rounded-md border bg-background px-3 text-right sm:h-11"
                >
                  <option value="">اختر المؤسسة</option>
                  {institutions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <div className="text-sm">المنتج *</div>
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  className="h-10 rounded-md border bg-background px-3 text-right sm:h-11"
                >
                  <option value="">اختر المنتج</option>
                  {products.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الكمية *</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="number"
                  min={0}
                  value={String(quantity)}
                  onChange={(e) => {
                    setQuantity(Number(e.target.value || '0'))
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: 250"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحالة *</div>
                <select
                  value={availability}
                  onChange={(e) => {
                    setAvailability(e.target.value as AvailabilityStatus)
                    if (addFormError) setAddFormError('')
                  }}
                  className={`h-10 rounded-md border bg-background px-3 text-right sm:h-11 ${
                    addFormError ? 'border-red-500' : ''
                  }`}
                >
                  <option value="متوفر">متوفر</option>
                  <option value="غير متوفر">غير متوفر</option>
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