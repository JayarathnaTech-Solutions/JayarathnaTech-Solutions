import { type ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../firebase/config'

export function RequireAuth({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setChecked(true)
    })
  }, [])

  if (!checked) return null
  if (!user) return <Navigate to="/admin/login" replace />

  return children
}
