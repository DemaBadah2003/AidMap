import {
  AlertCircle,
  Captions,
  Coffee,
  FileQuestion,
  LayoutGrid,
  Share2,
  Star,
  HelpCircle,
} from 'lucide-react';
import { type MenuConfig, type AppRole, type MenuItem } from './types';

export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'لوحات التحكم',
    icon: LayoutGrid,
    expanded: true, 
    children: [
      {
        title: 'إدارة المشاريع',
        expanded: true, 
        children: [
          // 1. الخدمات الطبية (معدل ليكون أشمل)
          {
            title: 'الخدمات الطبية والصحية',
            path: '/project/projects/Medical-Services/clinic',
            children: [
              { title: 'جدول المستشفيات', path: '/project/projects/Medical-Services/hospitals' },
              { title: 'جدول الدكاترة', path: '/project/projects/Medical-Services/doctors' },
              { title: 'جدول المرضى', path: '/project/projects/Medical-Services/patients' },
              { title: 'جدول المعايير', path: '/project/projects/Medical-Services/criteria' },
              { title: 'جدول الصيدليات', path: '/project/projects/Medical-Services/pharmacies' },
              { title: 'جدول مدير المستشفى', path: '/project/projects/Medical-Services/hospital-manager' },
              { title: 'جدول العروض', path: '/project/projects/Medical-Services/offers' },
              { title: 'طلبات الرعاية الطبية', path: '/project/projects/Medical-Services/Medical-care' },
            ],
          },

          // 2. الخدمات التعليمية (القسم الجديد المضاف)
          {
            title: 'الخدمات التعليمية والطلاب',
            path: '/project/projects/education',
            children: [
              { title: 'أماكن خيام التعليم', path: '/project/projects/education/camps' },
              { title: 'مراكز الدعم النفسي', path: '/project/projects/education/psychological' },
              { title: 'نقاط الإنترنت للدراسة', path: '/project/projects/education/internet' },
              { title: 'قضايا الطلاب والتعليم', path: '/project/projects/education/student-issues' },
              { title: 'جدول المدارس', path: '/project/projects/education/school' },
              { title: 'جدول الطلاب', path: '/project/projects/education/students' },
            ],
          },

          // 3. الغذاء والمياه (القسم الجديد المضاف)
          {
            title: 'الغذاء والمياه (المعونات)',
            path: '/project/projects/food-water',
            children: [
              { title: 'نقاط توزيع المياه', path: '/project/projects/food-water/water' },
              { title: 'نقاط توزيع الطعام', path: '/project/projects/food-water/food' },
              { title: 'التوزيعات المؤسساتية', path: '/project/projects/food-water/Distributions' },
              { title: 'المنتجات', path: '/project/projects/food-water/products' },
               { title: 'المستفيد', path: '/project/projects/food-water/beneficiaries' },



            ],
          },

          // 4. المراكز الإيوائية
          {
            title: 'المراكز الإيوائية',
            path: '/project/projects/camp',
            children: [
              { title: 'جدول مركز الايواء', path: '/project/projects/camp/shelters' },
              { title: 'جدول المشرفين', path: '/project/projects/camp/supervisior' },
              { title: 'جدول الطوارئ', path: '/project/projects/camp/Emergency' },
            ],
          },

          // 5. المؤسسات الداعمة
          {
            title: 'المؤسسات الداعمة',
            path: '/project/projects/institutions',
            children: [
              { title: 'المؤسسات', path: '/project/projects/institution/institutions' },
              { title: 'منتجات المؤسسات', path: '/project/projects/institution/Enterprise-Products' },
              { title: 'الخدمات', path: '/project/projects/institution/service' },
              { title: 'الخدمات المؤسساتية', path: '/project/projects/institution/institutional-services' },
            ],
          },
        ],
      },
      {
        title: 'لوحة تحكم المسؤول',
        path: '/store-admin/dashboard',
        roles: ['admin'],
        expanded: true, 
        children: [
          { title: 'معاينة الخريطة', path: '/project/MapPreview' },
          { title: 'إضافة مكان', path: '/project/admins/addPlaces' },
          { title: 'تسجيل مستفيد', path: '/project/admins/adminBeneficiary' },
          { title: 'فحص مساعدة', path: '/project/admins/addAid' },
          { title: 'طلب مساعدة ', path: '/project/admins/distributeAid' },
        ],
      },
    ],
  },
];

// القوائم الأخرى والوظائف تظل كما هي في كودك الأصلي...
export const MENU_SIDEBAR_CUSTOM: MenuConfig = [];
export const MENU_SIDEBAR_COMPACT: MenuConfig = [];
export const MENU_ROOT: MenuConfig = [];
export const MENU_MEGA: MenuConfig = [];
export const MENU_MEGA_MOBILE: MenuConfig = [];

export const MENU_HELP: MenuConfig = [
  {
    title: 'الدعم والمساعدة',
    icon: HelpCircle,
    expanded: true, 
    children: [
      {
        title: 'ابدأ هنا',
        icon: Coffee,
        path: 'https://keenthemes.com/metronic/tailwind/docs/getting-started/installation',
      },
      {
        title: 'التوثيق التعليمي',
        icon: FileQuestion,
        path: 'https://keenthemes.com/metronic/tailwind/docs',
      },
    ],
  },
];

function filterMenuByRole(items: MenuItem[], role: AppRole | null): MenuItem[] {
  return items
    .filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      if (!role) return false;
      return item.roles.includes(role);
    })
    .map((item) => ({
      ...item,
      children: item.children
        ? filterMenuByRole(item.children, role)
        : undefined,
    }));
}

export function getSidebarMenuByRole(role: AppRole | null): MenuConfig {
  return filterMenuByRole(MENU_SIDEBAR, role);
}