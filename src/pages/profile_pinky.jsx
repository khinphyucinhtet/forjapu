import ProfileEditor from '../components/ProfileEditor'
import { senderNavItems } from '../utils/app'

export default function ProfilePinky() {
  return (
    <ProfileEditor
      theme="sender"
      navItems={senderNavItems}
      title="Pinky profile"
      subtitle="Edit your full name, username, email, and password."
    />
  )
}
