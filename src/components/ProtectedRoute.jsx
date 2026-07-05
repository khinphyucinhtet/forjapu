import { Navigate } from 'react-router-dom'
import { getRoleHome, useCurrentUser } from '../utils/storage'

export default function ProtectedRoute({ allowedRoles, children }) {
  const currentUser = useCurrentUser()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to={getRoleHome(currentUser.role)} replace />
  }

  return children
}
