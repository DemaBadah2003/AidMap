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

import { Pencil, Trash2, Save, X, Plus, Search, MapPin } from 'lucide-react'

type Priority = 'مستعجل' | 'عادي' | 'حرج'

type Beneficiary = {
  id: string
  nameAr: string
  phone: string
  familyCount: number
  area: string
  campId: string
  campName: string
  priority: Priority
}

type BeneficiaryApiItem = {
  id: string
  nameAr: string
  phone: string
  familyCount: number
  area: string
  campId: string
  campName: string
  priority: Priority
}

type CampOption = {
  id: string
  name: string
  area: string // أضفنا المنطقة هنا للفلترة
}

type AddFormErrors = {
  nameAr: string
  phone: string
  familyCount: string
  area: string
  campId: string
  priority: string
}

const BASE_URL = '/api/project/projects/beneficiaries'
const CAMPS_OPTIONS_URL = '/api/project/projects/camps?forBeneficiary=true'

const phoneRegex = /^(056|059)\d{7}$/
const hasNoOuterSpaces = (value: string) => value === value.trim()

// مصفوفة المناطق الثابتة
const AREAS = ['شمال غزة', 'غزة', 'الوسطى', 'خانيونس', 'رفح']

const createBeneficiarySchema = z.object({
  nameAr: z
    .string()
    .min(1, 'اسم المستفيد مطلوب')
    .refine((value) => hasNoOuterSpaces(value), {
      message: 'اسم المستفيد يجب ألا يبدأ أو ينتهي بمسافة',
    }),
  phone: z
    .string()
    .trim()
    .min(1, 'رقم الهاتف مطلوب')
    .regex(phoneRegex, 'رقم الهاتف يجب أن يبدأ بـ 056 أو 059 وبعده 7 أرقام'),
  familyCount: z.coerce.number().int().positive('يجب أن يكون عدد أفراد الأسرة أكبر من 0'),
  area: z.string().min(1, 'المنطقة مطلوبة'),
  campId: z.string().trim().min(1, 'اسم المخيم مطلوب'),
  priority: z.enum(['مستعجل', 'عادي', 'حرج']),
})

const updateBeneficiarySchema = z.object({
  nameAr: z.string().min(1).optional(),
  phone: z.string().regex(phoneRegex).optional(),
  familyCount: z.coerce.number().int().positive().optional(),
  area: z.string().optional(),
  campId: z.string().optional(),
  priority: z.enum(['مستعجل', 'عادي', 'حرج']).optional(),
}).strict()

const toIntOnly = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

const normalizePhone = (value: string) => value.replace(/\D/g, '').trim()
const isValidPhone = (value: string) => phoneRegex.test(value)

const getEmptyAddErrors = (): AddFormErrors => ({
  nameAr: '',
  phone: '',
  familyCount: '',
  area: '',
  campId: '',
  priority: '',
})

const badgeClassByPriority = (p: Priority) => {
  if (p === 'مستعجل') return 'bg-primary text-primary-foreground'
  if (p === 'حرج') return 'bg-destructive text-destructive-foreground'
  return 'bg-muted text-foreground'
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
  let data: any = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(data?.message ?? `فشل الطلب: ${res.status}`)
  return data as T
}

const beneficiariesApi = {
  list: () => requestJSON<BeneficiaryApiItem[]>(BASE_URL),
  create: (body: any) => requestJSON<BeneficiaryApiItem>(BASE_URL, { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => requestJSON<BeneficiaryApiItem>(`${BASE_URL}?id=${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: string) => requestJSON(`${BASE_URL}?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  removeAll: () => requestJSON(`${BASE_URL}?all=true`, { method: 'DELETE' }),
}

export default function BeneficiariesPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Beneficiary[]>([])
  const [campOptions, setCampOptions] = useState<CampOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // الفلاتر العلوية
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all')
  const [areaFilter, setAreaFilter] = useState<'all' | string>('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // حالة الفورم (إضافة)
  const [addOpen, setAddOpen] = useState(false)
  const [nameAr, setNameAr] = useState('')
  const [phone, setPhone] = useState('')
  const [familyCount, setFamilyCount] = useState<number>(0)
  const [selectedArea, setSelectedArea] = useState('') // الحقل الجديد
  const [campId, setCampId] = useState('')
  const [priority, setPriority] = useState<Priority>('عادي')
  const [submitting, setSubmitting] = useState(false)
  const [addErrors, setAddErrors] = useState<AddFormErrors>(getEmptyAddErrors())

  // حالة التعديل
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<Beneficiary>>({})

  const topControlHeight = 'h-10 sm:h-11'
  const fixedButtonClass = 'h-10 sm:h-11 min-w-[110px] sm:min-w-[130px] px-4 sm:px-5 rounded-lg text-xs sm:text-sm flex items-center justify-center whitespace-nowrap'
  const selectBaseClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-200 h-10'
  const inputBaseClass = 'w-full rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-200 h-10'

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [bens, camps] = await Promise.all([beneficiariesApi.list(), requestJSON<CampOption[]>(CAMPS_OPTIONS_URL)])
        setItems(bens)
        setCampOptions(camps)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // المخيمات المفلترة حسب المنطقة المختارة في فورم الإضافة
  const filteredCampsForAdd = useMemo(() => {
    return campOptions.filter(c => c.area === selectedArea)
  }, [campOptions, selectedArea])

  // البحث والفلترة في الجدول
  const filtered = useMemo(() => {
    return items.filter((b) => {
      const matchSearch = !q || b.nameAr.includes(q) || b.phone.includes(q)
      const matchPriority = priorityFilter === 'all' || b.priority === priorityFilter
      const matchArea = areaFilter === 'all' || b.area === areaFilter
      return matchSearch && matchPriority && matchArea
    })
  }, [q, items, priorityFilter, areaFilter])

  const onAdd = async () => {
    setAddErrors(getEmptyAddErrors())
    try {
      const data = { nameAr: nameAr.trim(), phone: normalizePhone(phone), familyCount, area: selectedArea, campId, priority }
      createBeneficiarySchema.parse(data)
      setSubmitting(true)
      const created = await beneficiariesApi.create(data)
      setItems([created, ...items])
      setAddOpen(false)
      resetAddForm()
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const flattened = err.flatten().fieldErrors
        setAddErrors(prev => ({ ...prev, ...Object.fromEntries(Object.entries(flattened).map(([k, v]) => [k, v?.[0]])) }))
      } else {
        setError(err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const resetAddForm = () => {
    setNameAr(''); setPhone(''); setFamilyCount(0); setSelectedArea(''); setCampId(''); setPriority('عادي'); setAddErrors(getEmptyAddErrors())
  }

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)))
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="w-full px-2 py-3 sm:px-4 sm:py-5 lg:px-6" dir="rtl">
      {/* Header */}
      <div className="mb-4 sm:mb-6 text-right">
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">المستفيدون</h1>
        <p className="text-xs text-slate-500 sm:text-sm">إدارة بيانات النازحين وتوزيعهم على المخيمات</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {/* Controls */}
          <div className="p-3 sm:p-4 bg-slate-50/50 border-b">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="بحث بالاسم أو الهاتف..." 
                    className="pr-9" 
                    value={q} 
                    onChange={e => setQ(e.target.value)} 
                  />
                </div>
                
                {/* فلتر المنطقة في الجدول */}
                <select 
                  className={`${selectBaseClass} w-full sm:w-40`}
                  value={areaFilter}
                  onChange={e => setAreaFilter(e.target.value)}
                >
                  <option value="all">كل المناطق</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>

                <select 
                  className={`${selectBaseClass} w-full sm:w-40`}
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value as any)}
                >
                  <option value="all">كل الأولويات</option>
                  <option value="مستعجل">مستعجل</option>
                  <option value="عادي">عادي</option>
                  <option value="حرج">حرج</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => setAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <Plus className="h-4 w-4" /> إضافة مستفيد
                </Button>
                <Button variant="outline" onClick={() => beneficiariesApi.removeAll().then(() => setItems([]))} className="text-red-600 border-red-200 hover:bg-red-50">
                  حذف الكل
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                <tr>
                  <th className="px-4 py-3">اسم المستفيد</th>
                  <th className="px-4 py-3">الهاتف</th>
                  <th className="px-4 py-3">المنطقة</th>
                  <th className="px-4 py-3">المخيم</th>
                  <th className="px-4 py-3">الأسرة</th>
                  <th className="px-4 py-3">الأولوية</th>
                  <th className="px-4 py-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pageItems.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{b.nameAr}</td>
                    <td className="px-4 py-3 tabular-nums">{b.phone}</td>
                    <td className="px-4 py-3 text-slate-500">{b.area}</td>
                    <td className="px-4 py-3 text-blue-600 font-medium">{b.campName}</td>
                    <td className="px-4 py-3 text-center">{b.familyCount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${badgeClassByPriority(b.priority)}`}>
                        {b.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => beneficiariesApi.remove(b.id).then(() => setItems(items.filter(i => i.id !== b.id)))} className="h-8 w-8 text-slate-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-right">إضافة مستفيد جديد</DialogTitle>
            <DialogDescription className="text-right">أدخل بيانات النازح بدقة لضمان وصول المساعدات.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-right">
            <div className="space-y-2">
              <label className="text-sm font-bold">اسم المستفيد</label>
              <Input value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder="الاسم الكامل" />
              {addErrors.nameAr && <p className="text-xs text-red-500">{addErrors.nameAr}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">رقم الهاتف</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="059xxxxxxx" />
                {addErrors.phone && <p className="text-xs text-red-500">{addErrors.phone}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">عدد أفراد الأسرة</label>
                <Input type="number" value={familyCount || ''} onChange={e => setFamilyCount(Number(e.target.value))} />
              </div>
            </div>

            {/* حقل المنطقة المضاف */}
            <div className="space-y-2">
              <label className="text-sm font-bold">المنطقة (المحافظة)</label>
              <select 
                className={selectBaseClass} 
                value={selectedArea} 
                onChange={e => { setSelectedArea(e.target.value); setCampId(''); }}
              >
                <option value="">اختر المنطقة</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {addErrors.area && <p className="text-xs text-red-500">{addErrors.area}</p>}
            </div>

            {/* حقل المخيم المفلتر */}
            <div className="space-y-2">
              <label className="text-sm font-bold">اسم المخيم</label>
              <select 
                className={selectBaseClass} 
                value={campId} 
                onChange={e => setCampId(e.target.value)}
                disabled={!selectedArea}
              >
                <option value="">{selectedArea ? 'اختر المخيم من القائمة' : 'يرجى اختيار المنطقة أولاً'}</option>
                {filteredCampsForAdd.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {addErrors.campId && <p className="text-xs text-red-500">{addErrors.campId}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">درجة الأولوية</label>
              <div className="flex gap-2">
                {(['عادي', 'مستعجل', 'حرج'] as Priority[]).map(p => (
                  <Button 
                    key={p} 
                    type="button"
                    variant={priority === p ? 'default' : 'outline'} 
                    onClick={() => setPriority(p)}
                    className="flex-1"
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button>
            <Button onClick={onAdd} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? 'جارٍ الحفظ...' : 'حفظ البيانات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}