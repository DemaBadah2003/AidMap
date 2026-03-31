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

type ContactStatus = 'تم' | 'لم يتم'

type Contact = {
  id: string
  beneficiaryId: string
  institutionId: string
  status: ContactStatus
  beneficiary?: unknown
  institution?: unknown
}

type ApiFieldErrors = Partial<
  Record<'beneficiaryId' | 'institutionId' | 'status', string>
>

type ContactApiItem = {
  id: string
  beneficiaryId: string
  institutionId: string
  status: ContactStatus
  beneficiary?: unknown
  institution?: unknown
}

type ApiErrorShape = {
  message?: string
  fieldErrors?: ApiFieldErrors
}

const BASE_URL = '/api/project/projects/contacts'

const createContactSchema = z.object({
  beneficiaryId: z.string().trim().min(1, 'معرّف المستفيد مطلوب'),
  institutionId: z.string().trim().min(1, 'معرّف المؤسسة مطلوب'),
  status: z.enum(['تم', 'لم يتم']),
})

const updateContactSchema = z
  .object({
    beneficiaryId: z.string().trim().min(1, 'معرّف المستفيد مطلوب').optional(),
    institutionId: z.string().trim().min(1, 'معرّف المؤسسة مطلوب').optional(),
    status: z.enum(['تم', 'لم يتم']).optional(),
  })
  .strict()

const normalizeText = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()

const normalizeSpaces = (value: string) => value.trim().replace(/\s+/g, ' ')
const hasEdgeSpaces = (value: string) => value !== value.trim()
const digitsOnly = (value: string) => value.replace(/\D/g, '')

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
    const error = new Error(msg) as Error & { payload?: ApiErrorShape }
    error.payload = data
    throw error
  }

  return data as T
}

async function readContacts(): Promise<ContactApiItem[]> {
  return requestJSON<ContactApiItem[]>(BASE_URL)
}

function findDuplicateContact(
  contacts: ContactApiItem[],
  input: { beneficiaryId: string; institutionId: string },
  excludeId?: string
) {
  const normalizedBeneficiaryId = normalizeText(input.beneficiaryId)
  const normalizedInstitutionId = normalizeText(input.institutionId)

  const duplicate = contacts.find(
    (c) =>
      c.id !== excludeId &&
      normalizeText(c.beneficiaryId ?? '') === normalizedBeneficiaryId &&
      normalizeText(c.institutionId ?? '') === normalizedInstitutionId
  )

  if (duplicate) {
    return 'البيانات مكررة'
  }

  return ''
}

async function assertContactBusinessValidation(
  input: {
    beneficiaryId: string
    institutionId: string
    status: ContactStatus
  },
  excludeId?: string
) {
  if (!input.beneficiaryId.trim()) {
    throw new Error('معرّف المستفيد مطلوب')
  }

  if (!input.institutionId.trim()) {
    throw new Error('معرّف المؤسسة مطلوب')
  }

  if (hasEdgeSpaces(input.beneficiaryId)) {
    throw new Error('معرّف المستفيد لا يجب أن يبدأ أو ينتهي بمسافة')
  }

  if (hasEdgeSpaces(input.institutionId)) {
    throw new Error('معرّف المؤسسة لا يجب أن يبدأ أو ينتهي بمسافة')
  }

  if (!/^\d+$/.test(normalizeSpaces(input.beneficiaryId))) {
    throw new Error('معرّف المستفيد يجب أن يكون رقمًا صحيحًا')
  }

  if (!/^\d+$/.test(normalizeSpaces(input.institutionId))) {
    throw new Error('معرّف المؤسسة يجب أن يكون رقمًا صحيحًا')
  }

  if (!input.status) {
    throw new Error('الحالة مطلوبة')
  }

  const current = await readContacts()
  const duplicateMessage = findDuplicateContact(current, input, excludeId)

  if (duplicateMessage) {
    throw new Error(duplicateMessage)
  }
}

async function createContact(input: unknown): Promise<ContactApiItem> {
  const body = createContactSchema.parse(input)

  await assertContactBusinessValidation({
    beneficiaryId: body.beneficiaryId,
    institutionId: body.institutionId,
    status: body.status,
  })

  return requestJSON<ContactApiItem>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify({
      beneficiaryId: normalizeSpaces(body.beneficiaryId),
      institutionId: normalizeSpaces(body.institutionId),
      status: body.status,
    }),
  })
}

async function updateContact(id: string, input: unknown): Promise<ContactApiItem> {
  if (!id) throw new Error('معرّف التواصل مفقود')

  const body = updateContactSchema.parse(input)

  const current = await readContacts()
  const existing = current.find((c) => c.id === id)

  if (!existing) {
    throw new Error('التواصل غير موجود')
  }

  const merged = {
    beneficiaryId: body.beneficiaryId ?? existing.beneficiaryId ?? '',
    institutionId: body.institutionId ?? existing.institutionId ?? '',
    status: body.status ?? existing.status,
  }

  await assertContactBusinessValidation(merged, id)

  return requestJSON<ContactApiItem>(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...(body.beneficiaryId !== undefined
        ? { beneficiaryId: normalizeSpaces(body.beneficiaryId) }
        : {}),
      ...(body.institutionId !== undefined
        ? { institutionId: normalizeSpaces(body.institutionId) }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    }),
  })
}

async function deleteContact(id: string): Promise<void> {
  if (!id) throw new Error('معرّف التواصل مفقود')

  await requestJSON(`${BASE_URL}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

async function deleteAllContacts(): Promise<void> {
  await requestJSON(`${BASE_URL}?all=true`, {
    method: 'DELETE',
  })
}

const contactsApi = {
  list: readContacts,
  create: createContact,
  update: updateContact,
  remove: deleteContact,
  removeAll: deleteAllContacts,
}

export default function ContactsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'notdone'>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addOpen, setAddOpen] = useState(false)
  const [beneficiaryId, setBeneficiaryId] = useState('')
  const [institutionId, setInstitutionId] = useState('')
  const [status, setStatus] = useState<ContactStatus>('لم يتم')
  const [submitting, setSubmitting] = useState(false)
  const [addFormError, setAddFormError] = useState('')
  const [addFieldErrors, setAddFieldErrors] = useState<ApiFieldErrors>({})

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    beneficiaryId: string
    institutionId: string
    status: ContactStatus
  }>({
    beneficiaryId: '',
    institutionId: '',
    status: 'لم يتم',
  })
  const [editFieldErrors, setEditFieldErrors] = useState<ApiFieldErrors>({})

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
        const data = await contactsApi.list()

        setItems(
          data.map((x) => ({
            id: x.id,
            beneficiaryId: x.beneficiaryId,
            institutionId: x.institutionId,
            status: x.status,
            beneficiary: x.beneficiary,
            institution: x.institution,
          }))
        )
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

    return items.filter((c) => {
      const matchSearch =
        !s ||
        c.beneficiaryId.toLowerCase().includes(s) ||
        c.institutionId.toLowerCase().includes(s) ||
        c.status.toLowerCase().includes(s)

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'done'
            ? c.status === 'تم'
            : c.status === 'لم يتم'

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
    setBeneficiaryId('')
    setInstitutionId('')
    setStatus('لم يتم')
    setAddFormError('')
    setAddFieldErrors({})
  }

  const isAddFormValid =
    !!beneficiaryId.trim() &&
    !!institutionId.trim() &&
    !!status &&
    /^\d+$/.test(normalizeSpaces(beneficiaryId)) &&
    /^\d+$/.test(normalizeSpaces(institutionId)) &&
    !hasEdgeSpaces(beneficiaryId) &&
    !hasEdgeSpaces(institutionId)

  const applyServerFieldErrorsToAdd = (err: unknown) => {
    const payload = (err as any)?.payload as ApiErrorShape | undefined
    const fieldErrors = payload?.fieldErrors

    if (fieldErrors?.beneficiaryId || fieldErrors?.institutionId || fieldErrors?.status) {
      setAddFieldErrors({
        beneficiaryId: fieldErrors?.beneficiaryId,
        institutionId: fieldErrors?.institutionId,
        status: fieldErrors?.status,
      })
      return true
    }

    return false
  }

  const applyServerFieldErrorsToEdit = (err: unknown) => {
    const payload = (err as any)?.payload as ApiErrorShape | undefined
    const fieldErrors = payload?.fieldErrors

    if (fieldErrors?.beneficiaryId || fieldErrors?.institutionId || fieldErrors?.status) {
      setEditFieldErrors({
        beneficiaryId: fieldErrors?.beneficiaryId,
        institutionId: fieldErrors?.institutionId,
        status: fieldErrors?.status,
      })
      return true
    }

    return false
  }

  const onAdd = async () => {
    const ben = beneficiaryId
    const inst = institutionId

    if (!ben.trim() || !inst.trim() || !status) {
      setAddFormError('يرجى تعبئة جميع الحقول المطلوبة بشكل صحيح')
      return
    }

    setSubmitting(true)
    setError('')
    setAddFormError('')
    setAddFieldErrors({})

    try {
      const created = await contactsApi.create({
        beneficiaryId: ben,
        institutionId: inst,
        status,
      })

      setItems((prev) => [
        {
          id: created.id,
          beneficiaryId: created.beneficiaryId,
          institutionId: created.institutionId,
          status: created.status,
          beneficiary: created.beneficiary,
          institution: created.institution,
        },
        ...prev,
      ])

      resetAddForm()
      setAddOpen(false)
    } catch (err) {
      if (applyServerFieldErrorsToAdd(err)) {
        setAddFormError('')
      } else {
        setAddFormError(getErrorMessage(err))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteOne = async (id: string) => {
    try {
      setError('')
      await contactsApi.remove(id)

      if (editingId === id) setEditingId(null)

      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const startEditRow = (c: Contact) => {
    setEditingId(c.id)
    setEditFieldErrors({})
    setEditDraft({
      beneficiaryId: c.beneficiaryId,
      institutionId: c.institutionId,
      status: c.status,
    })
  }

  const cancelEditRow = () => {
    setEditingId(null)
    setEditFieldErrors({})
  }

  const saveEditRow = async (id: string) => {
    const ben = editDraft.beneficiaryId
    const inst = editDraft.institutionId

    if (!ben.trim() || !inst.trim() || !editDraft.status) {
      setError('يرجى تعبئة البيانات بشكل صحيح قبل الحفظ')
      return
    }

    try {
      setError('')
      setEditFieldErrors({})

      const updated = await contactsApi.update(id, {
        beneficiaryId: ben,
        institutionId: inst,
        status: editDraft.status,
      })

      setItems((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                beneficiaryId: updated.beneficiaryId,
                institutionId: updated.institutionId,
                status: updated.status,
                beneficiary: updated.beneficiary,
                institution: updated.institution,
              }
            : c
        )
      )

      setEditingId(null)
    } catch (err) {
      if (applyServerFieldErrorsToEdit(err)) {
        setError('')
      } else {
        setError(getErrorMessage(err))
      }
    }
  }

  const updateStatusDirectly = async (contact: Contact, nextStatus: ContactStatus) => {
    try {
      setError('')

      const updated = await contactsApi.update(contact.id, {
        status: nextStatus,
      })

      setItems((prev) =>
        prev.map((c) =>
          c.id === contact.id
            ? {
                ...c,
                status: updated.status,
              }
            : c
        )
      )
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const onDeleteAll = async () => {
    try {
      setError('')
      await contactsApi.removeAll()
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
          التواصلات
        </div>

        <div className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
          الرئيسية <span className="mx-1">{'>'}</span>
          <span className="text-foreground">إدارة التواصلات</span>
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
                      placeholder="ابحث عن تواصل"
                      className={`${inputBaseClass} ${topControlHeight} pr-9 pl-3`}
                    />
                  </div>

                  <div className="min-w-[120px] max-w-[140px] sm:min-w-[150px] sm:max-w-[160px] shrink-0">
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as 'all' | 'done' | 'notdone')
                      }
                      className={`${selectBaseClass} ${topControlHeight} truncate`}
                    >
                      <option value="all">كل الحالات</option>
                      <option value="done">تم</option>
                      <option value="notdone">لم يتم</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Button
                    className={`!bg-blue-600 !text-white hover:!bg-blue-700 ${fixedButtonClass}`}
                    onClick={() => {
                      setAddFormError('')
                      setAddFieldErrors({})
                      setAddOpen(true)
                    }}
                  >
                    <Plus className="ms-1 h-4 w-4 shrink-0" />
                    إضافة تواصل
                  </Button>

                  <Button
                    variant="outline"
                    className={`border-slate-200 text-slate-700 hover:bg-slate-50 ${fixedButtonClass}`}
                    onClick={onDeleteAll}
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
                      <th className="w-[28%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        معرّف المستفيد
                      </th>
                      <th className="w-[28%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        معرّف المؤسسة
                      </th>
                      <th className="w-[18%] border-b border-l px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الحالة
                      </th>
                      <th className="w-[26%] border-b px-2 py-3 text-right text-xs font-medium sm:px-4 sm:py-4 sm:text-sm lg:px-5 lg:text-base">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((c) => {
                      const isEditing = editingId === c.id

                      return (
                        <tr key={c.id} className="align-top hover:bg-muted/30">
                          <td className="border-b border-l px-2 py-3 text-right font-medium break-words sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <div>
                                <Input
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  type="text"
                                  value={editDraft.beneficiaryId}
                                  onChange={(e) => {
                                    setEditDraft((p) => ({
                                      ...p,
                                      beneficiaryId: digitsOnly(e.target.value),
                                    }))
                                    setEditFieldErrors((prev) => ({
                                      ...prev,
                                      beneficiaryId: '',
                                    }))
                                  }}
                                  className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                                />
                                {!!editFieldErrors.beneficiaryId && (
                                  <div className="mt-1 text-xs text-red-600">
                                    {editFieldErrors.beneficiaryId}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {c.beneficiaryId}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right break-words sm:px-4 sm:py-4 lg:px-5">
                            {isEditing ? (
                              <div>
                                <Input
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  type="text"
                                  value={editDraft.institutionId}
                                  onChange={(e) => {
                                    setEditDraft((p) => ({
                                      ...p,
                                      institutionId: digitsOnly(e.target.value),
                                    }))
                                    setEditFieldErrors((prev) => ({
                                      ...prev,
                                      institutionId: '',
                                    }))
                                  }}
                                  className="h-9 sm:h-10 lg:h-11 rounded-lg text-right text-xs sm:text-sm lg:text-base font-medium"
                                />
                                {!!editFieldErrors.institutionId && (
                                  <div className="mt-1 text-xs text-red-600">
                                    {editFieldErrors.institutionId}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="block break-words text-xs sm:text-sm lg:text-base font-medium leading-6 sm:leading-7">
                                {c.institutionId}
                              </span>
                            )}
                          </td>

                          <td className="border-b border-l px-2 py-3 text-right sm:px-4 sm:py-4 lg:px-5">
                            <div className="w-[120px] sm:w-[135px] lg:w-[150px] max-w-full">
                              {isEditing ? (
                                <select
                                  value={editDraft.status}
                                  onChange={(e) =>
                                    setEditDraft((p) => ({
                                      ...p,
                                      status: e.target.value as ContactStatus,
                                    }))
                                  }
                                  className="h-9 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-xs sm:text-sm lg:text-base truncate"
                                >
                                  <option value="تم">تم</option>
                                  <option value="لم يتم">لم يتم</option>
                                </select>
                              ) : (
                                <select
                                  value={c.status}
                                  onChange={(e) =>
                                    updateStatusDirectly(c, e.target.value as ContactStatus)
                                  }
                                  className="h-9 sm:h-10 lg:h-11 w-full min-w-0 rounded-lg border bg-background px-2 sm:px-3 text-right text-xs sm:text-sm lg:text-base truncate"
                                >
                                  <option value="تم">تم</option>
                                  <option value="لم يتم">لم يتم</option>
                                </select>
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
                                    onClick={() => startEditRow(c)}
                                  >
                                    <Pencil className="size-4" />
                                  </button>

                                  <button
                                    type="button"
                                    className={`${fixedIconButtonClass} hover:bg-muted`}
                                    title="حذف"
                                    onClick={() => onDeleteOne(c.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    className={tableBtnClass}
                                    onClick={() => saveEditRow(c.id)}
                                    disabled={
                                      !editDraft.beneficiaryId.trim() ||
                                      !editDraft.institutionId.trim()
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
                          لا توجد تواصلات
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
              setAddFieldErrors({})
            }
          }}
        >
          <DialogContent
            className="w-[95vw] max-w-[95vw] rounded-xl sm:max-w-[560px]"
            dir="rtl"
          >
            <DialogHeader className="text-right">
              <DialogTitle>إضافة تواصل</DialogTitle>
              <DialogDescription>إدخال بيانات التواصل</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-right">
              <div className="grid gap-2">
                <div className="text-sm">معرّف المستفيد *</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={beneficiaryId}
                  onChange={(e) => {
                    setBeneficiaryId(digitsOnly(e.target.value))
                    if (addFormError) setAddFormError('')
                    setAddFieldErrors((prev) => ({ ...prev, beneficiaryId: '' }))
                  }}
                  placeholder="مثال: 1"
                  className="h-10 text-right sm:h-11"
                />
                {!!addFieldErrors.beneficiaryId && (
                  <div className="text-xs text-red-600 sm:text-sm">
                    {addFieldErrors.beneficiaryId}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">معرّف المؤسسة *</div>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  value={institutionId}
                  onChange={(e) => {
                    setInstitutionId(digitsOnly(e.target.value))
                    if (addFormError) setAddFormError('')
                    setAddFieldErrors((prev) => ({ ...prev, institutionId: '' }))
                  }}
                  placeholder="مثال: 2"
                  className="h-10 text-right sm:h-11"
                />
                {!!addFieldErrors.institutionId && (
                  <div className="text-xs text-red-600 sm:text-sm">
                    {addFieldErrors.institutionId}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <div className="text-sm">الحالة *</div>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as ContactStatus)
                    if (addFormError) setAddFormError('')
                    setAddFieldErrors((prev) => ({ ...prev, status: '' }))
                  }}
                  className={`h-10 rounded-md border bg-background px-3 text-right sm:h-11 ${
                    addFormError ? 'border-red-500' : ''
                  }`}
                >
                  <option value="لم يتم">لم يتم</option>
                  <option value="تم">تم</option>
                </select>

                {!!addFieldErrors.status && (
                  <div className="text-xs text-red-600 sm:text-sm">{addFieldErrors.status}</div>
                )}

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
                  setAddFieldErrors({})
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