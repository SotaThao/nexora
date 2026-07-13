import { useNavigate } from 'react-router-dom'
import useAuth from '../../auth/useAuth'

export function useBackToDashboard() {
  const navigate = useNavigate()
  const { session, status } = useAuth()

  const canBackToDashboard = status === 'authenticated'

  const handleBackToDashboard = () => {
    if (session?.role === 'staff') {
      navigate('/staff')
      return
    }
    navigate('/dashboard')
  }

  return { canBackToDashboard, handleBackToDashboard }
}
