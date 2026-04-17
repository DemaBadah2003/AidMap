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
  AlertCircle 
} from 'lucide-react'

const SERVICE_TYPES = ['طوارئ', 'جراحة', 'توفير دواء', 'سيارة إسعاف', 'فحص عام']
const PRIORITY_LEVELS = ['عاجل', 'متوسط', 'عادي']
const STATUS_OPTIONS = ['بانتظار المراجعة', 'جاري التنفيذ', 'تم الحل', 'مرفوض']

type MedicalRequest = {
  id: string
  serviceType: string
  priority: string
  patientName: string
  hospitalName: string
  status: string
  description: string
}

type PatientData = { id: string; name: string }
type HospitalData = { id: string; name: string }

const BASE_URL = '/api/project/projects/medical/requests'
const PATIENTS_URL = '/api/project/projects/medical/patients'
const HOSPITALS_URL = '/api/project/projects/medical/hospital'

const selectBaseClass = 'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-right text-xs sm:text-sm outline-none focus:ring-2 focus:ring-slate-100 font-normal'

export default function MedicalRequestsPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<MedicalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [patientsList, setPatientsList] = useState<PatientData[]>([])
  const [hospitalsList, setHospitalsList] = useState<HospitalData[]>([])

  const [addOpen, setAddOpen] = useState(false)
  const [serviceType, setServiceType] = useState('')
  const [priority, setPriority] = useState('')
  const [patientName, setPatientName] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [status, setStatus] = useState('بانتظار المراجعة')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true)
      try {
        const [reqRes, patRes, hosRes] = await Promise.all([
          fetch(BASE_URL),
          fetch(PATIENTS_URL),
          fetch(HOSPITALS_URL)
        ])
        const [reqData, patData, hosData] = await Promise.all([
          reqRes.json(), patRes.json(), hosRes.json()
        ])
        setItems(reqData)
        setPatientsList(patData)
        setHospitalsList(hosData)
      } catch (err) { console.error('Error loading data:', err) } 
      finally { setLoading(false) }
    }
    loadAllData()
  }, [])

  const isAddValid = useMemo(() => {
    return serviceType !== '' && priority !== '' && patientName !== '' && hospitalName !== ''
  }, [serviceType, priority, patientName, hospitalName])

  const onAdd = async () => {
    if (!isAddValid) return
    setSubmitting(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType, priority, patientName, hospitalName, status, description })
      })
      if (res.ok) {
        const newData = await res.json()
        setItems(prev => [newData, ...prev])
        setAddOpen(false)
        resetAddForm()
      }
    } finally { setSubmitting(false) }
  }

  const resetAddForm = () => {
    setServiceType(''); setPriority(''); setPatientName(''); setHospitalName(''); setStatus('بانتظار المراجعة'); setDescription('');
  }

  return (
    <div className="w-full px-4 py-6" dir="rtl">
      <div className="mb-6 text-right">
        <h1 className="text-2xl font-bold text-slate-900">إدارة الطلبات الطبية</h1>
        <p className="text-sm text-slate-500 mt-1 font-normal">الرئيسية &gt; طلبات الخدمات</p>
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
                className="w-full pr-10 bg-slate-50 border-none h-10 rounded-lg text-sm"
              />
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 rounded-lg mr-auto font-bold shadow-sm">
              <Plus className="h-4 w-4 ml-2" /> إضافة طلب جديد
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                <tr>
                  <th className="p-4">اسم المريض</th>
                  <th className="p-4">المستشفى</th>
                  <th className="p-4">نوع الخدمة</th>
                  <th className="p-4 text-center">الأولوية</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="animate-spin mx-auto w-6 h-6 text-slate-300" /></td></tr>
                ) : items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-700">{item.patientName}</td>
                    <td className="p-4 text-slate-600 font-medium">{item.hospitalName}</td>
                    <td className="p-4">{item.serviceType}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] text-white font-bold ${
                        item.priority === 'عاجل' ? 'bg-red-500' : item.priority === 'متوسط' ? 'bg-orange-500' : 'bg-green-500'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[11px]">{item.status}</span>
                    </td>
                    <td className="p-4 text-center"><Pencil className="w-4 h-4 mx-auto text-slate-400 cursor-pointer hover:text-blue-600" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-md font-arabic rounded-2xl">
          <DialogHeader><DialogTitle className="text-right text-lg font-bold">إضافة طلب خدمة طبية</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-5 py-4 text-right">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">اسم المريض</label>
              <select className={selectBaseClass + " h-11 bg-slate-50"} value={patientName} onChange={e => setPatientName(e.target.value)}>
                <option value="">اختر المريض</option>
                {patientsList.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">المستشفى</label>
              <select className={selectBaseClass + " h-11 bg-slate-50"} value={hospitalName} onChange={e => setHospitalName(e.target.value)}>
                <option value="">اختر المستشفى</option>
                {hospitalsList.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نوع الخدمة</label>
              <select className={selectBaseClass + " h-11 bg-slate-50"} value={serviceType} onChange={e => setServiceType(e.target.value)}>
                <option value="">اختر الخدمة</option>
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">الأولوية</label>
              <select className={selectBaseClass + " h-11 bg-slate-50"} value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="">اختر مستوى الأولوية</option>
                {PRIORITY_LEVELS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">الحالة</label>
              <select className={selectBaseClass + " h-11 bg-slate-50"} value={status} onChange={e => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>

            {!isAddValid && (
              <div className="text-[11px] text-amber-600 flex items-center gap-2 bg-amber-50 p-2 rounded-lg border border-amber-100 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0"/> يرجى تعبئة كافة الحقول الأساسية.
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-row gap-3">
            <Button onClick={onAdd} disabled={!isAddValid || submitting} className="flex-1 bg-blue-600 text-white font-bold h-11 rounded-xl">
              {submitting ? <Loader2 className="animate-spin ml-2" /> : null} حفظ الطلب
            </Button>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1 h-11 rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}