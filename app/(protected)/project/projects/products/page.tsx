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

type ProductStatus = 'نشط' | 'غير نشط'

type Product = {
  id: string
  nameAr: string
  quantity: number
  status: ProductStatus
}

const BASE_URL = '/api/project/projects/products'

const createProductSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم المنتج مطلوب'),
  quantity: z.coerce.number().int().min(0, 'الكمية يجب أن تكون 0 أو أكثر'),
  status: z.enum(['نشط', 'غير نشط']),
})

const updateProductSchema = z
  .object({
    nameAr: z.string().trim().min(1, 'اسم المنتج مطلوب').optional(),
    quantity: z.coerce.number().int().min(0, 'الكمية يجب أن تكون 0 أو أكثر').optional(),
    status: z.enum(['نشط', 'غير نشط']).optional(),
  })
  .strict()

const normalizeText = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()

const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

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

async function readProducts(): Promise<Product[]> {
  return requestJSON<Product[]>(BASE_URL)
}

function findDuplicateProduct(
  items: Product[],
  input: { nameAr: string },
  excludeId?: string
) {
  const normalizedName = normalizeText(input.nameAr)

  const duplicate = items.find(
    (p) => p.id !== excludeId && normalizeText(p.nameAr) === normalizedName
  )

  if (duplicate) {
    return 'المنتج موجود بالفعل (اسم المنتج مكرر).'
  }

  return ''
}

async function assertProductBusinessValidation(
  input: {
    nameAr: string
    quantity: number
    status: ProductStatus
  },
  excludeId?: string
) {
  const normalizedName = normalizeText(input.nameAr)

  if (!normalizedName) {
    throw new Error('اسم المنتج مطلوب')
  }

  if (!Number.isInteger(input.quantity) || input.quantity < 0) {
    throw new Error('الكمية يجب أن تكون 0 أو أكثر')
  }

  if (!input.status) {
    throw new Error('الحالة مطلوبة')
  }

  const current = await readProducts()
  const duplicateMessage = findDuplicateProduct(current, input, excludeId)

  if (duplicateMessage) {
    throw new Error(duplicateMessage)
  }
}

async function createProduct(input: unknown): Promise<Product> {
  const body = createProductSchema.parse(input)

  await assertProductBusinessValidation({
    nameAr: body.nameAr,
    quantity: body.quantity,
    status: body.status,
  })

  return requestJSON<Product>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

async function updateProduct(id: string, input: unknown): Promise<Product> {
  if (!id) throw new Error('معرّف المنتج مفقود')

  const body = updateProductSchema.parse(input)

  const current = await readProducts()
  const existing = current.find((x) => x.id === id)

  if (!existing) {
    throw new Error('المنتج غير موجود')
  }

  const merged = {
    nameAr: body.nameAr ?? existing.nameAr,
    quantity: body.quantity ?? existing.quantity,
    status: body.status ?? existing.status,
  }

  await assertProductBusinessValidation(merged, id)

  return requestJSON<Product>(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

async function deleteProduct(id: string): Promise<void> {
  if (!id) throw new Error('معرّف المنتج مفقود')

  await requestJSON(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

async function deleteAllProducts(): Promise<void> {
  await requestJSON(`${BASE_URL}?all=true`, {
    method: 'DELETE',
  })
}

const productsApi = {
  list: readProducts,
  create: createProduct,
  update: updateProduct,
  remove: deleteProduct,
  removeAll: deleteAllProducts,
}

export default function ProductsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [quantity, setQuantity] = useState<number>(0)
  const [status, setStatus] = useState<ProductStatus>('نشط')
  const [submitting, setSubmitting] = useState(false)
  const [addFormError, setAddFormError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    nameAr: string
    quantity: number
    status: ProductStatus
  }>({
    nameAr: '',
    quantity: 0,
    status: 'نشط',
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
        const data = await productsApi.list()
        setItems(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((p) => {
      const matchSearch = !s || p.nameAr.toLowerCase().includes(s) || String(p.quantity).includes(s)

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

  const resetAddForm = () => {
    setNameAr('')
    setQuantity(0)
    setStatus('نشط')
    setAddFormError('')
  }

  const isAddFormValid = !!nameAr.trim() && Number.isInteger(quantity) && quantity >= 0 && !!status

  const onAdd = async () => {
    const n = nameAr.trim()

    if (!n || !Number.isInteger(quantity) || quantity < 0 || !status) {
      setAddFormError('يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح')
      return
    }

    setSubmitting(true)
    setError('')
    setAddFormError('')

    try {
      const created = await productsApi.create({
        nameAr: n,
        quantity,
        status,
      })

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
    const confirmed = window.confirm('هل أنت متأكد من حذف هذا المنتج؟')
    if (!confirmed) return

    try {
      setSubmitting(true)
      setError('')

      await productsApi.remove(id)

      if (editingId === id) setEditingId(null)
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const startEditRow = (p: Product) => {
    setEditingId(p.id)
    setEditDraft({
      nameAr: p.nameAr,
      quantity: p.quantity,
      status: p.status,
    })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = async (id: string) => {
    const n = editDraft.nameAr.trim()

    if (!n || !Number.isInteger(editDraft.quantity) || editDraft.quantity < 0 || !editDraft.status) {
      setError('يرجى تعبئة البيانات بشكل صحيح قبل الحفظ')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const updated = await productsApi.update(id, {
        nameAr: n,
        quantity: editDraft.quantity,
        status: editDraft.status,
      })

      setItems((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                nameAr: updated.nameAr,
                quantity: updated.quantity,
                status: updated.status,
              }
            : p
        )
      )

      setEditingId(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteAll = async () => {
    if (!items.length) return

    const confirmed = window.confirm('هل أنت متأكد من حذف جميع المنتجات؟')
    if (!confirmed) return

    try {
      setSubmitting(true)
      setError('')

      await productsApi.removeAll()
      setItems([])
      setEditingId(null)
      setPage(1)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-2 py-3 sm:px-4 sm:py-5 lg:px-6" dir="rtl">
      <div className="mb-4 sm:mb-6 text-right">
        <div className="text-base font-semibold text-foreground sm:text-xl lg:text-2xl">
          المنتجات
        </div>

        <div className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
          الرئيسية <span className="mx-1">{'>'}</span>
          <span className="text-foreground">إدارة المنتجات</span>
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
                      placeholder="ابحث عن منتج"
                      className={`${inputBaseClass} ${topControlHeight} pr-9 pl-3`}
                    />
                  </div>

                  <div className="min-w-[120px] max-w-[140px] sm:min-w-[150px] sm:max-w-[160px] shrink-0">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'all' | ProductStatus)}
                      className={`${selectBaseClass} ${topControlHeight} truncate`}
                    >
                      <option value="all">كل الحالات</option>
                      <option value="نشط">نشط</option>
                      <option value="غير نشط">غير نشط</option>
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
                    disabled={submitting}
                  >
                    <Plus className="ms-1 h-4 w-4 shrink-0" />
                    إضافة منتج
                  </Button>

                  <Button
                    variant="outline"
                    className={`border-slate-200 text-slate-700 hover:bg-slate-50 ${fixedButtonClass}`}
                    onClick={onDeleteAll}
                    disabled={submitting || !items.length}
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
                      <th className="w-[34%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        اسم المنتج
                      </th>
                      <th className="w-[20%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الكمية
                      </th>
                      <th className="w-[20%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الحالة
                      </th>
                      <th className="w-[26%] border-b px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((p) => {
                      const isEditing = editingId === p.id

                      return (
                        <tr key={p.id} className="align-top hover:bg-muted/30">
                          <td className="border-b border-l px-2 py-3 text-right font-medium break-words sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <Input
                                value={editDraft.nameAr}
                                onChange={(e) =>
                                  setEditDraft((d) => ({ ...d, nameAr: e.target.value }))
                                }
                                className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                              />
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {p.nameAr}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <Input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="text"
                                value={String(editDraft.quantity)}
                                onChange={(e) =>
                                  setEditDraft((d) => ({
                                    ...d,
                                    quantity: toIntOnly(e.target.value),
                                  }))
                                }
                                className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                              />
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {p.quantity}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <select
                                value={editDraft.status}
                                onChange={(e) =>
                                  setEditDraft((d) => ({
                                    ...d,
                                    status: e.target.value as ProductStatus,
                                  }))
                                }
                                className="h-9 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-xs sm:text-sm lg:text-base truncate"
                              >
                                <option value="نشط">نشط</option>
                                <option value="غير نشط">غير نشط</option>
                              </select>
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {p.status}
                              </span>
                            )}
                          </td>

                          <td className="border-b px-2 py-3 sm:px-4 sm:py-4 lg:px-5">
                            <div className="flex flex-nowrap items-center justify-start gap-2 overflow-x-auto">
                              {!isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className={`${fixedIconButtonClass} hover:bg-muted disabled:opacity-50`}
                                    title="تعديل"
                                    onClick={() => startEditRow(p)}
                                    disabled={submitting}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className={`${fixedIconButtonClass} hover:bg-muted disabled:opacity-50`}
                                    title="حذف"
                                    onClick={() => onDeleteOne(p.id)}
                                    disabled={submitting}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    className={tableBtnClass}
                                    onClick={() => saveEditRow(p.id)}
                                    disabled={
                                      submitting ||
                                      !editDraft.nameAr.trim() ||
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
                                    disabled={submitting}
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
                          لا توجد منتجات
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
              <DialogTitle>إضافة منتج</DialogTitle>
              <DialogDescription>إدخال بيانات المنتج</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-right">
              <div className="grid gap-2">
                <div className="text-sm">اسم المنتج *</div>
                <Input
                  value={nameAr}
                  onChange={(e) => {
                    setNameAr(e.target.value)
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: بطانية"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الكمية *</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={String(quantity)}
                  onChange={(e) => {
                    setQuantity(toIntOnly(e.target.value))
                    if (addFormError) setAddFormError('')
                  }}
                  placeholder="مثال: 99"
                  className="h-10 text-right sm:h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحالة *</div>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as ProductStatus)
                    if (addFormError) setAddFormError('')
                  }}
                  className={`h-10 rounded-md border bg-background px-3 text-right sm:h-11 ${
                    addFormError ? 'border-red-500' : ''
                  }`}
                >
                  <option value="نشط">نشط</option>
                  <option value="غير نشط">غير نشط</option>
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
                disabled={submitting}
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