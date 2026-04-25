'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Stethoscope, Users, Activity, MapPin, Compass, Loader2, Hospital } from 'lucide-react'

// 1. تعريف قاعدة البيانات الثابتة بناءً على طلبك
const HOSPITAL_DATABASE: Record<string, Record<string, string[]>> = {
  "غرب": {
    "حكومي": ["مجمع الشفاء الطبي", "مستشفى النصر", "مستشفى عبد العزيز الرنتيسي", "مستشفى العيون", "مستشفى الأمراض النفسية"],
    "وكالة": ["مركز الرمال الصحي", "مركز السويدي الصحي", "مركز الشاطئ الصحي"],
    "خاص": ["مستشفى القدس", "مستشفى أصدقاء المريض", "مستشفى الخدمة العامة", "مستشفى سانت جون للعيون", "مستشفى العودة"]
  },
  "شرق": {
    "حكومي": ["مستشفى الشهيد محمد الدرة للأطفال", "مستشفى الوفاء للتأهيل الطبي والجراحة التخصصية"],
    "خاص": ["مستشفى حيفا الطبي", "مستشفى الكرامة التخصصي", "مستشفى الخدمة العامة"],
    "وكالة": ["مركز الشجاعية الصحي", "مركز الزيتون الصحي"]
  },
  "شمال": {
    "حكومي": ["مستشفى الإندونيسي", "مستشفى كمال عدوان", "مستشفى بيت حانون"],
    "خاص": ["مستشفى العودة", "مستشفى اليمني السعيد", "مستشفى الشهيد باسل الهيبي"],
    "وكالة": ["مركز جباليا الصحي", "مركز الصفطاوي الصحي", "مركز بيت حانون الصحي"]
  },
  "وسطى": {
    "حكومي": ["مستشفى شهداء الأقصى", "مستشفى يافا الحكومي"],
    "خاص": ["مستشفى العودة", "مستشفى يافا الطبي", "مستشفى وفاء للتأهيل الطبي", "مستشفى المركز العربي الطبي"],
    "وكالة": ["مركز النصيرات الصحي", "مركز البريج الصحي", "مركز المغازي الصحي", "مركز دير البلح الصحي"]
  },
  "جنوب": {
    "حكومي": ["مجمع ناصر الطبي", "مستشفى غزة الأوروبي", "مستشفى الشهيد محمد يوسف النجار"],
    "خاص": ["مستشفى الأمل", "مستشفى دار السلام", "مستشفى الهلال الإماراتي", "مستشفى الكويتي", "مستشفى يافا"],
    "وكالة": ["مركز خان يونس الصحي", "مركز تل السلطان الصحي", "مركز الشابورة الصحي", "مركز بني سهيلا الصحي"]
  }
};

export default function AdvancedReliefSystem() {
  const [selectedLoc, setSelectedLoc] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedHosp, setSelectedHosp] = useState('')
  const [selectedDeptId, setSelectedDeptId] = useState('')
  
  const [dbDepartments, setDbDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const API_BASE = '/api/project/Medical-Services/home';

  // استخراج المواقع المتاحة من قاعدة البيانات
  const availableLocations = Object.keys(HOSPITAL_DATABASE);

  // استخراج الأنواع المتاحة بناءً على الموقع المختار
  const availableTypes = useMemo(() => {
    return selectedLoc ? Object.keys(HOSPITAL_DATABASE[selectedLoc] || {}) : [];
  }, [selectedLoc]);

  // استخراج أسماء المستشفيات بناءً على الموقع والنوع
  const availableHospitals = useMemo(() => {
    return (selectedLoc && selectedType) ? HOSPITAL_DATABASE[selectedLoc][selectedType] || [] : [];
  }, [selectedLoc, selectedType]);

  // جلب الأقسام من السيرفر عند اختيار المستشفى (بما أن الأقسام والخدمات متغيرة وديناميكية)
  useEffect(() => {
    if (selectedHosp) {
      setLoading(true)
      // ملاحظة: هنا نرسل اسم المستشفى للسيرفر لجلب أقسامه المسجلة في DB
      fetch(`${API_BASE}?type=details&hospitalName=${encodeURIComponent(selectedHosp)}`)
        .then(res => res.json())
        .then(data => {
          setDbDepartments(data.departments || [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setDbDepartments([]);
    }
  }, [selectedHosp])

  const selectedDeptData = dbDepartments.find(d => d.id === selectedDeptId);

  return (
    <div className="w-full px-4 py-8 sm:px-10 font-arabic" dir="rtl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-blue-900 tracking-tight">نظام استعلام AidMap المتكامل</h1>
        <p className="text-blue-600 font-medium mt-2">بيانات دقيقة بناءً على الموقع والنوع</p>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden mb-10">
        <CardContent className="p-8 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. اختيار الموقع */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Compass className="w-4 h-4 text-blue-500" /> الموقع</label>
              <select 
                className="w-full h-12 border-2 border-white shadow-sm rounded-2xl px-4 bg-white outline-none focus:border-blue-300"
                value={selectedLoc}
                onChange={(e) => { 
                  setSelectedLoc(e.target.value); 
                  setSelectedType(''); setSelectedHosp(''); setSelectedDeptId('');
                }}
              >
                <option value="">اختر المنطقة..</option>
                {availableLocations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* 2. اختيار النوع (حكومي/وكالة/خاص) بناءً على الموقع */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> نوع المنشأة</label>
              <select 
                className="w-full h-12 border-2 border-white shadow-sm rounded-2xl px-4 bg-white disabled:opacity-50"
                disabled={!selectedLoc}
                value={selectedType}
                onChange={(e) => { 
                  setSelectedType(e.target.value); 
                  setSelectedHosp(''); setSelectedDeptId('');
                }}
              >
                <option value="">اختر النوع..</option>
                {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* 3. اختيار اسم المستشفى بناءً على النوع والموقع */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Hospital className="w-4 h-4 text-blue-500" /> اسم المستشفى</label>
              <select 
                className="w-full h-12 border-2 border-white shadow-sm rounded-2xl px-4 bg-white disabled:opacity-50"
                disabled={!selectedType}
                value={selectedHosp}
                onChange={(e) => { 
                  setSelectedHosp(e.target.value); 
                  setSelectedDeptId('');
                }}
              >
                <option value="">اختر المستشفى..</option>
                {availableHospitals.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            {/* 4. اختيار القسم (يظهر بعد جلب البيانات من السيرفر) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-blue-500" /> القسم</label>
              <select 
                className="w-full h-12 border-2 border-white shadow-sm rounded-2xl px-4 bg-white disabled:opacity-50"
                disabled={!selectedHosp || loading}
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
              >
                <option value="">{loading ? 'جاري التحميل..' : 'اختر القسم..'}</option>
                {dbDepartments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* باقى الكود كما هو لعرض الخدمات والاطباء */}
      {loading && <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>}

      {!loading && selectedDeptData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-lg bg-white rounded-3xl p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4 border-b pb-3 flex items-center gap-2"><Activity className="text-blue-500" /> الخدمات المتوفرة</h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedDeptData.services?.map((s: any) => (
                <div key={s.id} className="bg-blue-50 text-blue-700 p-3 rounded-xl text-center font-bold border border-blue-100 text-sm">{s.name}</div>
              ))}
            </div>
          </Card>

          <Card className="border-none shadow-lg bg-white rounded-3xl p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4 border-b pb-3 flex items-center gap-2"><Users className="text-emerald-500" /> الطاقم الطبي</h3>
            <div className="space-y-3">
              {selectedDeptData.doctors?.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">{d.name}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">{d.specialty}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}