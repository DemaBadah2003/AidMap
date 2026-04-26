'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Stethoscope, Users, Activity, MapPin, Compass, Briefcase } from 'lucide-react'

// كائن الترجمة لتحويل قيم الـ Enum من قاعدة البيانات إلى اللغة العربية
const translate: Record<string, string> = {
  // المناطق
  NORTH: 'شمال',
  SOUTH: 'جنوب',
  EAST: 'شرق',
  WEST: 'غرب',
  CENTRAL: 'وسط',
  // أنواع المنشآت
  GOVERNMENT: 'حكومي',
  PRIVATE: 'خاص',
  UNRWA: 'وكالة'
};

export default function AdvancedReliefSystem() {
  // حالات الاختيار (Selection States)
  const [selectedLoc, setSelectedLoc] = useState('')
  const [selectedOrgType, setSelectedOrgType] = useState('')
  const [selectedHosp, setSelectedHosp] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('') 
  const [selectedDept, setSelectedDept] = useState<any>(null)

  // حالات البيانات (Data States)
  const [locations, setLocations] = useState<string[]>([])
  const [orgTypes, setOrgTypes] = useState<string[]>([])
  const [hospitals, setHospitals] = useState<any[]>([])
  const [allDepartments, setAllDepartments] = useState<any[]>([])

  // 1. جلب المناطق وأنواع المنشآت عند تحميل الصفحة أول مرة
  useEffect(() => {
    fetch('/api/relief?type=locations').then(res => res.json()).then(setLocations)
    fetch('/api/relief?type=orgTypes').then(res => res.json()).then(setOrgTypes)
  }, [])

  // 2. جلب المستشفيات بناءً على اختيار "المنطقة" و "النوع"
  useEffect(() => {
    if (selectedLoc && selectedOrgType) {
      fetch(`/api/relief?type=hospitals&region=${selectedLoc}&orgType=${selectedOrgType}`)
        .then(res => res.json())
        .then(data => {
          setHospitals(data)
          // تصفير الاختيارات اللاحقة عند تغيير الفلاتر الأساسية
          setSelectedHosp('')
          setAllDepartments([])
          setSelectedSpecialty('')
          setSelectedDept(null)
        })
    } else {
      setHospitals([]);
    }
  }, [selectedLoc, selectedOrgType])

  // 3. جلب الأقسام والخدمات عند اختيار مستشفى معين
  const handleHospChange = async (hospId: string) => {
    setSelectedHosp(hospId);
    setSelectedSpecialty('');
    setSelectedDept(null);
    if (!hospId) return;

    const res = await fetch(`/api/relief?type=details&hospitalId=${hospId}`);
    const data = await res.json();
    setAllDepartments(data); 
  }

  // استخراج التخصصات (deptType) الفريدة من الأقسام المجلوبة
  const specialties = useMemo(() => {
    const types = allDepartments.map(d => d.deptType); 
    return Array.from(new Set(types.filter(Boolean)));
  }, [allDepartments]);

  // فلترة الأقسام بناءً على التخصص المختار
  const filteredDepts = useMemo(() => {
    return allDepartments.filter(d => d.deptType === selectedSpecialty);
  }, [selectedSpecialty, allDepartments]);

  return (
    <div className="w-full px-4 py-8 sm:px-10 font-arabic" dir="rtl">
      {/* الرأس */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-blue-900 flex items-center justify-center gap-3">
          نظام استعلام AidMap المتكامل
        </h1>
        <p className="text-blue-600 font-medium mt-2">بيانات دقيقة مستخرجة من قاعدة بيانات المستشفيات</p>
      </div>

      {/* لوحة التحكم والاختيار */}
      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden mb-10">
        <CardContent className="p-8 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            
            {/* 1. المنطقة (شمال، جنوب...) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Compass className="w-3 h-3 text-blue-500" /> المنطقة
              </label>
              <select 
                className="w-full h-11 border shadow-sm rounded-xl px-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                value={selectedLoc} 
                onChange={(e) => setSelectedLoc(e.target.value)}
              >
                <option value="">اختر المنطقة..</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{translate[loc] || loc}</option>
                ))}
              </select>
            </div>

            {/* 2. نوع المنشأة (حكومي، وكالة...) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-500" /> نوع المنشأة
              </label>
              <select 
                className="w-full h-11 border shadow-sm rounded-xl px-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                value={selectedOrgType} 
                onChange={(e) => setSelectedOrgType(e.target.value)}
              >
                <option value="">اختر النوع..</option>
                {orgTypes.map((type) => (
                  <option key={type} value={type}>{translate[type] || type}</option>
                ))}
              </select>
            </div>

            {/* 3. اسم المستشفى */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-500" /> اسم المستشفى
              </label>
              <select 
                className="w-full h-11 border shadow-sm rounded-xl px-3 bg-white disabled:opacity-50" 
                disabled={!hospitals.length} 
                value={selectedHosp} 
                onChange={(e) => handleHospChange(e.target.value)}
              >
                <option value="">اختر المستشفى..</option>
                {hospitals.map((h: any) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            {/* 4. نوع التخصص (يظهر بعد اختيار المستشفى) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-blue-500" /> نوع التخصص
              </label>
              <select 
                className="w-full h-11 border shadow-sm rounded-xl px-3 bg-white disabled:opacity-50" 
                disabled={!specialties.length} 
                value={selectedSpecialty} 
                onChange={(e) => { setSelectedSpecialty(e.target.value); setSelectedDept(null); }}
              >
                <option value="">اختر التخصص..</option>
                {specialties.map((s: any) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* 5. اسم القسم (يظهر بعد اختيار التخصص) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-blue-500" /> اسم القسم
              </label>
              <select 
                className="w-full h-11 border shadow-sm rounded-xl px-3 bg-white disabled:opacity-50" 
                disabled={!filteredDepts.length} 
                onChange={(e) => {
                  const dept = filteredDepts.find(d => d.id === e.target.value);
                  setSelectedDept(dept);
                }}
              >
                <option value="">اختر القسم..</option>
                {filteredDepts.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* عرض البيانات التفصيلية للقسم المختار */}
      {selectedDept && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* كرت الخدمات */}
          <Card className="border-none shadow-lg bg-white rounded-3xl p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2 border-b pb-3">
              <Activity className="text-blue-500" /> الخدمات في {selectedDept.name}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedDept.services?.length > 0 ? (
                selectedDept.services.map((s: any) => (
                  <div key={s.id} className="bg-blue-50 text-blue-700 p-3 rounded-xl text-center font-bold border border-blue-100 hover:bg-blue-100 transition-colors">
                    {s.name}
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-center text-slate-400 py-4">لا توجد خدمات متاحة حالياً</p>
              )}
            </div>
          </Card>

          {/* كرت الكادر الطبي */}
          <Card className="border-none shadow-lg bg-white rounded-3xl p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2 border-b pb-3">
              <Users className="text-emerald-500" /> الكادر الطبي المناوب
            </h3>
            <div className="space-y-3">
              {selectedDept.doctors?.length > 0 ? (
                selectedDept.doctors.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-sm transition-all">
                    <span className="font-bold text-slate-700">{d.name}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">متوفر</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-4">لا يوجد أطباء مسجلين في هذا القسم</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}