import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import ChatPanel from '../components/ChatPanel'
import { senderNavItems } from '../utils/app'

export default function PinkyChat() {
  return (
    <div className="page-shell theme-sender">
      <div className="phone-shell">
        <AppHeader
          title="Messages"
          subtitle="Send live little updates to Japu."
          theme="sender"
        />

        <main className="page-content">
          <ChatPanel
            theme="sender"
            title="Pinky chat"
            subtitle="Everything sent here appears live for Japu."
          />
        </main>

        <BottomNav items={senderNavItems} />
      </div>
    </div>
  )
}
