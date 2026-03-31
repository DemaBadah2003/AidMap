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
    title: 'Dashboards',
    icon: LayoutGrid,
    children: [
      {
        title: 'Project Sidebar',
        children: [
          { title: 'Camps Sidebar', path: '/project/projects/camps' },
          { title: 'beneficiaries Sidebar', path: '/project/projects/beneficiaries' },
          { title: ' Clinic Sidebar', path: '/project/projects/clinic' },
          { title: ' shelters Sidebar', path: '/project/projects/shelters' },
          { title: ' supervisior Sidebar', path: '/project/projects/supervisior' },
          { title: 'institutions Sidebar', path: '/project/projects/institutions' },
          { title: 'contacts Sidebar', path: '/project/projects/contacts' },
          { title: 'address Sidebar', path: '/project/projects/address' },
          { title: 'Enterprise-Products  Sidebar', path: '/project/projects/Enterprise-Products' },
          { title: 'products Sidebar', path: '/project/projects/products' },
          { title: 'service Sidebar', path: '/project/projects/service' },
          { title: 'institutional-services Sidebar', path: '/project/projects/institutional-services' },
          { title: 'Emergency  Sidebar', path: '/project/projects/Emergency' },
          { title: 'Distributions  Sidebar', path: '/project/projects/Distributions' },
        ],
      },
      {
        title: 'Admin Dashboard',
        path: '/store-admin/dashboard',
        roles: ['admin'],
        children: [
       { title: 'Map Preview', path: '/project/MapPreview' },
          { title: 'Add Place', path: '/project/admins/addPlaces' },
          { title: 'Admin Beneficiary', path: '/project/admins/adminBeneficiary' },
          { title: 'Add Aid', path: '/project/admins/addAid' },
          { title: 'Distribute Aid', path: '/project/admins/distributeAid' },
        ],
      },
   
    ],
  },
];

export const MENU_SIDEBAR_CUSTOM: MenuConfig = [
  {
    title: 'Store - Client',
    children: [
      { title: 'Home', path: '/store-client/home' },
      {
        title: 'Search Results',
        children: [
          {
            title: 'Search Results - Grid',
            path: '/store-client/search-results-grid',
          },
          {
            title: 'Search Results - List',
            path: '/store-client/search-results-list',
          },
        ],
      },
      {
        title: 'Overlays',
        children: [
          { title: 'Product Details', path: '/store-client/product-details' },
          { title: 'Wishlist', path: '/store-client/wishlist' },
        ],
      },
      {
        title: 'Checkout',
        children: [
          {
            title: 'Order Summary',
            path: '/store-client/checkout/order-summary',
          },
          {
            title: 'Shipping Info',
            path: '/store-client/checkout/shipping-info',
          },
          {
            title: 'Payment Method',
            path: '/store-client/checkout/payment-method',
          },
          {
            title: 'Order Placed',
            path: '/store-client/checkout/order-placed',
          },
        ],
      },
      { title: 'My Orders', path: '/store-client/my-orders' },
      { title: 'Order Receipt', path: '/store-client/order-receipt' },
    ],
  },
];

/**
 * تم تفريغ هذا المينيو بالكامل حتى تختفي العناصر التالية من السايدبار:
 * Public Profile
 * My Account
 * Network
 * Authentication
 * User Management
 * Store - Client
 * وكذلك Home / Dashboards من الشكل المضغوط
 */
export const MENU_SIDEBAR_COMPACT: MenuConfig = [];

/**
 * تم تفريغ المينيو العلوي بالكامل حتى تختفي:
 * Home
 * Profiles
 * My Account
 * Network
 * Apps
 */
export const MENU_ROOT: MenuConfig = [];

export const MENU_MEGA: MenuConfig = [];

export const MENU_MEGA_MOBILE: MenuConfig = [];

export const MENU_HELP: MenuConfig = [
  {
    title: 'Getting Started',
    icon: Coffee,
    path: 'https://keenthemes.com/metronic/tailwind/docs/getting-started/installation',
  },
  {
    title: 'Support Forum',
    icon: AlertCircle,
    children: [
      {
        title: 'All Questions',
        icon: FileQuestion,
        path: 'https://devs.keenthemes.com',
      },
      {
        title: 'Popular Questions',
        icon: Star,
        path: 'https://devs.keenthemes.com/popular',
      },
      {
        title: 'Ask Question',
        icon: HelpCircle,
        path: 'https://devs.keenthemes.com/question/create',
      },
    ],
  },
  {
    title: 'Licenses & FAQ',
    icon: Captions,
    path: 'https://keenthemes.com/metronic/tailwind/docs/getting-started/license',
  },
  {
    title: 'Documentation',
    icon: FileQuestion,
    path: 'https://keenthemes.com/metronic/tailwind/docs',
  },
  { separator: true },
  {
    title: 'Contact Us',
    icon: Share2,
    path: 'https://keenthemes.com/contact',
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