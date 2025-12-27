import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

export type ViewMode = 'management' | 'accounting';

interface NavigationState {
  viewMode: ViewMode;
  openMenus: string[];
  activeSubmenu: string | null;
}

export function useNavigation() {
  const router = useRouter();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    viewMode: 'management',
    openMenus: [],
    activeSubmenu: null
  });

  useEffect(() => {
    const pathname = router.pathname || '';
    const accountingRoutes = [
      '/comptabilite', 
      '/accounting', 
      '/tax', 
      '/reports/balance-sheet', 
      '/reports/income-statement',
      '/saisie',
      '/revision',
      '/fiscalite'
    ];
    
    const isAccountingRoute = accountingRoutes.some(route => 
      pathname.startsWith(route) || pathname.includes('accounting')
    );
    
    setNavigationState(prev => ({
      ...prev,
      viewMode: isAccountingRoute ? 'accounting' : 'management',
      openMenus: isAccountingRoute && !prev.openMenus.includes('saisie') 
        ? [...prev.openMenus, 'saisie'] 
        : prev.openMenus
    }));
  }, [router.pathname]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setNavigationState(prev => ({
      ...prev,
      viewMode: mode,
      openMenus: mode === 'accounting' ? ['saisie'] : [],
      activeSubmenu: null
    }));
  }, []);

  const toggleMenu = useCallback((menuId: string) => {
    setNavigationState(prev => ({
      ...prev,
      openMenus: prev.openMenus.includes(menuId)
        ? prev.openMenus.filter(id => id !== menuId)
        : [...prev.openMenus, menuId]
    }));
  }, []);

  const setActiveSubmenu = useCallback((submenuId: string | null) => {
    setNavigationState(prev => ({
      ...prev,
      activeSubmenu: submenuId
    }));
  }, []);

  const navigateToSubmenu = useCallback((href: string, parentMenuId?: string) => {
    if (parentMenuId && !navigationState.openMenus.includes(parentMenuId)) {
      setNavigationState(prev => ({
        ...prev,
        openMenus: [...prev.openMenus, parentMenuId]
      }));
    }
    
    router.push(href);
  }, [router, navigationState.openMenus]);

  return {
    ...navigationState,
    setViewMode,
    toggleMenu,
    setActiveSubmenu,
    navigateToSubmenu
  };
}