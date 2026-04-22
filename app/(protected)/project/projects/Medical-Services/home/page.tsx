'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Stethoscope, Users, Activity, MapPin, Compass } from 'lucide-react'

// --- البيانات التجريبية (يمكنك جلبها من الـ API لاحقاً) ---
const LOCATIONS = ['شمال', 'جنوب', 'شرق', 'غرب']

const REGIONS: Record<string, string[]> = {
  'شمال': ['جباليا', 'بيت لاهيا', 'بيت حانون'],
  'غرب': ['الرمال', 'الشيخ رضوان', 'النصر', 'تل الهوى'],
  'شرق': ['الشجاعية', 'الزيتون', 'التفاح'],
  'جنوب': ['رفح', 'خانيونس']
}

const HOSPITALS: Record<string, string[]> = {
  'الرمال': ['مجمع الشفاء الطبي', 'مستشفى الخدمة العامة'],
  'جباليا': ['مستشفى كمال عدوان', 'مستشفى العودة'],
  'خانيونس': ['مجمع ناصر الطبي', 'مستشفى الأمل']
}

const DEPARTMENTS: Record<string, { name: string; services: string[]; doctors: string[] }[]> = {
  'مجمع الشفاء الطبي': [
    { name: 'قسم الطوارئ', services: ['إنعاش قلب', 'جراحة عاجلة'], doctors: ['د. أحمد علي', 'د. سارة خالد'] },
    { name: 'قسم الكلى', services: ['غسيل كلى', 'تحليل دم'], doctors: ['د. محمد حسن'] }
  ],
  'مستشفى كمال عدوان': [
    { name: 'قسم الأطفال', services: ['تطعيمات', 'حضانة'], doctors: ['د. ليلى يوسف'] }
  ]
}

export default function AdvancedReliefSystem() {
  // حالات الاختيار (States)
  const [selectedLoc, setSelectedLoc] = useState('')
  const [selectedReg, setSelectedReg] = useState('')
  const [selectedHosp, setSelectedHosp] = useState('')
  const [selectedDept, setSelectedDept] = useState<any>(null)

  // منطق تصفير الخيارات عند تغيير الاختيار الأب
  const handleLocChange = (val: string) => {
    setSelectedLoc(val); setSelectedReg(''); setSelectedHosp(''); setSelectedDept(null);
  }

  const handleRegChange = (val: string) => {
    setSelectedReg(val); setSelectedHosp(''); setSelectedDept(null);
  }

  const handleHospChange = (val: string) => {
    setSelectedHosp(val); setSelectedDept(null);
  }

  return (
    <div className="w-full px-4 py-8 sm:px-10 font-arabic" dir="rtl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-blue-900 tracking-tight flex items-center justify-center gap-3">
           نظام الاستعلام المتطور - AidMap
        </h1>
        <p className="text-blue-600 font-medium mt-2">تتبع الخدمات الطبية والقدرة التشغيلية في غزة</p>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden mb-10">
        <CardContent className="p-8 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. الموقع */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-500" /> الموقع
              </label>
              <select 
                className="w-full h-12 border-2 border-white shadow-sm rounded-2xl px-4 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={selectedLoc}
                onChange={(e) => handleLocChange(e.target.value)}
              >
                <option value="">اختر الموقع</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* 2. المنطقة */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" /> المنطقة
              </label>
              <select 
                className="w-full h-12 border-2 border-white shadow-sm rounded-2xl px-4 bg-white disabled:opacity-50"
                disabled={!selectedLoc}
                value={selectedReg}
                onChange={(e) => handleRegChange(e.target.value)}
              >
                <option value="">اختر المنطقة</option>
                {selectedLoc && REGIONS[selectedLoc]?.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* 3. المستشفى */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" /> المستشفى
              </label>
              <select 
                className="w-full h-12 border-2 border-white shadow-sm rounded-2xl px-4 bg-white disabled:opacity-50"
                disabled={!selectedReg}
                value={selectedHosp}
                onChange={(e) => handleHospChange(e.target.value)}
              >
                <option value="">اختر المستشفى</option>
                {selectedReg && HOSPITALS[selectedReg]?.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            {/* 4. القسم */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-500" /> القسم
              </label>
              <select 
                className="w-full h-12 border-2 border-white shadow-sm rounded-2xl px-4 bg-white disabled:opacity-50"
                disabled={!selectedHosp}
                onChange={(e) => {
                    const deptObj = DEPARTMENTS[selectedHosp]?.find(d => d.name === e.target.value);
                    setSelectedDept(deptObj);
                }}
              >
                <option value="">اختر القسم</option>
                {selectedHosp && DEPARTMENTS[selectedHosp]?.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* عرض النتائج النهائية */}
      {selectedDept && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* كرت الخدمات */}
          <Card className="border-none shadow-lg bg-white rounded-3xl p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2 border-b pb-3">
              <Activity className="text-blue-500" /> الخدمات المتاحة حالياً
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedDept.services.map((s: string) => (
                <div key={s} className="bg-blue-50 text-blue-700 p-3 rounded-xl text-center font-bold border border-blue-100">
                  {s}
                </div>
              ))}
            </div>
          </Card>

          {/* كرت الأطباء */}
          <Card className="border-none shadow-lg bg-white rounded-3xl p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2 border-b pb-3">
              <Users className="text-emerald-500" /> الكادر الطبي المناوب
            </h3>
            <div className="space-y-3">
              {selectedDept.doctors.map((d: string) => (
                <div key={d} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">{d}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">متوفر</span>
                </div>
              ))}
            </div>
          </Card>

        </div>
      )}

      {!selectedDept && selectedHosp && (
          <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed">
              يرجى تحديد القسم من القائمة أعلاه لعرض التفاصيل الطبية
          </div>
      )}
    </div>
  )
}