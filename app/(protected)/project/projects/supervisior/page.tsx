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
import { Pencil, Save, X, Plus, Search, ChevronRight, ChevronLeft } from 'lucide-react'

type Supervisor = {
  id: string
  nameAr: string
  phone: string
  status: 'نشط' | 'موقوف'
}

type SupervisorApiItem = {
  id: string
  nameAr?: string
  name?: string
  phone?: string | null
  status?: 'ACTIVE' | 'INACTIVE' | 'نشط' | 'موقوف'
}

const API_URL = '/api/project/projects/supervisior'

const normalizePhone = (value: string) => value.replace(/[^\d]/g, '')

const isValidPalestinePhone = (phone: string) => {
  const regex = /^(056|059)\d{7}$/
  return regex.test(phone)
}

const toUiStatus = (status?: SupervisorApiItem['status']): Supervisor['status'] => {
  if (status === 'INACTIVE' || status === 'موقوف') return 'موقوف'
  return 'نشط'
}

function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
}

async function requestJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
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

async function readSupervisors(
  statusFilter: 'all' | 'active' | 'blocked'
): Promise<SupervisorApiItem[]> {
  const params = new URLSearchParams()
  if (statusFilter !== 'all') {
    params.set('status', statusFilter)
  }
  const queryString = params.toString()
  const url = `${API_URL}${queryString ? `?${queryString}` : ''}`
  return requestJSON<SupervisorApiItem[]>(url)
}

async function createSupervisor(input: {
  nameAr: string
  phone: string
  status: Supervisor['status']
}): Promise<SupervisorApiItem> {
  const nameAr = input.nameAr.trim()
  const phone = normalizePhone(input.phone.trim())
  return requestJSON<SupervisorApiItem>(API_URL, {
    method: 'POST',
    body: JSON.stringify({ nameAr, phone, status: input.status }),
  })
}

async function updateSupervisor(
  id: string,
  input: {
    nameAr: string
    phone: string
    status: Supervisor['status']
  }
): Promise<SupervisorApiItem> {
  const nameAr = input.nameAr.trim()
  const phone = normalizePhone(input.phone.trim())
  return requestJSON<SupervisorApiItem>(`${API_URL}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ nameAr, phone, status: input.status }),
  })
}

const supervisorsApi = {
  list: readSupervisors,
  create: createSupervisor,
  update: updateSupervisor,
}

export default function SupervisorsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [addOpen, setAddOpen] = useState(false)
  
  const [nameAr, setNameAr] = useState('')
  const [phone, setPhone] = useState('')
  const [area, setArea] = useState('') 
  const [status, setStatus] = useState<Supervisor['status']>('نشط')
  
  const [submitting, setSubmitting] = useState(false)
  const [addFormError, setAddFormError] = useState('')

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

  const mapApiItems = (data: SupervisorApiItem[]): Supervisor[] =>
    data.map((x) => ({
      id: x.id,
      nameAr: x.nameAr ?? x.name ?? '',
      phone: x.phone ?? '',
      status: toUiStatus(x.status),
    }))

  const fetchSupervisors = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const data = await supervisorsApi.list(statusFilter)
      setItems(mapApiItems(data))
    } catch (err) {
      setErrorMessage(getErrorMessage(err))
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSupervisors()
  }, [statusFilter])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return items.filter((sp) => {
      return (
        !s ||
        sp.id.toLowerCase().includes(s) ||
        sp.nameAr.toLowerCase().includes(s) ||
        sp.phone.includes(s)
      )
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
    setArea('')
    setStatus('نشط')
    setAddFormError('')
  }

  const isAddFormValid = 
    nameAr.trim() !== '' && 
    area !== '' && 
    isValidPalestinePhone(normalizePhone(phone.trim()))

  const onAdd = async () => {
    if (!isAddFormValid) return

    setSubmitting(true)
    try {
      const ar = nameAr.trim()
      const ph = normalizePhone(phone.trim())
      const created = await supervisorsApi.create({ nameAr: ar, phone: ph, status })
      setItems((prev) => [
        {
          id: created.id,
          nameAr: created.nameAr ?? created.name ?? ar,
          phone: created.phone ?? ph,
          status: toUiStatus(created.status),
        },
        ...prev,
      ])
      resetAddOpen(false)
    } catch (err) {
      setAddFormError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const resetAddOpen = (open: boolean) => {
    setAddOpen(open)
    if (!open) resetAddForm()
  }

  const startEditRow = (sp: Supervisor) => {
    setEditingId(sp.id)
    setEditDraft({ nameAr: sp.nameAr, phone: sp.phone, status: sp.status })
  }

  const cancelEditRow = () => {
    setEditingId(null)
  }

  const saveEditRow = async (id: string) => {
    const ar = editDraft.nameAr.trim()
    const ph = normalizePhone(editDraft.phone.trim())

    if (!isValidPalestinePhone(ph) || ar === '') {
      setErrorMessage('يرجى التأكد من ملء جميع الحقول وصحة رقم الجوال')
      return
    }

    try {
      const updated = await supervisorsApi.update(id, {
        nameAr: ar,
        phone: ph,
        status: editDraft.status,
      })
      setItems((prev) =>
        prev.map((sp) =>
          sp.id === id
            ? {
                id: updated.id,
                nameAr: updated.nameAr ?? updated.name ?? ar,
                phone: updated.phone ?? ph,
                status: toUiStatus(updated.status),
              }
            : sp
        )
      )
      setEditingId(null)
      setErrorMessage('')
    } catch (err) {
      setErrorMessage(getErrorMessage(err))
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

      <div className="w-full">
        <Card className="w-full border-slate-200 shadow-sm">
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
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    className="inline-flex items-center gap-2 !h-10 !rounded-lg !bg-blue-600 !px-4 !text-sm !font-semibold !text-white hover:!bg-blue-700"
                    onClick={() => {
                      setErrorMessage('')
                      setAddFormError('')
                      setAddOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة مشرف
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

            <div className="overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-right text-slate-600">
                      <th className="px-4 py-3 font-semibold text-right">المشرف</th>
                      <th className="px-4 py-3 font-semibold text-right">رقم الجوال</th>
                      <th className="px-4 py-3 font-semibold text-right">الحالة</th>
                      <th className="px-4 py-3 font-semibold text-right">الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                          جاري تحميل البيانات...
                        </td>
                      </tr>
                    ) : pageItems.length ? (
                      pageItems.map((sp) => {
                        const isEditing = editingId === sp.id
                        return (
                          <tr key={sp.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium">
                              {isEditing ? (
                                <Input
                                  value={editDraft.nameAr}
                                  onChange={(e) => setEditDraft((p) => ({ ...p, nameAr: e.target.value }))}
                                  className="h-9"
                                />
                              ) : (
                                <span className="font-medium text-slate-900">{sp.nameAr}</span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-slate-600">
                              {isEditing ? (
                                <div className="flex flex-col gap-1">
                                  <Input
                                    value={editDraft.phone}
                                    onChange={(e) => setEditDraft((p) => ({ ...p, phone: normalizePhone(e.target.value) }))}
                                    className={`h-9 ${editDraft.phone && !isValidPalestinePhone(editDraft.phone) ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                    maxLength={10}
                                  />
                                  {editDraft.phone && !isValidPalestinePhone(editDraft.phone) && (
                                    <span className="text-[10px] text-red-500">ابدأ بـ 056 أو 059 (10 أرقام)</span>
                                  )}
                                </div>
                              ) : (
                                sp.phone
                              )}
                            </td>

                            <td className="px-4 py-3">
                              {isEditing ? (
                                <select
                                  value={editDraft.status}
                                  onChange={(e) => setEditDraft((p) => ({ ...p, status: e.target.value as Supervisor['status'] }))}
                                  className="h-9 rounded-md border bg-background px-3"
                                >
                                  <option value="نشط">نشط</option>
                                  <option value="موقوف">موقوف</option>
                                </select>
                              ) : (
                                <span className={sp.status === 'نشط' ? 'inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700' : 'inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700'}>
                                  {sp.status}
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {!isEditing ? (
                                  <button
                                    type="button"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                    onClick={() => startEditRow(sp)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>
                                ) : (
                                  <>
                                    <Button 
                                      className="h-9 bg-blue-600 hover:bg-blue-700" 
                                      size="sm" 
                                      onClick={() => saveEditRow(sp.id)}
                                      disabled={!isValidPalestinePhone(editDraft.phone) || editDraft.nameAr.trim() === ''}
                                    >
                                      <Save className="ml-2 size-4" />
                                      حفظ
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-9" onClick={cancelEditRow}>
                                      <X className="ml-2 size-4" />
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

              {/* Pagination Section المحسن */}
              <div className="flex flex-col gap-4 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>عرض</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span>صفوف</span>
                  </div>
                  <span className="hidden sm:inline-block text-slate-300">|</span>
                  <div className="font-medium text-slate-600">
                    عرض {rangeStart} - {rangeEnd} من {filtered.length}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-9 gap-1 px-4 font-medium transition-colors hover:bg-white hover:text-blue-600 disabled:opacity-50"
                  >
                    السابق
                  </Button>
                  
                  <div className="flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-blue-600 shadow-sm">
                    {safePage} / {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-9 gap-1 px-4 font-medium transition-colors hover:bg-white hover:text-blue-600 disabled:opacity-50"
                  >
                    التالي
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* إضافة مشرف */}
        <Dialog open={addOpen} onOpenChange={resetAddOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader dir="rtl" className="text-right">
              <DialogTitle>إضافة مشرف جديد</DialogTitle>
              <DialogDescription>يرجى ملء جميع الحقول المطلوبة بشكل صحيح.</DialogDescription>
            </DialogHeader>

            <div dir="rtl" className="flex flex-col gap-5 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">
                  اسم المشرف <span className="text-red-500">*</span>
                </label>
                <Input 
                  value={nameAr} 
                  onChange={(e) => setNameAr(e.target.value)} 
                  placeholder="أدخل اسم المشرف..." 
                  className={`h-11 border-slate-200 ${nameAr === '' ? 'border-amber-200' : ''}`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">
                  رقم الجوال <span className="text-red-500">*</span>
                </label>
                <Input 
                  value={phone} 
                  onChange={(e) => setPhone(normalizePhone(e.target.value))} 
                  placeholder="مثال: 059xxxxxxx" 
                  maxLength={10}
                  className={`h-11 border-slate-200 ${phone && !isValidPalestinePhone(phone) ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {phone && !isValidPalestinePhone(phone) && (
                  <p className="text-[11px] text-red-500 font-medium">ابدأ بـ 056 أو 059 ويتكون من 10 أرقام</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">
                  المنطقة <span className="text-red-500">*</span>
                </label>
                <select 
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className={`h-11 rounded-md border border-slate-200 bg-background px-3 outline-none focus:ring-2 focus:ring-blue-100 ${area === '' ? 'border-amber-200' : ''}`}
                >
                  <option value="">اختر المنطقة...</option>
                  <option value="north">شمال غزة</option>
                  <option value="gaza">مدينة غزة</option>
                  <option value="south">الجنوب</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">الحالة</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Supervisor['status'])}
                  className="h-11 rounded-md border border-slate-200 bg-background px-3 outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="نشط">نشط</option>
                  <option value="موقوف">موقوف</option>
                </select>
              </div>

              {addFormError && <p className="text-sm text-red-600 font-medium text-center">{addFormError}</p>}
            </div>

            <DialogFooter dir="rtl" className="flex flex-row-reverse gap-3 pt-4 border-t">
              <Button 
                onClick={onAdd} 
                disabled={!isAddFormValid || submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11"
              >
                {submitting ? 'جارٍ الحفظ...' : 'حفظ البيانات'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => resetAddOpen(false)} 
                className="w-full h-11"
              >
                إلغاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}