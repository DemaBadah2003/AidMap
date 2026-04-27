'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Stethoscope, Users, Activity, MapPin, Compass, ShieldCheck, LayoutGrid } from 'lucide-react'

// --- البيانات الأساسية ---
const LOCATIONS = ['شمال', 'جنوب', 'شرق', 'غرب', 'وسطى']
const ORG_TYPES = ['حكومي', 'وكالة', 'خاص']

const HOSPITALS_DATA: Record<string, Record<string, string[]>> = {
  'غرب': {
    'حكومي': ['مجمع الشفاء الطبي', 'مستشفى النصر', 'مستشفى عبد العزيز الرنتيسي', 'مستشفى العيون', 'مستشفى الأمراض النفسية'],
    'وكالة': ['مركز الرمال الصحي', 'مركز السويدي الصحي', 'مركز الشاطئ الصحي'],
    'خاص': ['مستشفى القدس', 'مستشفى أصدقاء المريض', 'مستشفى الخدمة العامة', 'مستشفى سانت جو للعيون', 'مستشفى العودة']
  },
  'شرق': {
    'حكومي': ['مستشفى الشهيد محمد الدرة للأطفال', 'مستشفى الوفاء للتأهيل الطبي والجراحة التخصصية'],
    'وكالة': ['مركز الشجاعية الصحي', 'مركز الزيتون الصحي'],
    'خاص': ['مستشفى حيفا الطبي', 'مستشفى الكرامة التخصصي', 'مستشفى الخدمة العامة']
  },
  'شمال': {
    'حكومي': ['مستشفى الإندونيسي', 'مستشفى كمال عدوان', 'مستشفى بيت حانون'],
    'وكالة': ['مركز جباليا الصحي', 'مركز الصفطاوي الصحي', 'مركز بيت حانون الصحي'],
    'خاص': ['مستشفى العودة', 'مستشفى اليمني السعيد', 'مستشفى الشهيد باسل الهيبي']
  },
  'وسطى': {
    'حكومي': ['مستشفى شهداء الأقصى', 'مستشفى يافا الحكومي'],
    'وكالة': ['مركز النصيرات الصحي', 'مركز البريج الصحي', 'مركز المغازي الصحي', 'مركز دير البلح الصحي'],
    'خاص': ['مستشفى العودة', 'مستشفى يافا الطبي', 'مستشفى وفاء للتأهيل الطبي', 'مستشفى المركز العربي الطبي']
  },
  'جنوب': {
    'حكومي': ['مجمع ناصر الطبي', 'مستشفى غزة الأوروبي', 'مستشفى الشهيد محمد يوسف النجار'],
    'وكالة': ['مركز خان يونس الصحي', 'مركز تل السلطان الصحي', 'مركز الشابورة الصحي', 'مركز بني سهيلا الصحي'],
    'خاص': ['مستشفى الأمل', 'مستشفى دار السلام', 'مستشفى الهلال الإماراتي', 'مستشفى الكويتي', 'مستشفى يافا']
  }
}

// بيانات التخصصات والأقسام التي زودتني بها
const SPECIALTIES_DATA: Record<string, string[]> = {
  'الاستقبال والطوارئ': ['طوارئ كبار', 'طوارئ أطفال', 'وحدة الحوادث'],
  'الجراحة العامة': ['غرفة العمليات الكبرى', 'جراحة المناظير'],
  'العناية المركزة والتخدير': ['العناية المركزة (ICU)', 'عناية القلب (CCU)'],
  'طب الأطفال': ['قسم الأطفال العام', 'الحضانة'],
  'النسائية والتوليد': ['غرف الولادة', 'العمليات القيصرية'],
}

export default function AdvancedReliefSystem() {
  const [selectedLoc, setSelectedLoc] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedHosp, setSelectedHosp] = useState('')
  const [selectedSpec, setSelectedSpec] = useState('')
  const [selectedDept, setSelectedDept] = useState('')

  // دوال التغيير لضمان تصفير الخيارات اللاحقة عند تغيير الخيار الأب
  const handleLocChange = (val: string) => {
    setSelectedLoc(val); setSelectedType(''); setSelectedHosp(''); setSelectedSpec(''); setSelectedDept('');
  }
  const handleTypeChange = (val: string) => {
    setSelectedType(val); setSelectedHosp(''); setSelectedSpec(''); setSelectedDept('');
  }
  const handleHospChange = (val: string) => {
    setSelectedHosp(val); setSelectedSpec(''); setSelectedDept('');
  }
  const handleSpecChange = (val: string) => {
    setSelectedSpec(val); setSelectedDept('');
  }

  return (
    <div className="w-full px-4 py-8 sm:px-10 font-arabic" dir="rtl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-blue-900 tracking-tight flex items-center justify-center gap-3">
           نظام الاستعلام الطبي المتطور - AidMap
        </h1>
        <p className="text-blue-600 font-medium mt-2">تتبع القدرة التشغيلية للمستشفيات والأقسام</p>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden mb-10">
        <CardContent className="p-8 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            
            {/* 1. الموقع */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <Compass className="w-3 h-3" /> الموقع
              </label>
              <select 
                className="w-full h-11 border border-slate-200 rounded-xl px-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                value={selectedLoc}
                onChange={(e) => handleLocChange(e.target.value)}
              >
                <option value="">اختر الموقع</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* 2. نوع المستشفى */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> نوع المستشفى
              </label>
              <select 
                className="w-full h-11 border border-slate-200 rounded-xl px-3 bg-white disabled:opacity-50 text-sm"
                disabled={!selectedLoc}
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <option value="">اختر النوع</option>
                {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* 3. اسم المستشفى */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <Building2 className="w-3 h-3" /> اسم المستشفى
              </label>
              <select 
                className="w-full h-11 border border-slate-200 rounded-xl px-3 bg-white disabled:opacity-50 text-sm"
                disabled={!selectedType}
                value={selectedHosp}
                onChange={(e) => handleHospChange(e.target.value)}
              >
                <option value="">اختر المستشفى</option>
                {selectedLoc && selectedType && HOSPITALS_DATA[selectedLoc][selectedType]?.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* 4. نوع التخصص */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <Stethoscope className="w-3 h-3" /> نوع التخصص
              </label>
              <select 
                className="w-full h-11 border border-slate-200 rounded-xl px-3 bg-white disabled:opacity-50 text-sm"
                disabled={!selectedHosp}
                value={selectedSpec}
                onChange={(e) => handleSpecChange(e.target.value)}
              >
                <option value="">اختر التخصص</option>
                {Object.keys(SPECIALTIES_DATA).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* 5. اسم القسم */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <LayoutGrid className="w-3 h-3" /> اسم القسم
              </label>
              <select 
                className="w-full h-11 border border-slate-200 rounded-xl px-3 bg-white disabled:opacity-50 text-sm"
                disabled={!selectedSpec}
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">اختر القسم</option>
                {selectedSpec && SPECIALTIES_DATA[selectedSpec].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* عرض تفاصيل القسم المختار */}
      {selectedDept ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
          <Card className="border-none shadow-lg bg-white rounded-3xl p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2 border-b pb-3">
              <Activity className="text-blue-500" /> حالة القسم: {selectedDept}
            </h3>
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-bold text-center">
                القسم يعمل بكفاءة - الخدمات متاحة حالياً
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="text-xs bg-slate-100 p-2 rounded-lg text-slate-600">آخر تحديث: قبل ١٠ دقائق</div>
                <div className="text-xs bg-slate-100 p-2 rounded-lg text-slate-600">عدد الأسرّة المتاحة: ٤</div>
            </div>
          </Card>

          <Card className="border-none shadow-lg bg-white rounded-3xl p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2 border-b pb-3">
              <Users className="text-blue-500" /> الطاقم في {selectedHosp}
            </h3>
            <div className="space-y-3">
               <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="font-bold">طبيب مناوب</span>
                  <span className="text-sm text-blue-600 font-medium italic">متواجد</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="font-bold">طاقم تمريض</span>
                  <span className="text-sm text-blue-600 font-medium italic">متواجد</span>
               </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
           يرجى استكمال تحديد البيانات أعلاه لعرض التفاصيل التشغيلية للقسم
        </div>
      )}
    </div>
  )
}