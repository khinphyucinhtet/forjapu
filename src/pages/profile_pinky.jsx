import ProfileEditor from '../components/ProfileEditor'
import { senderNavItems } from '../utils/app'

export default function ProfilePinky() {
  return (
    <ProfileEditor
      theme="sender"
      navItems={senderNavItems}
      title="Pinky profile"
      subtitle="Set the display name Pinky uses inside this shared reminder space."
    />
  )
}
