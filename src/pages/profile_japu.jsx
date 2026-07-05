import ProfileEditor from '../components/ProfileEditor'
import { receiverNavItems } from '../utils/app'

export default function ProfileJapu() {
  return (
    <ProfileEditor
      theme="receiver"
      navItems={receiverNavItems}
      title="Japu profile"
      subtitle="Update your details and keep your cozy space personal."
    />
  )
}
