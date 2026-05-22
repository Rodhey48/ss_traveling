import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { BackendMenu } from '@/types';

export function usePermission() {
  const location = useLocation();
  const currentPath = location.pathname;

  const permissions = useMemo(() => {
    const storedMenus = localStorage.getItem('menus');
    if (!storedMenus) return { isRead: false, isCreate: false, isUpdate: false, isDelete: false, actions: {} };

    try {
      const menus: BackendMenu[] = JSON.parse(storedMenus);
      
      // Helper to find menu by path recursively
      const findMenu = (list: BackendMenu[]): BackendMenu | null => {
        if (!Array.isArray(list)) return null;
        for (const item of list) {
          if (item?.url === currentPath) return item;
          if (item?.children && item.children.length > 0) {
            const found = findMenu(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const matchedMenu = findMenu(menus);
      
      if (matchedMenu) {
        return {
          isRead: !!matchedMenu.isRead,
          isCreate: !!matchedMenu.isCreate,
          isUpdate: !!matchedMenu.isUpdate,
          isDelete: !!matchedMenu.isDelete,
          actions: matchedMenu.actions || {},
        };
      }
    } catch (error) {
      console.error('Error parsing permissions', error);
    }

    return { isRead: false, isCreate: false, isUpdate: false, isDelete: false, actions: {} };
  }, [currentPath]);

  return permissions;
}
