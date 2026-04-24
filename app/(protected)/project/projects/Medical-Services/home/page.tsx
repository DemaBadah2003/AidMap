'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Stethoscope, Users, Activity, MapPin, Compass, Loader2 } from 'lucide-react'

export default function AdvancedReliefSystem() {
  const [dbLocations, setDbLocations] = useState<string[]>([])
  const [dbRegions, setDbRegions] = useState<string[]>([])
  const [dbHospitals, setDbHospitals] = useState<{id: string, name: string}[]>([])
  const [dbHospitalData, setDbHospitalData] = useState<any>(null)

  const [selectedLoc, setSelectedLoc] = useState('')
  const [selectedReg, setSelectedReg] = useState('')
  const [selectedHosp, setSelectedHosp] = useState('')
  const [selectedDept, setSelectedDept] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // التعديل الجوهري: استخدام الحروف الكبيرة لتطابق المجلد الفعلي
  const API_BASE = '/api/project/Medical-Services/home';

  useEffect(() => {
    fetch(`${API_BASE}?type=locations`)
      .then(res => res.json())
      .then(data => setDbLocations(data))
      .catch(err => console.error("Error loading locations:", err));
  }, [])

  useEffect(() => {
    if (selectedLoc) {
      fetch(`${API_BASE}?type=regions&location=${selectedLoc}`)
        .then(res => res.json())
        .then(data => setDbRegions(data))
    }
  }, [selectedLoc])

  useEffect(() => {
    if (selectedReg) {
      fetch(`${API_BASE}?type=hospitals&region=${selectedReg}`)
        .then(res => res.json())
        .then(data => setDbHospitals(data))
    }
  }, [selectedReg])

  useEffect(() => {
    if (selectedHosp) {
      setLoading(true)
      fetch(`${API_BASE}?type=details&hospitalId=${selectedHosp}`)
        .then(res => res.json())
        .then(data => {
          setDbHospitalData(data)
          setLoading(false)
        })
    }
  }, [selectedHosp])

  return (
    <div className="w-full px-4 py-8 sm:px-10 font-arabic" dir="rtl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-blue-900 tracking-tight">نظام استعلام AidMap المتكامل</h1>
        <p className="text-blue-600 font-medium mt-2">بيانات حية من جداول قاعدة البيانات</p>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden mb-10">
        <CardContent className="p-8 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Compass className="w-4 h-4 text-blue-500" /> الموقع</label>
              <select 
                className="w-full h-12 border-2 border-white shadow-sm rounded-2xl px-4 bg-white outline-none"
                value={selectedLoc}
                onChange={(e) => { setSelectedLoc(e.target.value); setSelectedReg(''); setDbHospitals([]); }}
              >
                <option value="">اختر الموقع</option>
                {dbLocations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /> المنطقة</label>
              <select 
                className="w-full h-12 border-2 border-white shadow-sm rounded-2xl px-4 bg-white disabled:opacity-50"
                disabled={!selectedLoc}
                value={selectedReg}
                onChange={(e) => { setSelectedReg(e.target.value); setSelectedHosp(''); }}
              >
                <option value="">اختر المنطقة</option>
                {dbRegions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" /> المستشفى</label>
              <select 
                className="w-full h-12 border-2 border-white shadow-sm rounded-2xl px-4 bg-white disabled:opacity-50"
                disabled={!selectedReg}
                value={selectedHosp}
                onChange={(e) => setSelectedHosp(e.target.value)}
              >
                <option value="">اختر المستشفى</option>
                {dbHospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-blue-500" /> القسم</label>
              <select 
                className="w-full h-12 border-2 border-white shadow-sm rounded-2xl px-4 bg-white disabled:opacity-50"
                disabled={!selectedHosp || loading}
                onChange={(e) => {
                  const dept = dbHospitalData?.departments.find((d: any) => d.id === e.target.value);
                  setSelectedDept(dept);
                }}
              >
                <option value="">اختر القسم</option>
                {dbHospitalData?.departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>}

      {!loading && selectedDept && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-lg bg-white rounded-3xl p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4 border-b pb-3 flex items-center gap-2"><Activity className="text-blue-500" /> الخدمات</h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedDept.services?.map((s: any) => (
                <div key={s.id} className="bg-blue-50 text-blue-700 p-3 rounded-xl text-center font-bold border border-blue-100">{s.name}</div>
              ))}
            </div>
          </Card>

          <Card className="border-none shadow-lg bg-white rounded-3xl p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4 border-b pb-3 flex items-center gap-2"><Users className="text-emerald-500" /> الطاقم الطبي</h3>
            <div className="space-y-3">
              {selectedDept.doctors?.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">{d.name}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">{d.specialty}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}