import { useCurrentUser } from '../utils/storage'

export function useAuthorizedUser() {
  return useCurrentUser()
}
