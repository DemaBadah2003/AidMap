'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  GraduationCap, 
  Wifi, 
  BookOpen, 
  Users, 
  MapPin,
  BrainCircuit,
  Clock
} from 'lucide-react'

// مصفوفة الخدمات بناءً على تصنيفاتك (الصورة المرفقة)
const educationServices = [
  {
    id: 1,
    title: "مراكز الدعم النفسي",
    icon: <BrainCircuit className="w-8 h-8 text-purple-500" />,
    status: "متاح الآن",
    team: "طاقم متخصص",
    color: "purple"
  },
  {
    id: 2,
    title: "نقاط الإنترنت للدراسة",
    icon: <Wifi className="w-8 h-8 text-blue-500" />,
    status: "متصل الآن",
    team: "سرعة مستقرة",
    color: "blue"
  },
  {
    id: 3,
    title: "خيام التعليم (المدارس)",
    icon: <BookOpen className="w-8 h-8 text-green-500" />,
    status: "مفتوح",
    team: "طاقم تعليمي",
    color: "green"
  },
  {
    id: 4,
    title: "قضايا الطلاب والتعليم",
    icon: <Users className="w-8 h-8 text-orange-500" />,
    status: "استقبال الطلبات",
    team: "لجنة استشارية",
    color: "orange"
  }
]

export default function EducationSearchPage() {
  return (
    <div className="w-full min-h-screen bg-slate-50/50 p-6 font-arabic" dir="rtl">
      
      {/* العنوان الرئيسي مع الأيقونة */}
      <div className="flex flex-col items-center justify-center mb-10 gap-2">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-10 h-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-800">البحث الذكي عن الخدمات التعليمية</h1>
        </div>
        <p className="text-slate-500">ابحث عن أقرب نقطة تعليمية أو مركز دعم لطلابنا</p>
      </div>

      {/* قسم الفلاتر - نفس تصميم الصورة السابقة */}
      <Card className="max-w-5xl mx-auto mb-8 shadow-md border-none rounded-2xl overflow-hidden">
        <CardContent className="p-6 flex flex-wrap md:flex-nowrap items-end gap-4 bg-white">
          <div className="w-full md:w-1/4 space-y-2">
            <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <MapPin size={14} /> المنطقة
            </label>
            <select className="w-full h-11 bg-slate-50 border-none rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option>شمال غزة</option>
              <option>غزة</option>
              <option>الوسطى</option>
              <option>جنوب غزة</option>
            </select>
          </div>

          <div className="w-full md:w-1/4 space-y-2">
            <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
               المنشأة التعليمية
            </label>
            <select className="w-full h-11 bg-slate-50 border-none rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option>مركز إيواء النصر</option>
              <option>نقطة إنترنت الرمال</option>
              <option>خيمة تعليم التفاح</option>
            </select>
          </div>

          <div className="w-full md:flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-400">ابحث عن خدمة أو تخصص (اختياري)</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input 
                placeholder="مثلاً: دروس رياضيات، دعم نفسي للأطفال..." 
                className="pr-10 h-11 bg-slate-50 border-none rounded-xl text-right"
              />
            </div>
          </div>

          <Button className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2">
            <Search size={18} /> بحث
          </Button>
        </CardContent>
      </Card>

      {/* شريط النتائج المستهدف */}
      <div className="max-w-5xl mx-auto mb-6 bg-green-50/50 border border-green-100 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500 rounded-lg text-white">
            <GraduationCap size={20} />
          </div>
          <div>
            <h3 className="font-bold text-green-800 text-sm">نتائج البحث في مركز إيواء النصر التعليمي</h3>
            <p className="text-[10px] text-green-600">تم تحديث البيانات والخدمات المتاحة الآن</p>
          </div>
        </div>
        <div className="flex gap-4 text-xs font-bold text-green-700">
          <span className="flex items-center gap-1">نوع المنشأة: خيمة تعليمية</span>
          <span className="flex items-center gap-1">الجهة: وكالة (UNRWA)</span>
        </div>
      </div>

      {/* شبكة الخدمات - البطاقات الذكية */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {educationServices.map((service) => (
          <Card key={service.id} className="group hover:shadow-xl transition-all border-none rounded-3xl overflow-hidden cursor-pointer">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800">{service.title}</h3>
              
              <div className="flex items-center justify-between w-full mt-4 border-t pt-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-green-600">{service.status}</span>
                </div>
                <div className="flex items-center gap-1">
                   <Clock size={12} className="text-slate-400" />
                   <span className="text-xs text-slate-400">{service.team}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}