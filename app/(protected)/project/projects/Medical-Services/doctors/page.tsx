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

// التخصصات المطلوبة
const SPECIALIZATIONS_DATA: Record<string, string[]> = {
  'باطنة': ['قلب', 'جهاز هضمي', 'كلى'],
  'جراحة': ['جراحة عامة', 'عظام', 'تجميل'],
  'أطفال': ['حديثي ولادة', 'تغذية أطفال'],
  'نسائية': ['توليد', 'عقم']
}

type Doctor = {
  id: string
  doctorName: string
  hospitalName: string // الحقل الجديد
  specialization: string
  subSpecialization: string
  phone: string
  appointments: string
  description: string
  patientsCount: number
  patientsNames: string
}

const BASE_URL = '/api/project/projects/doctors'
const topControlHeight = 'h-10'
const inputBaseClass = 'w-full min-w-0 rounded-lg border-slate-200 bg-white text-right text-xs sm:text-sm outline-none focus:!ring-2 focus:!ring-slate-100 font-normal'
const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

export default function DoctorsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5) 

  const [addOpen, setAddOpen] = useState(false)
  
  // States للإضافة
  const [doctorName, setDoctorName] = useState('')
  const [hospitalName, setHospitalName] = useState('') // state الحقل الجديد
  const [specialization, setSpecialization] = useState('')
  const [phone, setPhone] = useState('')
  const [appointments, setAppointments] = useState('')
  const [description, setDescription] = useState('')
  
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Omit<Doctor, 'id'>>({
    doctorName: '', hospitalName: '', specialization: '', subSpecialization: '', phone: '', appointments: '', description: '', patientsCount: 0, patientsNames: ''
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL)
      const docsData = await res.json()
      setItems(docsData)
    } catch (err) { console.error('Fetch error:', err) } 
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const isEditValid = useMemo(() => {
    return editDraft.doctorName.trim() !== '' && editDraft.specialization !== ''
  }, [editDraft])

  const isAddValid = useMemo(() => {
    return doctorName.trim() !== '' && specialization !== '' && phone.trim() !== ''
  }, [doctorName, specialization, phone])

  const onAdd = async () => {
    if (!isAddValid) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName, hospitalName, specialization, phone, appointments, description
        })
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
    setDoctorName(''); setHospitalName(''); setSpecialization(''); setPhone(''); 
    setAppointments(''); setDescription('');
  }

  const filtered = useMemo(() => {
    return items.filter((c) => {
      return !q || c.doctorName.includes(q) || (c.specialization || '').includes(q) || (c.hospitalName || '').includes(q)
    })
  }, [q, items])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 text-right font-arabic">
        <h1 className="text-2xl font-bold text-slate-900">إدارة الأطباء</h1>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl bg-white font-arabic">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row items-center gap-3 border-b">
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث..."
                className={`${inputBaseClass} ${topControlHeight} pr-10 bg-slate-50 border-none`}
              />
            </div>
            <Button onClick={() => setAddOpen(true)} className={`bg-blue-600 text-white hover:bg-blue-700 ${topControlHeight} px-4 rounded-lg mr-auto font-bold`}>
              <Plus className="h-4 w-4 ml-2" /> إضافة دكتور
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-slate-500 font-bold">اسم الدكتور</th>
                  <th className="p-4 text-slate-500 font-bold">المستشفى</th>
                  <th className="p-4 text-slate-500 font-bold">التخصص</th>
                  <th className="p-4 text-slate-500 font-bold">رقم الهاتف</th>
                  <th className="p-4 text-slate-500 font-bold">مواعيد العمل</th>
                  <th className="p-4 text-slate-500 font-bold">الوصف</th>
                  <th className="p-4 text-center text-slate-500 font-bold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={7} className="p-20 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" /></td></tr>
                ) : paginatedData.map((c) => {
                  const isEditing = editingId === c.id;
                  return (
                    <tr key={c.id} className={isEditing ? 'bg-blue-50/40' : 'hover:bg-slate-50/50 transition-colors'}>
                      <td className="p-4 font-medium">{isEditing ? <Input value={editDraft.doctorName} onChange={e => setEditDraft({...editDraft, doctorName: e.target.value})} /> : c.doctorName}</td>
                      <td className="p-4">{isEditing ? <Input value={editDraft.hospitalName} onChange={e => setEditDraft({...editDraft, hospitalName: e.target.value})} /> : (c.hospitalName || '-')}</td>
                      <td className="p-4">{isEditing ? (
                          <select className={selectBaseClass} value={editDraft.specialization} onChange={e => setEditDraft({...editDraft, specialization: e.target.value})}>
                             {Object.keys(SPECIALIZATIONS_DATA).map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                      ) : c.specialization}</td>
                      <td className="p-4">{isEditing ? <Input value={editDraft.phone} onChange={e => setEditDraft({...editDraft, phone: e.target.value})} /> : c.phone}</td>
                      <td className="p-4">{isEditing ? <Input value={editDraft.appointments} onChange={e => setEditDraft({...editDraft, appointments: e.target.value})} /> : (c.appointments || '-')}</td>
                      <td className="p-4 max-w-[150px] truncate">{isEditing ? <Input value={editDraft.description} onChange={e => setEditDraft({...editDraft, description: e.target.value})} /> : (c.description || '-')}</td>
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

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md font-arabic rounded-2xl shadow-2xl border-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right text-lg font-bold">إضافة دكتور جديد</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-4 text-right">
            
            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">اسم الدكتور</label>
               <Input className="h-11 bg-slate-50 border-slate-200" value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="أدخل اسم الدكتور" />
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">اسم المستشفى</label>
               <Input className="h-11 bg-slate-50 border-slate-200" value={hospitalName} onChange={e => setHospitalName(e.target.value)} placeholder="أدخل اسم المستشفى" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">التخصص</label>
              <select className={`${selectBaseClass} h-11 bg-slate-50 border-slate-200`} value={specialization} onChange={e => setSpecialization(e.target.value)}>
                  <option value="">اختر التخصص</option>
                  {Object.keys(SPECIALIZATIONS_DATA).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">رقم الهاتف</label>
              <Input className="h-11 bg-slate-50 border-slate-200" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05XXXXXXXX" />
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">مواعيد العمل</label>
               <Input className="h-11 bg-slate-50 border-slate-200" value={appointments} onChange={e => setAppointments(e.target.value)} placeholder="مثال: من 8ص إلى 4م" />
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700">الوصف / السيرة الذاتية</label>
               <Input className="h-11 bg-slate-50 border-slate-200" value={description} onChange={e => setDescription(e.target.value)} placeholder="نبذة قصيرة عن الدكتور" />
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