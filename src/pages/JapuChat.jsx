import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import ChatPanel from '../components/ChatPanel'
import { receiverNavItems } from '../utils/app'

export default function JapuChat() {
  return (
    <div className="page-shell theme-receiver">
      <div className="phone-shell">
        <AppHeader
          title="Messages"
          subtitle="Reply live and keep the reminder space warm."
          theme="receiver"
        />

        <main className="page-content">
          <ChatPanel
            theme="receiver"
            title="Japu chat"
            subtitle="Pinky sees these messages instantly too."
          />
        </main>

        <BottomNav items={receiverNavItems} />
      </div>
    </div>
  )
}
