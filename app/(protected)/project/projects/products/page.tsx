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

type ProductStatus = 'نشط' | 'غير نشط'

type Product = {
  id: string
  nameAr: string
  categoryAr: string
  unitAr: string
  quantity: number
  price: number
  status: ProductStatus
}

type ApiProduct = {
  id: string
  nameAr: string
  quantity: number
  status: ProductStatus
}

// تحويل بيانات الـ API إلى شكل الجدول الحالي
const mapApiProductToUi = (product: ApiProduct): Product => ({
  id: product.id,
  nameAr: product.nameAr,
  categoryAr: '',
  unitAr: '',
  quantity: product.quantity,
  price: 0,
  status: product.status,
})

// ✅ أرقام فقط
const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

// ✅ رقم عشري (سعر)
const toDecimalOnly = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')
  const safe = parts.length <= 2 ? cleaned : `${parts[0]}.${parts.slice(1).join('')}`
  const n = Number(safe)
  return Number.isFinite(n) ? n : 0
}

export default function ProductsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Filter: status من فوق
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [categoryAr, setCategoryAr] = useState('')
  const [unitAr, setUnitAr] = useState('')
  const [quantity, setQuantity] = useState<number>(0)
  const [price, setPrice] = useState<number>(0)
  const [status, setStatus] = useState<ProductStatus>('نشط')

  // Inline Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    nameAr: string
    categoryAr: string
    unitAr: string
    quantity: number
    price: number
    status: ProductStatus
  }>({
    nameAr: '',
    categoryAr: '',
    unitAr: '',
    quantity: 0,
    price: 0,
    status: 'نشط',
  })

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setErrorMessage('')

      const res = await fetch('/api/project/projects/products', {
        method: 'GET',
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'تعذر جلب المنتجات')
      }

      setItems((data as ApiProduct[]).map(mapApiProductToUi))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء جلب المنتجات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // ✅ فلترة Search + Status
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((p) => {
      const matchSearch =
        !s ||
        p.nameAr.toLowerCase().includes(s) ||
        p.categoryAr.toLowerCase().includes(s) ||
        p.unitAr.toLowerCase().includes(s) ||
        String(p.quantity).includes(s) ||
        String(p.price).includes(s)

      const matchStatus = statusFilter === 'all' ? true : p.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [q, items, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [q, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const onAdd = async () => {
    const n = nameAr.trim()

    if (!n) return
    if (!Number.isInteger(quantity) || quantity < 0) return

    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch('/api/project/projects/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nameAr: n,
          quantity,
          status,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'تعذر إنشاء المنتج')
      }

      const created = mapApiProductToUi(data as ApiProduct)

      // نحافظ على القيم المحلية غير المخزنة في DB داخل الجدول فقط
      created.categoryAr = categoryAr.trim()
      created.unitAr = unitAr.trim()
      created.price = price

      setItems((prev) => [created, ...prev])

      setNameAr('')
      setCategoryAr('')
      setUnitAr('')
      setQuantity(0)
      setPrice(0)
      setStatus('نشط')
      setAddOpen(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة المنتج')
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteOne = async (id: string) => {
    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch(`/api/project/projects/products?id=${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'تعذر حذف المنتج')
      }

      if (editingId === id) setEditingId(null)
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف المنتج')
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteAll = async () => {
    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch('/api/project/projects/products?all=true', {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'تعذر حذف جميع المنتجات')
      }

      setItems([])
      setEditingId(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف جميع المنتجات')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditRow = (p: Product) => {
    setEditingId(p.id)
    setEditDraft({
      nameAr: p.nameAr,
      categoryAr: p.categoryAr,
      unitAr: p.unitAr,
      quantity: p.quantity,
      price: p.price,
      status: p.status,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = async (id: string) => {
    const n = editDraft.nameAr.trim()

    if (!n) return
    if (!Number.isInteger(editDraft.quantity) || editDraft.quantity < 0) return

    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch(`/api/project/projects/products?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nameAr: n,
          quantity: editDraft.quantity,
          status: editDraft.status,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'تعذر تعديل المنتج')
      }

      setItems((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                nameAr: n,
                categoryAr: editDraft.categoryAr,
                unitAr: editDraft.unitAr,
                quantity: editDraft.quantity,
                price: editDraft.price,
                status: editDraft.status,
              }
            : p
        )
      )

      setEditingId(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء تعديل المنتج')
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatusDirectly = async (id: string, nextStatus: ProductStatus) => {
    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch(`/api/project/projects/products?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'تعذر تحديث حالة المنتج')
      }

      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: nextStatus } : x)))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث الحالة')
    } finally {
      setSubmitting(false)
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 sm:px-6 py-6" dir="rtl">
      {/* Header */}
      <div className="mb-6" dir="rtl">
        <div className="text-right">
          <div className="text-2xl font-semibold text-foreground">المنتجات</div>

          <div className="mt-1 text-sm text-muted-foreground">
            الرئيسية <span className="mx-1">{'>'}</span>{' '}
            <span className="text-foreground">إدارة المنتجات</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px]">
        <Card>
          <CardContent className="p-0" dir="rtl">
            {/* Toolbar */}
            <div className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder="ابحث عن المنتجات"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | ProductStatus)}
                    className="h-10 w-full sm:w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">كل الحالات</option>
                    <option value="نشط">نشط</option>
                    <option value="غير نشط">غير نشط</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button
                    className="!h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700 inline-flex items-center gap-2"
                    onClick={() => setAddOpen(true)}
                    disabled={submitting}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة منتج
                  </Button>

                  <Button
                    variant="outline"
                    className="!h-10 !rounded-lg !px-4 !text-sm !font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={onDeleteAll}
                    disabled={submitting || items.length === 0}
                  >
                    حذف الكل
                  </Button>
                </div>
              </div>

              {errorMessage && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}
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
                    <tr className="text-right text-foreground/60">
                      <th className="px-4 py-3 border-b border-r font-normal">اسم المنتج</th>
                      <th className="px-4 py-3 border-b border-r font-normal">الفئة</th>
                      <th className="px-4 py-3 border-b border-r font-normal">الوحدة</th>
                      <th className="px-4 py-3 border-b border-r font-normal">الكمية</th>
                      <th className="px-4 py-3 border-b border-r font-normal">السعر</th>
                      <th className="px-4 py-3 border-b border-r font-normal">الحالة</th>
                      <th className="px-4 py-3 border-b font-normal">الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                          جاري تحميل المنتجات...
                        </td>
                      </tr>
                    ) : (
                      <>
                        {pageItems.map((p) => {
                          const isEditing = editingId === p.id

                          return (
                            <tr key={p.id} className="hover:bg-muted/30">
                              <td className="px-4 py-3 border-b border-r font-medium">
                                {isEditing ? (
                                  <Input
                                    value={editDraft.nameAr}
                                    onChange={(e) => setEditDraft((d) => ({ ...d, nameAr: e.target.value }))}
                                    className="h-10"
                                  />
                                ) : (
                                  p.nameAr
                                )}
                              </td>

                              <td className="px-4 py-3 border-b border-r">
                                {isEditing ? (
                                  <Input
                                    value={editDraft.categoryAr}
                                    onChange={(e) => setEditDraft((d) => ({ ...d, categoryAr: e.target.value }))}
                                    className="h-10"
                                  />
                                ) : (
                                  p.categoryAr || '-'
                                )}
                              </td>

                              <td className="px-4 py-3 border-b border-r">
                                {isEditing ? (
                                  <Input
                                    value={editDraft.unitAr}
                                    onChange={(e) => setEditDraft((d) => ({ ...d, unitAr: e.target.value }))}
                                    className="h-10"
                                  />
                                ) : (
                                  p.unitAr || '-'
                                )}
                              </td>

                              <td className="px-4 py-3 border-b border-r">
                                {isEditing ? (
                                  <Input
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    type="text"
                                    value={Number.isInteger(editDraft.quantity) ? String(editDraft.quantity) : ''}
                                    onChange={(e) => setEditDraft((d) => ({ ...d, quantity: toIntOnly(e.target.value) }))}
                                    className="h-10"
                                  />
                                ) : (
                                  p.quantity
                                )}
                              </td>

                              <td className="px-4 py-3 border-b border-r">
                                {isEditing ? (
                                  <Input
                                    inputMode="decimal"
                                    type="text"
                                    value={String(editDraft.price ?? '')}
                                    onChange={(e) => setEditDraft((d) => ({ ...d, price: toDecimalOnly(e.target.value) }))}
                                    className="h-10"
                                  />
                                ) : (
                                  p.price || 0
                                )}
                              </td>

                              <td className="px-4 py-3 border-b border-r">
                                {isEditing ? (
                                  <select
                                    value={editDraft.status}
                                    onChange={(e) => setEditDraft((d) => ({ ...d, status: e.target.value as ProductStatus }))}
                                    className="h-10 rounded-md border px-3 bg-background"
                                  >
                                    <option value="نشط">نشط</option>
                                    <option value="غير نشط">غير نشط</option>
                                  </select>
                                ) : (
                                  <select
                                    value={p.status}
                                    onChange={(e) => updateStatusDirectly(p.id, e.target.value as ProductStatus)}
                                    className="h-10 rounded-md border px-3 bg-background"
                                    disabled={submitting}
                                  >
                                    <option value="نشط">نشط</option>
                                    <option value="غير نشط">غير نشط</option>
                                  </select>
                                )}
                              </td>

                              <td className="px-4 py-3 border-b">
                                <div className="flex items-center gap-2">
                                  {!isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted disabled:opacity-50"
                                        title="تعديل"
                                        onClick={() => startEditRow(p)}
                                        disabled={submitting}
                                      >
                                        <Pencil className="size-4" />
                                      </button>

                                      <button
                                        type="button"
                                        className="inline-flex items-center justify-center rounded-md border h-10 w-10 hover:bg-muted disabled:opacity-50"
                                        title="حذف"
                                        onClick={() => onDeleteOne(p.id)}
                                        disabled={submitting}
                                      >
                                        <Trash2 className="size-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <Button size="sm" className="h-10" onClick={() => saveEditRow(p.id)} disabled={submitting}>
                                        <Save className="size-4 me-2" />
                                        حفظ
                                      </Button>

                                      <Button size="sm" variant="outline" className="h-10" onClick={cancelEditRow} disabled={submitting}>
                                        <X className="size-4 me-2" />
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
                            <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                              لا توجد منتجات
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>عدد الصفوف لكل صفحة</span>
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

                  <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
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

        {/* Add Product Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة منتج</DialogTitle>
              <DialogDescription>إدخال بيانات المنتج</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">اسم المنتج</div>
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: طحين" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الفئة</div>
                <Input value={categoryAr} onChange={(e) => setCategoryAr(e.target.value)} placeholder="مثال: مواد غذائية" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الوحدة</div>
                <Input value={unitAr} onChange={(e) => setUnitAr(e.target.value)} placeholder="مثال: كرتون / قطعة" />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الكمية</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={quantity ? String(quantity) : ''}
                  onChange={(e) => setQuantity(toIntOnly(e.target.value))}
                  placeholder="مثال: 120"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">السعر</div>
                <Input
                  inputMode="decimal"
                  type="text"
                  value={price ? String(price) : ''}
                  onChange={(e) => setPrice(toDecimalOnly(e.target.value))}
                  placeholder="مثال: 35"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحالة</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="نشط">نشط</option>
                  <option value="غير نشط">غير نشط</option>
                </select>
              </div>
            </div>

            <DialogFooter dir="rtl" className="gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
                إغلاق
              </Button>
              <Button
                onClick={onAdd}
                disabled={!nameAr.trim() || !Number.isInteger(quantity) || quantity < 0 || submitting}
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