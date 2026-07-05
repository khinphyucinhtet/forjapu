import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import WhiteboardStudio from '../components/WhiteboardStudio'
import { receiverNavItems } from '../utils/app'

export default function JapuWhiteboard() {
  return (
    <div className="page-shell theme-receiver">
      <div className="phone-shell">
        <AppHeader
          title="Whiteboard"
          subtitle="Draw, decorate, and send your board surprise back."
          theme="receiver"
        />

        <main className="page-content">
          <section className="panel-card">
            <WhiteboardStudio
              embedded
              theme="receiver"
              saveLabel="Save"
              sendLabel="Send"
              savedMessage="Your board was saved."
              sentMessage="Sent. Pinky will see your whiteboard surprise."
            />
          </section>
        </main>

        <BottomNav items={receiverNavItems} />
      </div>
    </div>
  )
}
