"use client";

import React, { useState } from 'react';
import { Home, MapPin, Search } from 'lucide-react';

const ShelterDashboard = () => {
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    setShowResults(true);
  };

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 p-6 custom-scrollbar" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* 1. العنوان الرئيسي */}
        <div className="mb-8 mt-4 flex justify-start items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-md">
            <Search className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-blue-900">
            البحث الذكي عن مراكز الإيواء
          </h1>
        </div>

        {/* 2. كارد البحث */}
        <div className="bg-white rounded-[25px] shadow-sm p-4 mb-10 border border-gray-100 w-full">
          <div className="flex flex-wrap md:flex-nowrap items-end gap-4">
            
            {/* حقل المنطقة */}
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="flex items-center gap-2 text-[12px] font-bold text-gray-400 mr-2">
                <MapPin size={14} className="text-blue-500" /> المنطقة المختارة
              </label>
              <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700">
                <option>الوسطى</option>
                <option>شمال غزة</option>
                <option>غزة</option>
                <option>خانيونس</option>
                <option>رفح</option>
              </select>
            </div>

            {/* حقل التصنيف */}
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="flex items-center gap-2 text-[12px] font-bold text-gray-400 mr-2">
                <Home size={14} className="text-blue-500" /> تصنيف مركز الإيواء
              </label>
              <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700">
                <option>مخيم نزوح</option>
                <option>مركز إيواء (مدرسة/مبنى)</option>
              </select>
            </div>

            {/* زر البحث */}
            <button 
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Search size={18} />
              <span className="text-sm font-bold">بحث</span>
            </button>
          </div>
        </div>

        {/* 3. النتائج */}
        {showResults && (
          <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            
            {/* شريط حالة الإشغال */}
            <div className="bg-[#f0fdf4] border border-green-100 rounded-2xl p-5 flex flex-wrap items-center justify-between px-10 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-green-500 p-2 rounded-full text-white">
                  <Home size={22} />
                </div>
                <div>
                  <h3 className="text-green-900 font-bold">حالة الإيواء في المنطقة المختارة</h3>
                  <p className="text-green-600 text-xs font-medium">تم تحديث البيانات اللحظية بناءً على تقارير المشرفين</p>
                </div>
              </div>
              <div className="flex gap-8">
                <span className="text-sm font-bold text-green-700">السعة المتاحة: <span className="bg-white px-3 py-1 rounded-lg ml-1 shadow-sm">120 فرد</span></span>
                <span className="text-sm font-bold text-green-700">الحالة العامة: <span className="bg-white px-3 py-1 rounded-lg ml-1 text-green-600 shadow-sm">مستقر</span></span>
              </div>
            </div>

            {/* كروت الخدمات - عرض كرتين بشكل متوازن */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group bg-white p-10 rounded-[35px] shadow-sm border border-gray-50 flex flex-col items-center text-center space-y-4 hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <div className="bg-blue-50 p-5 rounded-3xl group-hover:bg-blue-600 transition-colors">
                    <Home className="text-blue-600 group-hover:text-white w-12 h-12 transition-colors" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">مراكز الإيواء</h2>
                  <div className="flex justify-between w-full pt-6 border-t border-gray-100 items-center">
                      <span className="text-green-600 bg-green-50 px-4 py-1.5 rounded-xl text-xs font-bold">متاح للاستقبال</span>
                  </div>
              </div>

              <div className="group bg-white p-10 rounded-[35px] shadow-sm border border-gray-50 flex flex-col items-center text-center space-y-4 hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <div className="bg-blue-50 p-5 rounded-3xl group-hover:bg-blue-600 transition-colors">
                    <MapPin className="text-blue-600 group-hover:text-white w-12 h-12 transition-colors" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">إدارة المخيمات</h2>
                  <div className="flex justify-between w-full pt-6 border-t border-gray-100 items-center">
                      <span className="text-orange-600 bg-orange-50 px-4 py-1.5 rounded-xl text-xs font-bold">شبه ممتلئ</span>
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShelterDashboard;