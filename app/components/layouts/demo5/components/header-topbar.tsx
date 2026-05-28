'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Moon, Sun } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';

export function HeaderTopbar() {
  const [darkMode, setDarkMode] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);

    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      {/* تم إزالة خيار اللغة من هنا */}

      <Button
        variant="outline"
        mode="icon"
        shape="circle"
        onClick={toggleTheme}
        title="Change theme"
      >
        {darkMode ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
      </Button>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="cursor-pointer"
          aria-label="Open profile menu"
        >
          <img
            className="size-9 rounded-full border-2 border-mono/25 shrink-0"
            src={toAbsoluteUrl('/media/avatars/300-2.png')}
            alt="User Avatar"
          />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-background shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-semibold">الحساب الشخصي</p>
              <p className="text-xs text-muted-foreground">إدارة الإعدادات الشخصية</p>
            </div>

            <Link
              href="/account/home/user-profile"
              className="block px-4 py-3 text-sm hover:bg-muted transition-colors"
              onClick={() => setOpen(false)}
            >
              تعديل البروفايل
            </Link>

            <Link
              href="/account/security/overview"
              className="block px-4 py-3 text-sm hover:bg-muted transition-colors"
              onClick={() => setOpen(false)}
            >
              تغيير كلمة المرور
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="w-full text-right px-4 py-3 text-sm hover:bg-muted transition-colors"
            >
              {darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
            </button>
            
            {/* تم إزالة قسم تغيير اللغة من القائمة المنسدلة */}
          </div>
        )}
      </div>
    </div>
  );
}سس