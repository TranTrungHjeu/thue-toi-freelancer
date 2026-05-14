"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import Spinner from './common/Spinner';

export default function ClientRouteGuard({ children, adminOnly = false }) {
  const { isAuthenticated, isAuthLoaded, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (!isAuthLoaded) return;

    if (!isAuthenticated) {
      const qs = searchParams.toString();
      const currentPath = encodeURIComponent(`${pathname}${qs ? `?${qs}` : ''}`);
      router.replace(`/?auth=login&redirect=${currentPath}`);
      return;
    }

    if (adminOnly && user?.role?.toLowerCase() !== 'admin') {
      router.replace('/workspace');
      return;
    }

    setIsAllowed(true);
  }, [isAuthenticated, isAuthLoaded, adminOnly, user, router, pathname, searchParams]);

  if (!isAuthLoaded || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return children;
}
