import { useCallback, useEffect, useState } from 'react';
import type { NavSection } from '../stores/useProjectStore';

export const VALID_SECTIONS: NavSection[] = [
  'dashboard',
  'deployments',
  'explorer',
  'git',
  'tokens',
  'iam',
  'quotas',
  'cors',
  'public-config',
  'audit',
  'errors',
  'settings',
];

export function resolveSectionFromPathname(pathname: string): NavSection | 'landing' | 'login' {
  const clean = (pathname || '/').replace(/\/+$/, '') || '/';
  if (clean === '/' || clean === '/home' || clean === '/landing') {
    return 'landing';
  }
  if (clean === '/login' || clean === '/signin') {
    return 'login';
  }
  const seg = clean.replace(/^\/+/, '').split('/')[0] as NavSection;
  if (VALID_SECTIONS.includes(seg)) {
    return seg;
  }
  return 'dashboard';
}

export function getQueryParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

export function syncRouteAndParams(
  pathname?: string,
  updates?: Record<string, string | number | null | undefined>,
  push: boolean = false
): void {
  if (typeof window === 'undefined') return;
  const targetPath = pathname || window.location.pathname || '/';
  const params = new URLSearchParams(window.location.search);

  if (updates) {
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '') {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
  }

  const qs = params.toString();
  const nextUrl = qs ? `${targetPath}?${qs}` : targetPath;
  const currentUrl = `${window.location.pathname}${window.location.search}`;
  if (nextUrl !== currentUrl) {
    if (push) {
      window.history.pushState({}, '', nextUrl);
    } else {
      window.history.replaceState({}, '', nextUrl);
    }
    window.dispatchEvent(new CustomEvent('opspages:urlchange'));
  }
}

export interface UrlTableStateOptions {
  defaultPage?: number;
  defaultPageSize?: number;
  defaultSearch?: string;
  defaultStatus?: string;
  defaultExtra?: Record<string, string>;
  prefix?: string;
}

export function useUrlTableState(options: UrlTableStateOptions = {}) {
  const prefix = options.prefix ? `${options.prefix}_` : '';
  const pageKey = `${prefix}page`;
  const pageSizeKey = `${prefix}page_size`;
  const searchKey = `${prefix}q`;
  const statusKey = `${prefix}status`;

  const readFromUrl = useCallback(() => {
    const params = getQueryParams();
    const rawPage = parseInt(params.get(pageKey) || String(options.defaultPage || 1), 10);
    const rawPageSize = parseInt(
      params.get(pageSizeKey) || String(Math.max(10, options.defaultPageSize || 10)),
      10
    );
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
    // Enforce minimum 10 items per page as requested ("mostrar pelo menos 10 elementos na página")
    const pageSize = Number.isFinite(rawPageSize) && rawPageSize >= 10 ? rawPageSize : 10;
    const search = params.get(searchKey) ?? (options.defaultSearch || '');
    const status = params.get(statusKey) ?? (options.defaultStatus || 'all');

    const extra: Record<string, string> = {};
    if (options.defaultExtra) {
      Object.entries(options.defaultExtra).forEach(([k, defVal]) => {
        extra[k] = params.get(`${prefix}${k}`) ?? defVal;
      });
    }

    return { page, pageSize, search, status, extra };
  }, [
    pageKey,
    pageSizeKey,
    searchKey,
    statusKey,
    options.defaultPage,
    options.defaultPageSize,
    options.defaultSearch,
    options.defaultStatus,
    prefix,
  ]);

  const [state, setState] = useState(readFromUrl);

  useEffect(() => {
    // Ensure default page & page_size (>=10) are visible in the URL for bookmarking & inspection
    const params = getQueryParams();
    const initialUpdates: Record<string, string | number> = {};
    if (!params.get(pageKey)) {
      initialUpdates[pageKey] = state.page;
    }
    const existingSize = parseInt(params.get(pageSizeKey) || '0', 10);
    if (!existingSize || existingSize < 10) {
      initialUpdates[pageSizeKey] = Math.max(10, state.pageSize);
    }
    if (Object.keys(initialUpdates).length > 0) {
      syncRouteAndParams(undefined, initialUpdates, false);
    }

    const handleUrlChange = () => {
      setState(readFromUrl());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('opspages:urlchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('opspages:urlchange', handleUrlChange);
    };
  }, [pageKey, pageSizeKey, readFromUrl]);

  const setPage = useCallback(
    (nextPage: number, nextPageSize?: number) => {
      const safePage = Math.max(1, nextPage);
      const safeSize = Math.max(10, nextPageSize ?? state.pageSize);
      setState((prev) => ({ ...prev, page: safePage, pageSize: safeSize }));
      syncRouteAndParams(
        undefined,
        {
          [pageKey]: safePage,
          [pageSizeKey]: safeSize,
        },
        false
      );
    },
    [pageKey, pageSizeKey, state.pageSize]
  );

  const setSearch = useCallback(
    (nextSearch: string) => {
      setState((prev) => ({ ...prev, search: nextSearch, page: 1 }));
      syncRouteAndParams(
        undefined,
        {
          [searchKey]: nextSearch || null,
          [pageKey]: 1,
        },
        false
      );
    },
    [searchKey, pageKey]
  );

  const setStatus = useCallback(
    (nextStatus: string) => {
      setState((prev) => ({ ...prev, status: nextStatus, page: 1 }));
      syncRouteAndParams(
        undefined,
        {
          [statusKey]: nextStatus === 'all' ? null : nextStatus,
          [pageKey]: 1,
        },
        false
      );
    },
    [statusKey, pageKey]
  );

  const setExtra = useCallback(
    (key: string, value: string) => {
      setState((prev) => ({
        ...prev,
        page: 1,
        extra: { ...prev.extra, [key]: value },
      }));
      syncRouteAndParams(
        undefined,
        {
          [`${prefix}${key}`]: value === 'all' || !value ? null : value,
          [pageKey]: 1,
        },
        false
      );
    },
    [prefix, pageKey]
  );

  const resetFilters = useCallback(() => {
    const cleanUpdates: Record<string, string | number | null> = {
      [searchKey]: null,
      [statusKey]: null,
      [pageKey]: 1,
      [pageSizeKey]: 10,
    };
    if (options.defaultExtra) {
      Object.keys(options.defaultExtra).forEach((k) => {
        cleanUpdates[`${prefix}${k}`] = null;
      });
    }
    syncRouteAndParams(undefined, cleanUpdates, false);
    setState({
      page: 1,
      pageSize: 10,
      search: '',
      status: 'all',
      extra: options.defaultExtra || {},
    });
  }, [searchKey, statusKey, pageKey, pageSizeKey, options.defaultExtra, prefix]);

  return {
    page: state.page,
    pageSize: Math.max(10, state.pageSize),
    search: state.search,
    status: state.status,
    extra: state.extra,
    setPage,
    setSearch,
    setStatus,
    setExtra,
    resetFilters,
  };
}
