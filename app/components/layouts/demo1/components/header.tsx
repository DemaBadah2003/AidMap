'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserDropdownMenu } from '@/partials/topbar/user-dropdown-menu';
import { Menu, SquareChevronRight } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Container } from '@/components/common/container';
import { Breadcrumb } from './breadcrumb';
import { MegaMenu } from './mega-menu';
import { MegaMenuMobile } from './mega-menu-mobile';
import { SidebarMenu } from './sidebar-menu';

export function Header() {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);
  const [isMegaMenuSheetOpen, setIsMegaMenuSheetOpen] = useState(false);

  const pathname = usePathname();
  const mobileMode = useIsMobile();

  const scrollPosition = useScrollPosition();
  const headerSticky: boolean = scrollPosition > 0;

  useEffect(() => {
    setIsSidebarSheetOpen(false);
    setIsMegaMenuSheetOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-b border-border',
      )}
    >
      <Container className="flex items-center w-full lg:gap-4">
        {/* Left Side (Logo + Mobile Buttons) */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <Link href="/" className="shrink-0">
            <img
              src={toAbsoluteUrl('/media/app/mini-logo.svg')}
              className="h-[25px] w-full"
              alt="mini-logo"
            />
          </Link>

          <div className="flex items-center">
            {mobileMode && (
              <Sheet
                open={isSidebarSheetOpen}
                onOpenChange={setIsSidebarSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="ghost" mode="icon">
                    <Menu className="text-muted-foreground/70" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className="w-[275px] gap-0 p-0"
                  side="left"
                  close={false}
                >
                  <SheetHeader className="space-y-0 p-0" />
                  <SheetBody className="overflow-y-auto p-0">
                    <SidebarMenu />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            )}

            {mobileMode && (
              <Sheet
                open={isMegaMenuSheetOpen}
                onOpenChange={setIsMegaMenuSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="ghost" mode="icon">
                    <SquareChevronRight className="text-muted-foreground/70" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className="w-[275px] gap-0 p-0"
                  side="left"
                  close={false}
                >
                  <SheetHeader className="space-y-0 p-0" />
                  <SheetBody className="overflow-y-auto p-0">
                    <MegaMenuMobile />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {/* Middle Content */}
        <div className="flex flex-1 items-center justify-center lg:justify-start">
          {pathname.startsWith('/account') ? (
            <Breadcrumb />
          ) : (
            !mobileMode && <MegaMenu />
          )}
        </div>

        {/* Right Side (User Image) */}
        <div className="ms-auto flex items-center gap-3">
          <UserDropdownMenu
            trigger={
              <img
                className="size-9 shrink-0 cursor-pointer rounded-full border-2 border-green-500"
                src={toAbsoluteUrl('/media/avatars/300-2.png')}
                alt="User Avatar"
              />
            }
          />
        </div>
      </Container>
    </header>
  );
}