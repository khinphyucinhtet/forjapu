import ProfileEditor from '../components/ProfileEditor'
import { receiverNavItems } from '../utils/app'

export default function ProfileJapu() {
  return (
    <ProfileEditor
      theme="receiver"
      navItems={receiverNavItems}
      title="Japu profile"
      subtitle="Set the display name Japu sees across this shared reminder space."
    />
  )
}
