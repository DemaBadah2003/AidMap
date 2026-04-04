'use client';

import MapPreview from "@/app/components/maps/MapPreviewContent";
export const DashboardWireframe = () => {
  return (
    <div className="relative w-full h-full">
      <style jsx global>{`
        /* 1. تصفير الـ Layout الأب بالكامل لهذه الصفحة فقط */
        div[data-slot="container"], 
        .container, 
        main.grow.pt-5 {
          max-width: none !important;
          width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          display: block !important;
        }

        /* 2. سحب الخريطة لليسار وللأسفل بقوة الـ VW */
        .ultimate-breakout {
          width: 100vw !important;
          height: calc(100vh - 70px) !important;
          position: relative;
          /* هذه الحركة السحرية تسحب العنصر من وسط الـ Container الضيق لملء الشاشة */
          left: 50%;
          right: 50%;
          margin-left: -50vw !important;
          margin-right: -50vw !important;
          background: white;
          z-index: 10;
        }

        /* 3. إخفاء الفوتر لأنه هو من يسبب المساحة البيضاء تحت */
        footer, .footer {
          display: none !important;
        }

        /* 4. إزاحة الخريطة لليمين قليلاً لترك مساحة للسايدبار (بما أن الموقع RTL) */
        [dir="rtl"] .ultimate-breakout {
          /* جربي تغيير الرقم 280px حسب عرض السايدبار عندك */
          padding-right: 280px !important; 
        }
      `}</style>
      
      <div className="ultimate-breakout">
        <MapPreview />
      </div>
    </div>
  );
};