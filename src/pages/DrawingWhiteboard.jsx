import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import WhiteboardStudio from '../components/WhiteboardStudio'
import { senderNavItems } from '../utils/app'

export default function DrawingWhiteboard() {
  return (
    <div className="page-shell theme-sender">
      <div className="phone-shell">
        <AppHeader
          title="Whiteboard studio"
          subtitle="Draw, stamp stickers, and leave a sweet update."
          theme="sender"
        />

        <main className="page-content">
          <WhiteboardStudio
            theme="sender"
            saveLabel="Save"
            sendLabel="Send"
            savedMessage="Whiteboard saved softly."
            sentMessage="Sent. Japu will get your whiteboard surprise."
          />
        </main>

        <BottomNav items={senderNavItems} />
      </div>
    </div>
  )
}
