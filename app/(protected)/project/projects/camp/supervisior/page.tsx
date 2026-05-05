'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Pencil, Save, X, Plus, Search } from 'lucide-react'

type Supervisor = {
  id: string
  nameAr: string
  phone: string
  status: 'active' | 'inactive'
}

type SupervisorApiItem = {
  id: string
  nameAr?: string
  name?: string
  phone?: string | null
  status?: 'ACTIVE' | 'INACTIVE' | 'active' | 'inactive'
}

const API_URL = '/api/project/projects/supervisior'

const normalizePhone = (value: string) => value.replace(/[^\d]/g, '')

const isValidPalestinePhone = (phone: string) => /^(056|059)\d{7}$/.test(phone)

const toUiStatus = (status?: SupervisorApiItem['status']): Supervisor['status'] =>
  status === 'INACTIVE' || status === 'inactive' ? 'inactive' : 'active'

function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Unexpected error'
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
  try { data = text ? JSON.parse(text) : null } catch { data = text || null }
  if (!res.ok) throw new Error(data?.message ?? `Request failed: ${res.status}`)
  return data as T
}

async function readSupervisors(statusFilter: 'all' | 'active' | 'blocked'): Promise<SupervisorApiItem[]> {
  const params = new URLSearchParams()
  if (statusFilter !== 'all') params.set('status', statusFilter)
  const qs = params.toString()
  return requestJSON<SupervisorApiItem[]>(`${API_URL}${qs ? `?${qs}` : ''}`)
}

async function createSupervisor(input: { nameAr: string; phone: string; status: Supervisor['status'] }): Promise<SupervisorApiItem> {
  return requestJSON<SupervisorApiItem>(API_URL, {
    method: 'POST',
    body: JSON.stringify({ nameAr: input.nameAr.trim(), phone: normalizePhone(input.phone.trim()), status: input.status }),
  })
}

async function updateSupervisor(id: string, input: { nameAr: string; phone: string; status: Supervisor['status'] }): Promise<SupervisorApiItem> {
  return requestJSON<SupervisorApiItem>(`${API_URL}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ nameAr: input.nameAr.trim(), phone: normalizePhone(input.phone.trim()), status: input.status }),
  })
}

export default function SupervisorsPage() {
  const { t } = useTranslation()
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
  const [status, setStatus] = useState<Supervisor['status']>('active')
  const [submitting, setSubmitting] = useState(false)
  const [addFormError, setAddFormError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{ nameAr: string; phone: string; status: Supervisor['status'] }>({
    nameAr: '', phone: '', status: 'active',
  })

  const mapApiItems = (data: SupervisorApiItem[]): Supervisor[] =>
    data.map(x => ({
      id: x.id,
      nameAr: x.nameAr ?? x.name ?? '',
      phone: x.phone ?? '',
      status: toUiStatus(x.status),
    }))

  const fetchSupervisors = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const data = await readSupervisors(statusFilter)
      setItems(mapApiItems(data))
    } catch (err) {
      setErrorMessage(getErrorMessage(err))
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSupervisors() }, [statusFilter])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return items.filter(sp => !s || sp.id.toLowerCase().includes(s) || sp.nameAr.toLowerCase().includes(s) || sp.phone.includes(s))
  }, [q, items])

  useEffect(() => { setPage(1) }, [q, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const resetAddForm = () => {
    setNameAr(''); setPhone(''); setArea(''); setStatus('active'); setAddFormError('')
  }

  const isAddFormValid = nameAr.trim() !== '' && area !== '' && isValidPalestinePhone(normalizePhone(phone.trim()))

  const onAdd = async () => {
    if (!isAddFormValid) return
    setSubmitting(true)
    try {
      const created = await createSupervisor({ nameAr: nameAr.trim(), phone: normalizePhone(phone.trim()), status })
      setItems(prev => [{
        id: created.id,
        nameAr: created.nameAr ?? created.name ?? nameAr.trim(),
        phone: created.phone ?? normalizePhone(phone.trim()),
        status: toUiStatus(created.status),
      }, ...prev])
      resetAddOpen(false)
    } catch (err) {
      setAddFormError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const resetAddOpen = (open: boolean) => { setAddOpen(open); if (!open) resetAddForm() }

  const startEditRow = (sp: Supervisor) => {
    setEditingId(sp.id)
    setEditDraft({ nameAr: sp.nameAr, phone: sp.phone, status: sp.status })
  }

  const cancelEditRow = () => setEditingId(null)

  const saveEditRow = async (id: string) => {
    const ar = editDraft.nameAr.trim()
    const ph = normalizePhone(editDraft.phone.trim())
    if (!isValidPalestinePhone(ph) || ar === '') {
      setErrorMessage(t('common.messages.required'))
      return
    }
    try {
      const updated = await updateSupervisor(id, { nameAr: ar, phone: ph, status: editDraft.status })
      setItems(prev => prev.map(sp => sp.id === id ? {
        id: updated.id,
        nameAr: updated.nameAr ?? updated.name ?? ar,
        phone: updated.phone ?? ph,
        status: toUiStatus(updated.status),
      } : sp))
      setEditingId(null)
      setErrorMessage('')
    } catch (err) {
      setErrorMessage(getErrorMessage(err))
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <div className="w-full px-3 py-6 sm:px-6">
      <div className="mb-6">
        <div className="text-start">
          <div className="text-2xl font-semibold text-foreground">{t('pages.supervisors.title')}</div>
          <div className="mt-1 text-sm text-muted-foreground">{t('pages.supervisors.title')}</div>
        </div>
      </div>

      <div className="w-full">
        <Card className="w-full border shadow-sm">
          <CardContent className="p-0">
            <div className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-[260px]">
                    <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={q}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                      placeholder={t('common.messages.searchPlaceholder')}
                      className="h-10 rounded-lg pe-9 ps-3 text-sm outline-none"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 sm:w-[160px]"
                  >
                    <option value="all">{t('common.labels.all')}</option>
                    <option value="active">{t('common.labels.active')}</option>
                    <option value="blocked">{t('common.labels.inactive')}</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    className="inline-flex items-center gap-2 h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                    onClick={() => { setErrorMessage(''); setAddFormError(''); setAddOpen(true) }}
                  >
                    <Plus className="h-4 w-4" />
                    {t('pages.supervisors.addButton')}
                  </Button>
                </div>
              </div>
              {errorMessage && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="border-t" />

            <div className="overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-muted/40 border-b">
                    <tr className="text-start text-muted-foreground">
                      <th className="px-4 py-3 font-semibold text-start">{t('common.labels.name')}</th>
                      <th className="px-4 py-3 font-semibold text-start">{t('common.labels.phone')}</th>
                      <th className="px-4 py-3 font-semibold text-start">{t('common.labels.status')}</th>
                      <th className="px-4 py-3 font-semibold text-start">{t('common.labels.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">{t('common.messages.loading')}</td></tr>
                    ) : pageItems.length ? pageItems.map((sp) => {
                      const isEditing = editingId === sp.id
                      return (
                        <tr key={sp.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">
                            {isEditing ? (
                              <Input value={editDraft.nameAr} onChange={(e) => setEditDraft(p => ({ ...p, nameAr: e.target.value }))} className="h-9" />
                            ) : (
                              <span className="font-medium text-foreground">{sp.nameAr}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {isEditing ? (
                              <div className="flex flex-col gap-1">
                                <Input
                                  value={editDraft.phone}
                                  onChange={(e) => setEditDraft(p => ({ ...p, phone: normalizePhone(e.target.value) }))}
                                  className={`h-9 ${editDraft.phone && !isValidPalestinePhone(editDraft.phone) ? 'border-red-500' : ''}`}
                                  maxLength={10}
                                />
                              </div>
                            ) : sp.phone}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <select value={editDraft.status} onChange={(e) => setEditDraft(p => ({ ...p, status: e.target.value as Supervisor['status'] }))} className="h-9 rounded-md border bg-background px-3">
                                <option value="active">{t('common.labels.active')}</option>
                                <option value="inactive">{t('common.labels.inactive')}</option>
                              </select>
                            ) : (
                              <span className={sp.status === 'active' ? 'inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700' : 'inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700'}>
                                {sp.status === 'active' ? t('common.labels.active') : t('common.labels.inactive')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {!isEditing ? (
                                <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-muted hover:text-blue-600 transition-colors" onClick={() => startEditRow(sp)}>
                                  <Pencil className="size-4" />
                                </button>
                              ) : (
                                <>
                                  <Button className="h-9 bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => saveEditRow(sp.id)} disabled={!isValidPalestinePhone(editDraft.phone) || editDraft.nameAr.trim() === ''}>
                                    <Save className="me-2 size-4" />
                                    {t('common.buttons.save')}
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-9" onClick={cancelEditRow}>
                                    <X className="me-2 size-4" />
                                    {t('common.buttons.cancel')}
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    }) : (
                      <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">{t('common.messages.noData')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 border-t p-4 sm:flex-row sm:items-center sm:justify-between bg-muted/20">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{t('common.labels.total')}:</span>
                    <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="h-9 rounded-md border bg-background px-2 text-sm outline-none">
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="font-medium text-foreground">{rangeStart} - {rangeEnd} / {filtered.length}</div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="h-9 px-4">{t('common.buttons.prev')}</Button>
                  <div className="flex h-9 items-center justify-center rounded-md border bg-background px-4 text-sm font-bold text-blue-600">
                    {safePage} / {totalPages}
                  </div>
                  <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="h-9 px-4">{t('common.buttons.next')}</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={addOpen} onOpenChange={resetAddOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="text-start">
              <DialogTitle>{t('pages.supervisors.addButton')}</DialogTitle>
              <DialogDescription>{t('common.messages.required')}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-5 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-foreground">{t('common.labels.name')} <span className="text-red-500">*</span></label>
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder={t('common.labels.name')} className={`h-11 ${nameAr === '' ? 'border-amber-200' : ''}`} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-foreground">{t('common.labels.phone')} <span className="text-red-500">*</span></label>
                <Input value={phone} onChange={(e) => setPhone(normalizePhone(e.target.value))} placeholder="059xxxxxxx" maxLength={10} className={`h-11 ${phone && !isValidPalestinePhone(phone) ? 'border-red-500' : ''}`} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-foreground">{t('common.labels.region')} <span className="text-red-500">*</span></label>
                <select value={area} onChange={(e) => setArea(e.target.value)} className={`h-11 rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-blue-100 ${area === '' ? 'border-amber-200' : ''}`}>
                  <option value="">{t('common.labels.region')}</option>
                  <option value="north">{t('pages.shelters.regions.north')}</option>
                  <option value="south">{t('pages.shelters.regions.south')}</option>
                  <option value="east">{t('pages.shelters.regions.east')}</option>
                  <option value="west">{t('pages.shelters.regions.west')}</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-foreground">{t('common.labels.status')}</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as Supervisor['status'])} className="h-11 rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-blue-100">
                  <option value="active">{t('common.labels.active')}</option>
                  <option value="inactive">{t('common.labels.inactive')}</option>
                </select>
              </div>
              {addFormError && <p className="text-sm text-red-600 font-medium text-center">{addFormError}</p>}
            </div>
            <DialogFooter className="flex flex-row gap-3 pt-4 border-t">
              <Button onClick={onAdd} disabled={!isAddFormValid || submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11">
                {submitting ? t('common.messages.loading') : t('common.buttons.save')}
              </Button>
              <Button variant="outline" onClick={() => resetAddOpen(false)} className="flex-1 h-11">{t('common.buttons.cancel')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
