'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { I18N_LANGUAGES, Language } from '@/i18n/config';
import {
  Globe,
  Moon,
  Lock,
  Pencil,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/providers/i18n-provider';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

const translations = {
  en: {
    pro: 'Pro',
    profile: 'Profile',
    viewProfile: 'View Profile',
    editProfile: 'Edit Profile',
    preferences: 'Preferences',
    language: 'Language',
    theme: 'Theme',
    security: 'Security',
    changePassword: 'Change Password',
    logout: 'Logout',
  },
  ar: {
    pro: 'احترافي',
    profile: 'الملف الشخصي',
    viewProfile: 'عرض الملف الشخصي',
    editProfile: 'تعديل الملف الشخصي',
    preferences: 'التفضيلات',
    language: 'اللغة',
    theme: 'الثيم',
    security: 'الأمان',
    changePassword: 'تغيير كلمة المرور',
    logout: 'تسجيل الخروج',
  },
  es: {
    pro: 'Pro',
    profile: 'Perfil',
    viewProfile: 'Ver perfil',
    editProfile: 'Editar perfil',
    preferences: 'Preferencias',
    language: 'Idioma',
    theme: 'Tema',
    security: 'Seguridad',
    changePassword: 'Cambiar contraseña',
    logout: 'Cerrar sesión',
  },
  de: {
    pro: 'Pro',
    profile: 'Profil',
    viewProfile: 'Profil anzeigen',
    editProfile: 'Profil bearbeiten',
    preferences: 'Einstellungen',
    language: 'Sprache',
    theme: 'Thema',
    security: 'Sicherheit',
    changePassword: 'Passwort ändern',
    logout: 'Abmelden',
  },
  ch: {
    pro: '专业版',
    profile: '个人资料',
    viewProfile: '查看资料',
    editProfile: '编辑资料',
    preferences: '偏好设置',
    language: '语言',
    theme: '主题',
    security: '安全',
    changePassword: '修改密码',
    logout: '退出登录',
  },
};

export function UserDropdownMenu({ trigger }: { trigger: ReactNode }) {
  const { data: session } = useSession();
  const { changeLanguage, language } = useLanguage();
  const { theme, setTheme } = useTheme();

  const t =
    translations[language.code as keyof typeof translations] || translations.en;

  const handleLanguage = (lang: Language) => {
    changeLanguage(lang.code);
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" side="bottom" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <img
              className="h-9 w-9 rounded-full border border-border"
              src="/media/avatars/300-2.png"
              alt="User avatar"
            />
            <div className="flex flex-col">
              <Link
                href="/account/home/get-started"
                className="text-sm font-semibold text-mono hover:text-primary"
              >
                {session?.user?.name || ''}
              </Link>
              <Link
                href={`mailto:${session?.user?.email || ''}`}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                {session?.user?.email || ''}
              </Link>
            </div>
          </div>

          <Badge variant="primary" appearance="light" size="sm">
            {t.pro}
          </Badge>
        </div>

        <DropdownMenuSeparator />

        {/* Profile */}
        <DropdownMenuLabel className="font-semibold">
          {t.profile}
        </DropdownMenuLabel>

        <DropdownMenuItem asChild>
          <Link href="/profile-page" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            {t.viewProfile}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/profile-page/edit" className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            {t.editProfile}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Preferences */}
        <DropdownMenuLabel className="font-semibold">
          {t.preferences}
        </DropdownMenuLabel>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 [&_[data-slot=dropdown-menu-sub-trigger-indicator]]:hidden hover:[&_[data-slot=badge]]:border-input data-[state=open]:[&_[data-slot=badge]]:border-input">
            <Globe className="h-4 w-4" />
            <span className="relative flex grow items-center justify-between gap-2">
              {t.language}
              <Badge
                variant="outline"
                className="absolute end-0 top-1/2 -translate-y-1/2"
              >
                {language.name}
                <img
                  src={language.flag}
                  className="h-3.5 w-3.5 rounded-full"
                  alt={language.name}
                />
              </Badge>
            </span>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent className="w-48">
            <DropdownMenuRadioGroup
              value={language.code}
              onValueChange={(value) => {
                const selectedLang = I18N_LANGUAGES.find(
                  (lang) => lang.code === value
                );
                if (selectedLang) handleLanguage(selectedLang);
              }}
            >
              {I18N_LANGUAGES.map((item) => (
                <DropdownMenuRadioItem
                  key={item.code}
                  value={item.code}
                  className="flex items-center gap-2"
                >
                  <img
                    src={item.flag}
                    className="h-4 w-4 rounded-full"
                    alt={item.name}
                  />
                  <span>{item.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem
          className="flex items-center gap-2"
          onSelect={(event) => event.preventDefault()}
        >
          <Moon className="h-4 w-4" />
          <div className="flex grow items-center justify-between gap-2">
            {t.theme}
            <Switch
              size="sm"
              checked={theme === 'dark'}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Security */}
        <DropdownMenuLabel className="font-semibold">
          {t.security}
        </DropdownMenuLabel>

        <DropdownMenuItem asChild>
          <Link
            href="/profile-page/security/change-password"
            className="flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            {t.changePassword}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          className="flex items-center gap-2 text-destructive focus:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          {t.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}