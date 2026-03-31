'use client'

import {useEffect, useMemo, useState, type ChangeEvent} from 'react'

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

const normalizePhone = (value: string) => value.replace(/[^\d+]/g, '')

export default function SupervisorsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<Supervisor['status']>('نشط')

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

  const API_URL = '/api/project/projects/supervisor'

  const fetchSupervisors = async () => {
    try {
      setLoading(true)
      setErrorMessage('')

      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const queryString = params.toString()
      const url = `${API_URL}${queryString ? `?${queryString}` : ''}`

      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Non-JSON response:', text)
        throw new Error('الاستجابة من السيرفر ليست JSON. تأكد من مسار الـ API')
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في جلب المشرفين')
      }

      setItems(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء جلب البيانات')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSupervisors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()

    return items.filter((sp) => {
      const matchSearch =
        !s ||
        sp.id.toLowerCase().includes(s) ||
        sp.nameAr.toLowerCase().includes(s) ||
        sp.phone.includes(s)

      return matchSearch
    })
  }, [q, items])

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
    setPhone('')
    setStatus('نشط')
  }

  const onAdd = async () => {
    const ar = nameAr.trim()
    const ph = normalizePhone(phone.trim())

    if (!ar || !ph) {
      setErrorMessage('يرجى إدخال اسم المشرف ورقم الجوال')
      return
    }

    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nameAr: ar,
          phone: ph,
          status,
        }),
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Non-JSON response:', text)
        throw new Error('الاستجابة من السيرفر ليست JSON. تأكد من مسار الـ API')
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في إضافة المشرف')
      }

      setItems((prev) => [data, ...prev])
      resetAddForm()
      setAddOpen(false)
    } catch (error) {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء الإضافة')
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteOne = async (id: string) => {
    try {
      setActionLoadingId(id)
      setErrorMessage('')

      const res = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Non-JSON response:', text)
        throw new Error('الاستجابة من السيرفر ليست JSON. تأكد من مسار الـ API')
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في حذف المشرف')
      }

      if (editingId === id) setEditingId(null)
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (error) {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء الحذف')
    } finally {
      setActionLoadingId(null)
    }
  }

  const onDeleteAll = async () => {
    try {
      setSubmitting(true)
      setErrorMessage('')

      const res = await fetch(`${API_URL}?all=true`, {
        method: 'DELETE',
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Non-JSON response:', text)
        throw new Error('الاستجابة من السيرفر ليست JSON. تأكد من مسار الـ API')
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في حذف جميع المشرفين')
      }

      setItems([])
      setEditingId(null)
    } catch (error) {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف الكل')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditRow = (sp: Supervisor) => {
    setEditingId(sp.id)
    setEditDraft({
      nameAr: sp.nameAr,
      phone: sp.phone,
      status: sp.status,
    })
  }

  const cancelEditRow = () => {
    setEditingId(null)
    setEditDraft({
      nameAr: '',
      phone: '',
      status: 'نشط',
    })
  }

  const saveEditRow = async (id: string) => {
    const ar = editDraft.nameAr.trim()
    const ph = normalizePhone(editDraft.phone.trim())

    if (!ar || !ph) {
      setErrorMessage('يرجى إدخال الاسم ورقم الجوال قبل الحفظ')
      return
    }

    try {
      setActionLoadingId(id)
      setErrorMessage('')

      const res = await fetch(`${API_URL}?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nameAr: ar,
          phone: ph,
          status: editDraft.status,
        }),
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Non-JSON response:', text)
        throw new Error('الاستجابة من السيرفر ليست JSON. تأكد من مسار الـ API')
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || 'فشل في تعديل بيانات المشرف')
      }

      setItems((prev) => prev.map((sp) => (sp.id === id ? data : sp)))
      setEditingId(null)
    } catch (error) {
      console.error(error)
      setErrorMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء التعديل')
    } finally {
      setActionLoadingId(null)
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 py-6 sm:px-6" dir="rtl">
      <div className="mb-6">
        <div className="text-right">
          <div className="text-2xl font-semibold text-foreground">المشرفون</div>
          <div className="mt-1 text-sm text-muted-foreground">
            الرئيسية <span className="mx-1">{'>'}</span>
            <span className="text-foreground">إدارة المشرفين</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px]">
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
                      placeholder="ابحث عن مشرف"
                      className="!h-10 !rounded-lg border-slate-200 bg-white pr-9 pl-3 text-sm outline-none focus:!ring-2 focus:!ring-slate-200"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200 sm:w-[160px]"
                  >
                    <option value="all">كل الحالات</option>
                    <option value="active">نشط</option>
                    <option value="blocked">موقوف</option>
                  </select>

                  <Button
                    variant="outline"
                    className="!h-10 !rounded-lg border-slate-200 !px-4 !text-sm"
                    onClick={fetchSupervisors}
                    disabled={loading}
                  >
                    تحديث
                  </Button>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    className="inline-flex items-center gap-2 !h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700"
                    onClick={() => {
                      setErrorMessage('')
                      setAddOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة مشرف
                  </Button>

                  <Button
                    variant="outline"
                    className="!h-10 !rounded-lg border-slate-200 !px-4 !text-sm !font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={onDeleteAll}
                    disabled={submitting || !items.length}
                  >
                    حذف الكل
                  </Button>
                </div>
              </div>

              {errorMessage ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}
            </div>

            <div className="border-t" />

            <div className="overflow-hidden rounded-b-lg">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[920px] w-full border-collapse text-sm">
                  <thead
                    style={{
                      backgroundColor: '#F9FAFB',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <tr className="text-right text-foreground/60">
                      <th className="border-b border-l px-4 py-3 font-normal">المشرف</th>
                      <th className="border-b border-l px-4 py-3 font-normal">رقم الجوال</th>
                      <th className="border-b border-l px-4 py-3 font-normal">الحالة</th>
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
                    ) : pageItems.length ? (
                      pageItems.map((sp) => {
                        const isEditing = editingId === sp.id
                        const isBusy = actionLoadingId === sp.id

                        return (
                          <tr key={sp.id} className="hover:bg-muted/30">
                            <td className="border-b border-l px-4 py-3 font-medium">
                              {isEditing ? (
                                <Input
                                  value={editDraft.nameAr}
                                  onChange={(e) =>
                                    setEditDraft((p) => ({...p, nameAr: e.target.value}))
                                  }
                                  className="h-9"
                                />
                              ) : (
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground">{sp.nameAr}</span>
                                  <span className="text-xs text-muted-foreground">{sp.id}</span>
                                </div>
                              )}
                            </td>

                            <td className="border-b border-l px-4 py-3">
                              {isEditing ? (
                                <Input
                                  value={editDraft.phone}
                                  onChange={(e) =>
                                    setEditDraft((p) => ({
                                      ...p,
                                      phone: normalizePhone(e.target.value),
                                    }))
                                  }
                                  className="h-9"
                                />
                              ) : (
                                sp.phone
                              )}
                            </td>

                            <td className="border-b border-l px-4 py-3">
                              {isEditing ? (
                                <select
                                  value={editDraft.status}
                                  onChange={(e) =>
                                    setEditDraft((p) => ({
                                      ...p,
                                      status: e.target.value as Supervisor['status'],
                                    }))
                                  }
                                  className="h-9 rounded-md border bg-background px-3"
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

                            <td className="border-b px-4 py-3">
                              <div className="flex items-center gap-2">
                                {!isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      className="inline-flex h-10 w-10 items-center justify-center rounded-md border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                      title="تعديل"
                                      onClick={() => startEditRow(sp)}
                                      disabled={isBusy}
                                    >
                                      <Pencil className="size-4" />
                                    </button>

                                    <button
                                      type="button"
                                      className="inline-flex h-10 w-10 items-center justify-center rounded-md border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                      title="حذف"
                                      onClick={() => onDeleteOne(sp.id)}
                                      disabled={isBusy}
                                    >
                                      <Trash2 className="size-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      className="h-10"
                                      onClick={() => saveEditRow(sp.id)}
                                      disabled={isBusy}
                                    >
                                      <Save className="ms-2 size-4" />
                                      حفظ
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-10"
                                      onClick={cancelEditRow}
                                      disabled={isBusy}
                                    >
                                      <X className="ms-2 size-4" />
                                      إلغاء
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                          لا توجد بيانات للمشرفين
                        </td>
                      </tr>
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
            if (!open) resetAddForm()
          }}
        >
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة مشرف</DialogTitle>
              <DialogDescription>أدخل بيانات المشرف الجديد</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="grid gap-3">
              <div className="grid gap-2">
                <div className="text-sm">اسم المشرف</div>
                <Input
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: أحمد محمد"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">رقم الجوال</div>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(normalizePhone(e.target.value))}
                  placeholder="مثال: 0599123456"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحالة</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Supervisor['status'])}
                  className="h-10 rounded-md border bg-background px-3"
                >
                  <option value="نشط">نشط</option>
                  <option value="موقوف">موقوف</option>
                </select>
              </div>
            </div>

            <DialogFooter dir="rtl" className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAddOpen(false)
                  resetAddForm()
                }}
              >
                إغلاق
              </Button>

              <Button onClick={onAdd} disabled={!nameAr.trim() || !phone.trim() || submitting}>
                {submitting ? 'جارٍ الإضافة...' : 'إضافة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}