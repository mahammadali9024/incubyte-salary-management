import { AppShell, Burger, Button, Group, NavLink, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChartBar, IconLogout, IconUsers } from '../icons.js';
import { NavLink as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const LINKS = [
  { to: '/employees', label: 'Employees', icon: IconUsers },
  { to: '/insights', label: 'Pay insights', icon: IconChartBar },
];

export function AppLayout() {
  const [opened, { toggle, close }] = useDisclosure();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label="Toggle navigation"
            />
            <Title order={4}>ACME Salaries</Title>
          </Group>
          <Group gap="sm" wrap="nowrap">
            <Text size="sm" c="dimmed" visibleFrom="sm">
              {user?.email}
            </Text>
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconLogout size={16} />}
              onClick={() => logout.mutate()}
            >
              Sign out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="sm">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            component={RouterLink}
            to={to}
            label={label}
            leftSection={<Icon size={18} />}
            active={pathname.startsWith(to)}
            onClick={close}
          />
        ))}
      </AppShell.Navbar>
      {/* The page never grows past the viewport: content scrolls inside the main area. */}
      <AppShell.Main
        h="100dvh"
        style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}
      >
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
