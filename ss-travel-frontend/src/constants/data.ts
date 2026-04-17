import type { NavItem } from '@/types';

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: 'dashboard',
    label: 'Dashboard'
  },
  {
    title: 'Fleet Management',
    href: '/fleet',
    icon: 'kanban',
    label: 'Fleet'
  },
  {
    title: 'Finance',
    href: '/finance',
    icon: 'billing',
    label: 'Finance'
  },
  {
    title: 'Users',
    href: '/user',
    icon: 'user',
    label: 'User'
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'settings',
    label: 'Settings'
  }
];
