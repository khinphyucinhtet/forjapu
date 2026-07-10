import { useCurrentUser } from '../utils/storage'

export function useAuthUser() {
  return useCurrentUser()
}
