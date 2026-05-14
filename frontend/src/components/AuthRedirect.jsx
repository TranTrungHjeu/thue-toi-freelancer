"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthRedirect({ mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('auth', mode);
    router.replace(`/?${params.toString()}`);
  }, [mode, router, searchParams]);

  return null;
}
