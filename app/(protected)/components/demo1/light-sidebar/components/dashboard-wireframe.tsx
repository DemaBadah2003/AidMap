'use client';

import MapPreview from "@/app/components/maps/MapPreviewContent";

export const DashboardWireframe = () => {
  return (
    <div className="w-full h-full">
      <style jsx global>{`
        /* 1. إجبار كافة الحاويات الأبوية على أخذ كامل طول الشاشة بدون استثناء */
        html, body, #__next, 
        .app-default, .app-wrapper, .app-main, .app-content,
        #kt_app_content, #kt_app_content_container, .app-container {
          height: 100% !important;
          min-height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
        }

        /* 2. إلغاء أي مساحات بيضاء يفرضها القالب في الأسفل أو الجوانب */
        #kt_app_footer, .app-footer, .footer {
          display: none !important;
        }

        /* 3. الخريطة: وضعها بشكل مطلق لتمسك الحواف المطلوبة */
        .map-wrapper-final {
          position: absolute !important;
          /* الالتصاق باليسار */
          left: 0 !important; 
          /* الالتصاق بالأسفل تماماً لملء الفراغ */
          bottom: 0 !important; 
          /* ترك مسافة عن السايدبار (الجهة اليمنى) - عدل 300px حسب حاجتك */
          right: 300px !important; 
          /* البداية من تحت الهيدر مباشرة */
          top: 80px !important; 

          background: white;
          z-index: 1;
          overflow: hidden;
          box-shadow: 0 0 15px rgba(0,0,0,0.05);
        }

        /* 4. إجبار مكون الخريطة الداخلي على التمدد */
        .map-wrapper-final > div {
          height: 100% !important;
          width: 100% !important;
        }

        /* 5. إزالة أي Padding إضافي قد يظهر في النسخ الجديدة من Metronic */
        .app-main {
            background-color: #ffffff !important;
        }
      `}</style>
      
      <div className="map-wrapper-final">
        <MapPreview />
      </div>
    </div>
  );
};