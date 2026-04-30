"use client";

import React, { useState } from 'react';
import { User, Phone, Users, MapPin, Loader2 } from 'lucide-react';

export default function RegisterCitizen() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    numberOfFamily: '',
    campId: '', // سيتم إرسال اسم المخيم ليقوم السيرفر بربطه
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/project/admins/addBeneficiary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'تم تسجيل بياناتك بنجاح' });
        setFormData({ name: '', phone: '', numberOfFamily: '', campId: '' });
      } else {
        setMessage({ type: 'error', text: result.message || 'حدث خطأ أثناء التسجيل' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'فشل الاتصال بالسيرفر' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">تسجيل مستفيد جديد</h2>
          <p className="text-gray-500 mt-2 text-sm">يرجى إدخال البيانات بدقة لضمان وصول المساعدات</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* حقل الاسم */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل (بالعربية)</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                <User size={18} />
              </span>
              <input
                required
                type="text"
                placeholder="أدخل اسمك الثلاثي"
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          {/* حقل رقم الهاتف */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                <Phone size={18} />
              </span>
              <input
                required
                type="text"
                placeholder="059xxxxxxx"
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-left"
                dir="ltr"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* حقل عدد أفراد الأسرة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عدد أفراد الأسرة</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                <Users size={18} />
              </span>
              <input
                required
                type="number"
                min="1"
                max="99"
                placeholder="مثال: 5"
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                value={formData.numberOfFamily}
                onChange={(e) => setFormData({ ...formData, numberOfFamily: e.target.value })}
              />
            </div>
          </div>

          {/* حقل المخيم أو المنطقة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المخيم / المنطقة</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                <MapPin size={18} />
              </span>
              <input
                type="text"
                placeholder="اسم المخيم المتواجد به حالياً"
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                value={formData.campId}
                onChange={(e) => setFormData({ ...formData, campId: e.target.value })}
              />
            </div>
          </div>

          {/* رسائل التنبيه */}
          {message && (
            <div className={`p-3 rounded-lg text-sm text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {/* زر الإرسال */}
          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin ml-2" size={20} />
                جاري الحفظ...
              </>
            ) : (
              'تسجيل البيانات الآن'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}