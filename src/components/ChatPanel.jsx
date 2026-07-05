import { useMemo, useState } from 'react'
import { formatTinyTime } from '../utils/app'
import { sendMessage, useCurrentUser, useMessages } from '../utils/storage'

export default function ChatPanel({
  theme = 'sender',
  title = 'Live chat',
  subtitle = 'Messages update instantly for both Pinky and Japu.',
}) {
  const currentUser = useCurrentUser()
  const messages = useMessages()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)

  const emptyState = useMemo(() => {
    return theme === 'sender'
      ? 'Send a sweet note here and Japu will see it instantly.'
      : 'Pinky messages will appear here live as soon as they are sent.'
  }, [theme])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!draft.trim()) {
      setError('Type a message first.')
      return
    }

    setError('')
    setIsSending(true)

    try {
      await sendMessage({
        text: draft,
        senderRole: currentUser?.role || theme,
        senderName: currentUser?.name || (theme === 'sender' ? 'Pinky' : 'Japu'),
      })
      setDraft('')
    } catch (sendError) {
      setError(sendError.message || 'Could not send your message.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="panel-card chat-card">
      <div className="panel-title-row">
        <div>
          <h3>{title}</h3>
          <p className="helper-text">{subtitle}</p>
        </div>
        <span className="panel-chip">Live</span>
      </div>

      <div className="chat-list">
        {messages.length ? (
          messages.map((message) => {
            const isOwnMessage = message.senderRole === currentUser?.role

            return (
              <div key={message.id} className={`message-row ${isOwnMessage ? 'own' : ''}`}>
                <article className={`message-bubble ${isOwnMessage ? 'own' : ''}`}>
                  <small>{message.senderName}</small>
                  <p>{message.text}</p>
                  <span>{message.createdAt ? formatTinyTime(message.createdAt) : 'Sending...'}</span>
                </article>
              </div>
            )
          })
        ) : (
          <p className="helper-text">{emptyState}</p>
        )}
      </div>

      <form className="chat-composer" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={theme === 'sender' ? 'Send Japu a little note...' : 'Reply to Pinky here...'}
        />
        <button
          className={`send-fab ${theme === 'receiver' ? 'receiver' : ''}`}
          type="submit"
          aria-label="Send message"
          disabled={isSending}
        >
          ↑
        </button>
      </form>

      {error ? <p className="form-error">{error}</p> : null}
    </section>
  )
}
