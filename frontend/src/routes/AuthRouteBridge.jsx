import { Navigate, useLocation, useSearchParams } from 'react-router-dom';

const buildRedirectPath = (location) => {
  const pathname = location.state?.from?.pathname || '/workspace';
  const search = location.state?.from?.search || '';
  const hash = location.state?.from?.hash || '';
  return `${pathname}${search}${hash}`;
};

const AuthRouteBridge = ({ mode }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const nextSearchParams = new URLSearchParams();

  nextSearchParams.set('auth', mode);

  const email = searchParams.get('email');
  if (email) {
    nextSearchParams.set('email', email);
  }

  const explicitRedirect = searchParams.get('redirect');
  const redirectTo = explicitRedirect || buildRedirectPath(location);
  if (redirectTo && redirectTo !== '/workspace') {
    nextSearchParams.set('redirect', redirectTo);
  }

  return <Navigate to={`/?${nextSearchParams.toString()}`} replace />;
};

export default AuthRouteBridge;
