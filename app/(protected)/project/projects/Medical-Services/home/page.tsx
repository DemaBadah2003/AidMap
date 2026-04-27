'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
 Building2, Stethoscope, Users, Activity, 
 MapPin, Search, HeartPulse, User, AlertCircle,
 CircleDollarSign, Landmark
} from 'lucide-react'

// 1. قاعدة البيانات المحدثة بالكامل
const HOSPITALS_BY_REGION: Record<string, {name: string, type: string, cost: string}[]> = {
 'غرب': [
   { name: 'مجمع الشفاء الطبي', type: 'حكومي', cost: 'مجاني' },
   { name: 'مستشفى النصر', type: 'حكومي', cost: 'مجاني' },
   { name: 'مستشفى عبد العزيز الرنتيسي', type: 'حكومي', cost: 'مجاني' },
   { name: 'مستشفى العيون', type: 'حكومي', cost: 'مجاني' },
   { name: 'مستشفى الأمراض النفسية', type: 'حكومي', cost: 'مجاني' },
   { name: 'مركز الرمال الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مركز السويدي الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مركز الشاطئ الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مستشفى القدس', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى أصدقاء المريض', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى الخدمة العامة', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى سانت جون للعيون', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى العودة', type: 'خاص', cost: 'مدفوع' },
 ],
 'شرق': [
   { name: 'مستشفى الشهيد محمد الدرة للأطفال', type: 'حكومي', cost: 'مجاني' },
   { name: 'مستشفى الوفاء للتأهيل الطبي', type: 'حكومي', cost: 'مجاني' },
   { name: 'مركز الشجاعية الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مركز الزيتون الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مستشفى حيفا الطبي', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى الكرامة التخصصي', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى الخدمة العامة (فرع الشرق)', type: 'خاص', cost: 'مدفوع' },
 ],
 'شمال': [
   { name: 'مستشفى الإندونيسي', type: 'حكومي', cost: 'مجاني' },
   { name: 'مستشفى كمال عدوان', type: 'حكومي', cost: 'مجاني' },
   { name: 'مستشفى بيت حانون', type: 'حكومي', cost: 'مجاني' },
   { name: 'مركز جباليا الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مركز الصفطاوي الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مركز بيت حانون الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مستشفى العودة (شمال)', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى اليمني السعيد', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى الشهيد باسل الهيبي', type: 'خاص', cost: 'مدفوع' },
 ],
 'وسطى': [
   { name: 'مستشفى شهداء الأقصى', type: 'حكومي', cost: 'مجاني' },
   { name: 'مستشفى يافا الحكومي', type: 'حكومي', cost: 'مجاني' },
   { name: 'مركز النصيرات الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مركز البريج الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مركز المغازي الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مركز دير البلح الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مستشفى العودة (وسطى)', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى يافا الطبي', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى وفاء للتأهيل الطبي', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى المركز العربي الطبي', type: 'خاص', cost: 'مدفوع' },
 ],
 'جنوب': [
   { name: 'مجمع ناصر الطبي', type: 'حكومي', cost: 'مجاني' },
   { name: 'مستشفى غزة الأوروبي', type: 'حكومي', cost: 'مجاني' },
   { name: 'مستشفى الشهيد محمد يوسف النجار', type: 'حكومي', cost: 'مجاني' },
   { name: 'مركز خان يونس الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مركز تل السلطان الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مركز الشابورة الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مركز بني سهيلا الصحي', type: 'وكالة', cost: 'مجاني' },
   { name: 'مستشفى الأمل', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى دار السلام', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى الهلال الإماراتي', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى الكويتي', type: 'خاص', cost: 'مدفوع' },
   { name: 'مستشفى يافا (جنوب)', type: 'خاص', cost: 'مدفوع' },
 ]
}

const DOCTORS_DATA = [
 { name: 'د. محمد الأغا', specialty: 'جراحة عامة', hospital: 'مستشفى غزة الأوروبي' },
 { name: 'د. سارة خليل', specialty: 'طب أطفال', hospital: 'مجمع الشفاء الطبي' },
 { name: 'د. أحمد ياسين', specialty: 'عناية مركزة', hospital: 'مستشفى القدس' },
]

const DEPARTMENTS = [
 { name: 'الاستقبال والطوارئ', icon: Activity },
 { name: 'العناية المركزة (ICU)', icon: HeartPulse },
 { name: 'الجراحة العامة', icon: Stethoscope },
 { name: 'طب الأطفال', icon: Users },
 { name: 'النسائية والتوليد', icon: Building2 },
]

export default function AidMapSystem() {
 const [selectedLoc, setSelectedLoc] = useState('غرب')
 const [selectedHosp, setSelectedHosp] = useState('')
 const [doctorSearch, setDoctorSearch] = useState('')
 const [showResults, setShowResults] = useState(false)
 const [foundDoctors, setFoundDoctors] = useState<any[]>([])
 const [hasSearched, setHasSearched] = useState(false)

 const currentHospData = HOSPITALS_BY_REGION[selectedLoc]?.find(h => h.name === selectedHosp)

 useEffect(() => {
   const list = HOSPITALS_BY_REGION[selectedLoc]
   if (list) setSelectedHosp(list[0].name)
 }, [selectedLoc])

 const handleSearch = () => {
   setHasSearched(true)
   if (doctorSearch.trim() !== '') {
     const results = DOCTORS_DATA.filter(doc => 
       doc.name.includes(doctorSearch) || doc.specialty.includes(doctorSearch)
     )
     setFoundDoctors(results)
   } else {
     setFoundDoctors([])
   }
   setShowResults(true)
 }

 return (
   <div className="w-full bg-[#f8fafc] font-arabic antialiased h-screen overflow-y-auto scroll-smooth pb-20" dir="rtl">
     <div className="max-w-7xl mx-auto px-4 md:px-8">
       
       <div className="text-right pt-12 mb-10 space-y-6">
         <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg"><Activity className="w-8 h-8" /></div>
            <h1 className="text-[#1e3a8a] text-3xl md:text-4xl font-black italic"> البحث الذكي</h1>
         </div>
       </div>

       <Card className="border-none shadow-md rounded-[32px] bg-white mb-8 overflow-visible">
         <CardContent className="p-8 space-y-8 text-right">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                 <MapPin className="w-4 h-4 text-blue-500" /> المنطقة
               </label>
               <select className="w-full h-14 bg-[#f8fafc] border border-slate-100 rounded-2xl px-5 text-right outline-none focus:border-blue-300 transition-all cursor-pointer" 
                 value={selectedLoc} onChange={(e) => setSelectedLoc(e.target.value)}>
                 {Object.keys(HOSPITALS_BY_REGION).map(l => <option key={l} value={l}>{l}</option>)}
               </select>
             </div>

             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                 <Building2 className="w-4 h-4 text-blue-500" /> المنشأة
               </label>
               <select className="w-full h-14 bg-[#f8fafc] border border-slate-100 rounded-2xl px-5 text-right outline-none focus:border-blue-300 transition-all cursor-pointer" 
                 value={selectedHosp} onChange={(e) => setSelectedHosp(e.target.value)}>
                 {HOSPITALS_BY_REGION[selectedLoc]?.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
               </select>
             </div>

             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                 <User className="w-4 h-4 text-blue-500" /> ابحث عن طبيب (اختياري)
               </label>
               <input 
                 type="text" 
                 placeholder="اكتب اسم الطبيب أو التخصص..." 
                 className="w-full h-14 bg-[#f8fafc] border border-slate-100 rounded-2xl px-5 text-right outline-none focus:ring-2 focus:ring-blue-100 text-slate-800 font-medium placeholder:text-slate-400"
                 value={doctorSearch}
                 onChange={(e) => setDoctorSearch(e.target.value)}
               />
             </div>
           </div>

           <div className="flex justify-start">
             <button onClick={handleSearch} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 group">
               <Search className="w-5 h-5 group-hover:scale-110 transition-transform" /> تنفيذ البحث عن النتائج
             </button>
           </div>
         </CardContent>
       </Card>

       {showResults && (
         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           <div className="flex flex-col md:flex-row items-center justify-between bg-[#f0fdf4] p-6 rounded-[32px] border border-emerald-100 shadow-sm mb-8">
             <div className="flex flex-col text-right order-2 md:order-1">
               <h2 className="text-[#065f46] font-black text-xl md:text-2xl">
                 نتائج البحث في {selectedHosp}
               </h2>
               <p className="text-emerald-600 text-sm font-medium mt-1">
                 تم تحديث البيانات الآن بناءً على طلبك
               </p>
             </div>

             <div className="flex items-center gap-6 order-1 md:order-2 mb-4 md:mb-0">
               <div className="flex gap-4 text-emerald-700 bg-white/50 px-4 py-2 rounded-2xl border border-emerald-100">
                 <div className="flex items-center gap-2">
                   <CircleDollarSign className="w-4 h-4 text-emerald-600" />
                   <span className="text-sm font-bold">التكلفة: <span className="text-emerald-500">{currentHospData?.cost}</span></span>
                 </div>
                 <div className="w-[1px] bg-emerald-200"></div>
                 <div className="flex items-center gap-2">
                   <Landmark className="w-4 h-4 text-emerald-600" />
                   <span className="text-sm font-bold">النوع: <span className="text-emerald-500">{currentHospData?.type}</span></span>
                 </div>
               </div>
               <div className="bg-[#10b981] p-3 rounded-2xl text-white shadow-lg">
                 <Activity className="w-6 h-6 animate-pulse" />
               </div>
             </div>
           </div>

           {hasSearched && doctorSearch.trim() !== '' && (
             <div className="mb-10">
               <h3 className="text-[#1e3a8a] font-bold text-xl mb-4 text-right pr-2">نتائج البحث عن الأطباء:</h3>
               {foundDoctors.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {foundDoctors.map((doc, i) => (
                     <Card key={i} className="border-none shadow-sm rounded-2xl bg-blue-50/50 p-4 flex items-center gap-4 hover:bg-blue-100/50 transition-colors cursor-default">
                       <div className="bg-blue-600 p-3 rounded-full text-white"><User className="w-6 h-6" /></div>
                       <div className="text-right">
                         <p className="font-bold text-blue-900 text-lg">{doc.name}</p>
                         <p className="text-blue-600 text-sm">{doc.specialty} - {doc.hospital}</p>
                       </div>
                     </Card>
                   ))}
                 </div>
               ) : (
                 <Card className="border-none shadow-sm rounded-2xl bg-amber-50 p-6 flex items-center gap-4 border border-amber-100">
                   <AlertCircle className="w-6 h-6 text-amber-600" />
                   <p className="text-amber-800 font-medium text-sm">عذراً، لم يتم العثور على أطباء بهذا الاسم أو التخصص.</p>
                 </Card>
               )}
             </div>
           )}

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {DEPARTMENTS.map((dept, index) => (
               <Card key={index} className="border-none shadow-sm rounded-[32px] bg-white p-8 hover:shadow-xl hover:-translate-y-1 transition-all border border-slate-50 group cursor-pointer">
                 <div className="flex flex-col items-center space-y-6">
                   <div className="w-16 h-16 bg-blue-50 rounded-[22px] flex items-center justify-center text-[#3b82f6] group-hover:bg-[#3b82f6] group-hover:text-white transition-colors">
                     <dept.icon className="w-8 h-8" />
                   </div>
                   <h3 className="font-bold text-slate-700 text-2xl group-hover:text-blue-600 transition-colors">{dept.name}</h3>
                   <div className="w-full flex justify-between items-center pt-5 border-t border-slate-50">
                     <span className="text-xs text-emerald-500 font-bold flex items-center gap-1.5">
                       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> متاح الآن
                     </span>
                     <span className="text-xs text-slate-400 font-medium">طاقم كامل</span>
                   </div>
                 </div>
               </Card>
             ))}
           </div>
         </div>
       )}
     </div>
   </div>
 )
}