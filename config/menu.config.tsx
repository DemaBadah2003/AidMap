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
    expanded: true, // ✅ يفتح قسم "لوحات التحكم" تلقائياً
    children: [
      {
        title: 'إدارة المشاريع',
        expanded: true, // ✅ يفتح قائمة "إدارة المشاريع" لتظهر المخيمات والمستفيدين فوراً
        children: [
          { title: 'المخيمات', path: '/project/projects/camps' },
          { title: 'المستفيدين', path: '/project/projects/beneficiaries' },
          { title: 'العيادة', path: '/project/projects/clinic' },
          { title: 'المراكز الإيوائية', path: '/project/projects/shelters' },
          { title: 'المشرفين', path: '/project/projects/supervisior' },
          { title: 'المؤسسات', path: '/project/projects/institutions' },
          { title: 'جهات الاتصال', path: '/project/projects/contacts' },
          { title: 'العناوين', path: '/project/projects/address' },
          { title: 'منتجات المؤسسات', path: '/project/projects/Enterprise-Products' },
          { title: 'المنتجات', path: '/project/projects/products' },
          { title: 'الخدمات', path: '/project/projects/service' },
          { title: 'الخدمات المؤسساتية', path: '/project/projects/institutional-services' },
          { title: 'الطوارئ', path: '/project/projects/Emergency' },
          { title: 'التوزيعات', path: '/project/projects/Distributions' },
        ],
      },
      {
        title: 'لوحة تحكم المسؤول',
        path: '/store-admin/dashboard',
        roles: ['admin'],
        expanded: true, // ✅ يفتح قائمة "لوحة تحكم المسؤول" لتظهر معاينة الخريطة وإضافة مكان فوراً
        children: [
          { title: 'معاينة الخريطة', path: '/project/MapPreview' },
          { title: 'إضافة مكان', path: '/project/admins/addPlaces' },
          { title: 'تسجيل مستفيد', path: '/project/admins/adminBeneficiary' },
          { title: 'فحص مساعدة', path: '/project/admins/addAid' },
          { title:'طلب مساعدة ', path: '/project/admins/distributeAid' },
        ],
      },
    ],
  },
];

// القوائم الأخرى فارغة كما طلبت في تعديلاتك السابقة
export const MENU_SIDEBAR_CUSTOM: MenuConfig = [];
export const MENU_SIDEBAR_COMPACT: MenuConfig = [];
export const MENU_ROOT: MenuConfig = [];
export const MENU_MEGA: MenuConfig = [];
export const MENU_MEGA_MOBILE: MenuConfig = [];

export const MENU_HELP: MenuConfig = [
  {
    title: 'الدعم والمساعدة',
    icon: HelpCircle,
    expanded: true, // ✅ مفتوحة تلقائياً
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