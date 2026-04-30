"use client";

import React, { useState } from 'react';
import { Search, Activity, Droplets, UtensilsCrossed, CheckCircle, XCircle } from 'lucide-react';

const FoodWaterDashboard = () => {
  const [dataList, setDataList] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('كل المناطق');
  const [selectedType, setSelectedType] = useState('الكل (ماء وطعام)');

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/Catering/home?region=${selectedRegion}&type=${selectedType}`);
      const data = await response.json();
      setDataList(data);
      setShowResults(true);
    } catch (error) {
      alert("خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col items-center w-full font-sans" dir="rtl">
      
      <div className="text-center mb-10 mt-6 w-full flex justify-center items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Activity className="text-white w-7 h-7" /></div>
        <h1 className="text-[#1e3a8a] text-3xl font-black italic">نظام التوزيع الميداني</h1>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 w-full max-w-6xl overflow-hidden">
        
        <div className="p-6 border-b border-gray-50 flex flex-wrap md:flex-nowrap items-end gap-4">
          <button 
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white h-[48px] px-10 rounded-xl flex items-center justify-center gap-2 font-bold disabled:opacity-50"
            disabled={isLoading}
          >
            <Search size={18} /> {isLoading ? 'جاري البحث...' : 'بحث وتحديث'}
          </button>

          <div className="flex-1 space-y-1 text-right">
            <label className="text-[10px] font-bold text-gray-400 mr-2">التصنيف</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full h-[48px] p-2.5 bg-[#f8fafc] border border-gray-100 rounded-xl outline-none">
              <option>الكل (ماء وطعام)</option>
              <option value="نقاط مياه فقط">نقاط مياه فقط</option>
              <option value="نقاط طعام فقط">نقاط طعام فقط</option>
            </select>
          </div>

          <div className="flex-1 space-y-1 text-right">
            <label className="text-[10px] font-bold text-blue-500 mr-2">المنطقة الجغرافية</label>
            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="w-full h-[48px] p-2.5 bg-[#f8fafc] border border-gray-100 rounded-xl outline-none">
              <option value="كل المناطق">كل المناطق</option>
              <option value="شمال">شمال</option>
              <option value="جنوب">جنوب</option>
              <option value="شرق">شرق</option>
              <option value="غرب">غرب</option>
            </select>
          </div>
        </div>

        {showResults && (
          <div className="animate-in fade-in duration-500">
            {/* الهيكل المطلوب: سكرول بعد 5 صفوف تقريباً */}
            <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-[#fcfdfe] sticky top-0 z-10 border-b border-gray-100 shadow-sm">
                  <tr>
                    <th className="p-6 text-sm font-bold text-slate-500">الاتجاه</th>
                    <th className="p-6 text-sm font-bold text-slate-500 text-center">الحي / المنطقة</th>
                    <th className="p-6 text-sm font-bold text-slate-500 text-center">النوع</th>
                    <th className="p-6 text-sm font-bold text-slate-500 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dataList.length > 0 ? (
                    dataList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors h-20">
                        <td className="p-6 text-base font-bold text-slate-700">{item.majorRegion}</td>
                        <td className="p-6 text-base font-bold text-blue-800 text-center">{item.subRegion}</td>
                        <td className="p-6 text-center">
                          <div className="flex items-center justify-center gap-2 font-bold text-xs">
                            {item.type === 'ماء' ? (
                              <span className="text-blue-500 bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1">
                                <Droplets size={12}/> ماء
                              </span>
                            ) : (
                              <span className="text-orange-500 bg-orange-50 px-3 py-1 rounded-full flex items-center gap-1">
                                <UtensilsCrossed size={12}/> طعام
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`px-4 py-1.5 rounded-full font-bold text-[11px] ${
                            item.status === 'متوفر' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="p-20 text-center text-gray-400 font-medium">عذراً، لم يتم العثور على نتائج في هذه المنطقة</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodWaterDashboard;