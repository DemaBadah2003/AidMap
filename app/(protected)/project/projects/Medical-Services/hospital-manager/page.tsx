'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '../../../../../../components/ui/card'
import { Button } from '../../../../../../components/ui/button'
import { Input } from '../../../../../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../../../components/ui/dialog'
import { 
  Pencil, 
  Plus, 
  Search, 
  Loader2, 
} from 'lucide-react'

type HospitalManager = {
  id: string
  managerName: string
  email: string
  password?: string // كلمة السر
  phone: string
}

const BASE_URL = '/api/project/projects/hospital-managers' 
const topControlHeight = 'h-10'
const inputBaseClass = 'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-100 font-normal'

export default function HospitalManagersPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<HospitalManager[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5) 

  const [addOpen, setAddOpen] = useState(false)
  
  // States للإضافة (جدول مدراء المستشفيات)
  const [managerName, setManagerName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Omit<HospitalManager, 'id'>>({
    managerName: '', email: '', password: '', phone: ''
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const data = await res.json()
      setItems(data)
    } catch (err) { console.error('Fetch error:', err) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const isEditValid = useMemo(() => {
    return editDraft.managerName.trim() !== '' && editDraft.email.includes('@')
  }, [editDraft])

  const isAddValid = useMemo(() => {
    return managerName.trim() !== '' && email.includes('@') && password.length >= 6 && phone.trim() !== ''
  }, [managerName, email, password, phone])

  const onAdd = async () => {
    if (!isAddValid) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerName, email, password, phone })
      })
      if (res.ok) {
        await fetchData()
        setAddOpen(false)
        resetAddForm()
      }
    } finally { setSubmitting(false) }
  }

  const saveEditRow = async (id: string) => {
    if (!isEditValid) return
    try {
      const res = await fetch(`${BASE_URL}?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft)
      })
      if (res.ok) {
        await fetchData()
        setEditingId(null)
      }
    } catch (err) { console.error(err) }
  }

  const resetAddForm = () => {
    setManagerName(''); setEmail(''); setPassword(''); setPhone('');
  }

  const filtered = useMemo(() => {
    return items.filter((c) => {
      return !q || c.managerName.includes(q) || (c.email || '').includes(q)
    })
  }, [q, items])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 text-right font-arabic">
        <h1 className="text-2xl font-bold text-slate-900">إدارة مدراء المستشفيات</h1>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white font-arabic">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث عن مدير..."
                className={`${inputBaseClass} ${topControlHeight} pr-10 bg-slate-50 border-none`}
              />
            </div>
            <Button onClick={() => setAddOpen(true)} className={`bg-blue-600 text-white hover:bg-blue-700 ${topControlHeight} px-4 rounded-lg mr-auto font-bold`}>
              <Plus className="h-4 w-4 ml-2" /> إضافة مدير
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-slate-500 font-bold">اسم المدير</th>
                  <th className="p-4 text-slate-500 font-bold">البريد الإلكتروني</th>
                  <th className="p-4 text-slate-500 font-bold">رقم الهاتف</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : paginatedData.map((c) => {
                  const isEditing = editingId === c.id;
                  return (
                    <tr key={c.id} className={isEditing ? 'bg-blue-50/40' : 'hover:bg-slate-50/50 transition-colors'}>
                      <td className="p-4 font-bold">{isEditing ? <Input value={editDraft.managerName} onChange={e => setEditDraft({...editDraft, managerName: e.target.value})} /> : c.managerName}</td>
                      <td className="p-4">{isEditing ? <Input value={editDraft.email} onChange={e => setEditDraft({...editDraft, email: e.target.value})} /> : c.email}</td>
                      <td className="p-4">{isEditing ? <Input value={editDraft.phone} onChange={e => setEditDraft({...editDraft, phone: e.target.value})} /> : c.phone}</td>
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" onClick={() => saveEditRow(c.id)}>حفظ</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>إلغاء</Button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingId(c.id); setEditDraft(c); }} className="p-2 hover:bg-blue-50 rounded-md text-slate-400 hover:text-blue-600 transition-colors">
                            <Pencil className="w-4 h-4"/>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pop-up الإضافة */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md font-arabic rounded-2xl shadow-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">إضافة مدير مستشفى جديد</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-4 text-right">
            
            {/* 1. اسم المدير */}
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">اسم مدير المستشفى</label>
               <Input className="h-11 bg-slate-50 border-slate-200" value={managerName} onChange={e => setManagerName(e.target.value)} placeholder="أدخل الاسم الكامل" />
            </div>

            {/* 2. البريد الإلكتروني */}
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">البريد الإلكتروني</label>
               <Input type="email" className="h-11 bg-slate-50 border-slate-200" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@hospital.com" />
            </div>

            {/* 3. كلمة السر */}
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">كلمة السر</label>
               <Input type="password" className="h-11 bg-slate-50 border-slate-200" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            {/* 4. رقم الهاتف */}
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">رقم الهاتف</label>
               <Input className="h-11 bg-slate-50 border-slate-200" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05XXXXXXXX" />
            </div>

          </div>

          <DialogFooter className="gap-3 mt-2">
            <Button onClick={onAdd} disabled={submitting || !isAddValid} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null} حفظ البيانات
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 border-slate-200 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}