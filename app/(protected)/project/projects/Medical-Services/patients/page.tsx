'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Pencil, Plus, Search, Loader2, AlertCircle } from 'lucide-react'

type Patient = {
  id: string
  name: string
  phone: string
  diseaseType: string
}

const BASE_URL = '/api/project/projects/medical/patients'

export default function PatientsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [diseaseType, setDiseaseType] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchPatients = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPatients() }, [])

  const isPhoneValid = useMemo(() => /^(056|059)\d{7}$/.test(phone), [phone])
  const isAddValid = useMemo(() => name.trim() !== '' && diseaseType.trim() !== '' && isPhoneValid, [name, diseaseType, isPhoneValid])

  const onAdd = async () => {
    if (!isAddValid) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, diseaseType }),
      })
      if (res.ok) {
        await fetchPatients()
        setAddOpen(false)
        setName(''); setPhone(''); setDiseaseType('')
        setCurrentPage(1)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = useMemo(() =>
    items.filter(p => !q || p.name.includes(q) || p.phone.includes(q) || p.diseaseType.includes(q)),
    [q, items]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const rangeEnd = Math.min(currentPage * itemsPerPage, filtered.length)

  useEffect(() => { setCurrentPage(1) }, [q, itemsPerPage])

  return (
    <div className="w-full px-4 py-6">
      {/* Page header */}
      <div className="mb-6 text-right">
        <h1 className="text-2xl font-bold text-foreground">إدارة المرضى</h1>
        <p className="mt-1 text-sm text-muted-foreground">الرئيسية &gt; جدول المرضى</p>
      </div>

      <Card className="overflow-hidden rounded-xl border shadow-sm">
        <CardContent className="p-0">

          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث بالاسم أو الهاتف..."
                className="h-10 pr-10"
              />
            </div>
            <Button
              onClick={() => setAddOpen(true)}
              className="h-10 gap-2 bg-blue-600 px-4 text-white hover:bg-blue-700 sm:mr-auto"
            >
              <Plus className="size-4" />
              إضافة مريض
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-right text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="p-4 font-semibold text-muted-foreground">اسم المريض</th>
                  <th className="p-4 font-semibold text-muted-foreground">نوع المرض</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">رقم الهاتف</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-16 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                      جاري التحميل...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-16 text-center text-muted-foreground italic">
                      لا توجد بيانات مرضى.
                    </td>
                  </tr>
                ) : paginated.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-muted/30">
                    <td className="p-4 font-semibold text-foreground">{p.name}</td>
                    <td className="p-4">
                      <span className="rounded bg-blue-100 px-2 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {p.diseaseType}
                      </span>
                    </td>
                    <td className="p-4 text-center font-medium text-muted-foreground">{p.phone}</td>
                    <td className="p-4 text-center">
                      <button className="rounded-md border p-2 text-muted-foreground transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30">
                        <Pencil className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>عرض صفوف:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="h-8 rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                {rangeStart} – {rangeEnd} من {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">إضافة مريض جديد</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2 text-right">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">اسم المريض</label>
              <Input
                placeholder="أدخل اسم المريض الرباعي"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">نوع المرض</label>
              <Input
                placeholder="مثلاً: سكري، ضغط..."
                value={diseaseType}
                onChange={e => setDiseaseType(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">رقم الهاتف</label>
              <Input
                dir="ltr"
                placeholder="059XXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={phone && !isPhoneValid ? 'border-red-400 focus-visible:ring-red-200' : ''}
              />
              {phone && !isPhoneValid && (
                <p className="text-xs text-red-500">يجب أن يبدأ بـ 056 أو 059 ويتكون من 10 أرقام.</p>
              )}
            </div>

            {!isAddValid && (name || phone || diseaseType) && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                <AlertCircle className="size-4 shrink-0" />
                يرجى التأكد من تعبئة كافة الحقول وصحة رقم الهاتف.
              </div>
            )}
          </div>

          <DialogFooter className="mt-2 flex flex-row gap-3">
            <Button
              onClick={onAdd}
              disabled={!isAddValid || submitting}
              className="flex-1 h-11 gap-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              حفظ البيانات
            </Button>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              className="flex-1 h-11 rounded-xl"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
