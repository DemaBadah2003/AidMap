'use client';

import { Navbar } from '@/partials/navbar/navbar';
import { NavbarMenu } from '@/partials/navbar/navbar-menu';
import { getSidebarMenuByRole } from '@/config/menu.config';
import { getCurrentRole } from '@/app/api/project/helpers/helpers';
import { useSettings } from '@/providers/settings-provider';
import { Container } from '@/components/common/container';

const PageNavbar = () => {
  const { settings } = useSettings();

  const role = getCurrentRole();
  const menu = getSidebarMenuByRole(role);

  const accountMenuConfig = menu?.['3']?.children;

  if (accountMenuConfig && settings?.layout === 'demo1') {
    return (
      <Navbar>
        <Container>
          <NavbarMenu items={accountMenuConfig} />
        </Container>
      </Navbar>
    );
  } else {
    return <></>;
  }
};

export { PageNavbar };