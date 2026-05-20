import { useSearchParams } from 'react-router-dom'
import AuthRedirect from '../../components/AuthRedirect'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''

  return <AuthRedirect mode="verify" initialEmail={email} />
}

