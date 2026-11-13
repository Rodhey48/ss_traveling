import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import type { BackendMenu } from '@/types';

export function usePermission(targetPath?: string) {
  const location = useLocation();
  const currentPath = targetPath || location.pathname;
  const { menus } = useAuth();

  const permissions = useMemo(() => {
    if (!menus || menus.length === 0) return { isRead: false, isCreate: false, isUpdate: false, isDelete: false, actions: {} };

    try {
      // Helper to find menu by exact path or closest matching prefix
      let prefixMatch: BackendMenu | null = null;

      const findMenu = (list: BackendMenu[]): BackendMenu | null => {
        if (!Array.isArray(list)) return null;
        for (const item of list) {
          if (item?.url === currentPath) return item;
          if (
            item?.url &&
            item.url !== '/' &&
            currentPath.startsWith(item.url + '/') &&
            (!prefixMatch || item.url.length > (prefixMatch.url?.length || 0))
          ) {
            prefixMatch = item;
          }
          if (item?.children && item.children.length > 0) {
            const found = findMenu(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const matchedMenu = findMenu(menus) || prefixMatch;
      
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
  }, [currentPath, menus]);

  return permissions;
}

