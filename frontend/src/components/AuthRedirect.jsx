import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthRedirect({ mode }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('auth', mode);
    navigate(`/?${params.toString()}`, { replace: true });
  }, [mode, navigate, searchParams]);

  return null;
}

