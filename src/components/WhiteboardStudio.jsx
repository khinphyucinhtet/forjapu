import { useEffect, useRef, useState } from 'react'
import { saveWhiteboardData, useCurrentUser, useWhiteboardData } from '../utils/storage'

const palette = ['#241B3A', '#6C3CD9', '#8457EB', '#F47AB5', '#FF7D9F', '#FFA84D', '#3AAE8D', '#4AA3A2']
const brushSizes = [2, 4, 6, 8, 12, 16]
const textSizes = [18, 24, 30, 38, 46, 56, 64, 72]
const stickerPacks = [
  { section: 'Popular', label: 'Love', stickers: ['💗', '💜', '💖', '♡', '✨', '🌙'] },
  { section: 'Popular', label: 'Reacts', stickers: ['😍', '🥹', '😘', '😚', '🥰', '😌'] },
  { section: 'Popular', label: 'Chat', stickers: ['💬', '🗨️', '❣️', '‼️', '❓', '📌'] },
  { section: 'Cute', label: 'Cute', stickers: ['🐰', '🦕', '🐱', '🐻', '🧸', '🎀'] },
  { section: 'Cute', label: 'Pets', stickers: ['🐶', '🐹', '🐼', '🐥', '🐸', '🦊'] },
  { section: 'Cute', label: 'Faces', stickers: ['😊', '😋', '😴', '🤭', '🥺', '😇'] },
  { section: 'Mood', label: 'Happy', stickers: ['🌈', '⭐', '☀️', '🫶', '🎉', '💫'] },
  { section: 'Mood', label: 'Cozy', stickers: ['☁️', '🛏️', '🕯️', '🫖', '📖', '🧦'] },
  { section: 'Mood', label: 'Sleepy', stickers: ['🌙', '😪', '💤', '🛌', '🌌', '🐑'] },
  { section: 'Decor', label: 'Garden', stickers: ['🌷', '🌸', '🪴', '🍀', '🦋', '🌺'] },
  { section: 'Decor', label: 'Sparkles', stickers: ['✨', '💫', '⭐', '🌟', '🔮', '🪄'] },
  { section: 'Decor', label: 'Party', stickers: ['🎊', '🎉', '🎈', '🪩', '🎵', '🎶'] },
  { section: 'Food', label: 'Treats', stickers: ['🍓', '🧁', '🍩', '🍪', '🧃', '🍵'] },
  { section: 'Food', label: 'Meals', stickers: ['🍙', '🍜', '🍱', '🍔', '🍟', '🥪'] },
  { section: 'Food', label: 'Drinks', stickers: ['☕', '🧋', '🥤', '🍼', '🍹', '💧'] },
  { section: 'Daily', label: 'Wellness', stickers: ['💊', '🩺', '💧', '🪥', '🧘', '🚶'] },
  { section: 'Daily', label: 'Study', stickers: ['📝', '📚', '📒', '✏️', '📎', '🧠'] },
  { section: 'Daily', label: 'Travel', stickers: ['🚗', '🚌', '✈️', '🧳', '🏠', '🗺️'] },
]

export default function WhiteboardStudio({
  theme = 'sender',
  saveLabel = 'Save',
  sendLabel = 'Send',
  savedMessage = 'Whiteboard saved.',
  sentMessage = 'Whiteboard sent.',
  embedded = false,
}) {
  const currentUser = useCurrentUser()
  const whiteboardData = useWhiteboardData()
  const canvasRef = useRef(null)
  const canvasHostRef = useRef(null)
  const isDrawingRef = useRef(false)
  const historyRef = useRef([whiteboardData.drawing || ''])
  const latestSnapshotRef = useRef(whiteboardData.drawing || '')
  const renderTokenRef = useRef(0)

  const [drawingSnapshot, setDrawingSnapshot] = useState(whiteboardData.drawing || '')
  const [tool, setTool] = useState('draw')
  const [activePanel, setActivePanel] = useState('brush')
  const [color, setColor] = useState(palette[0])
  const [brushSize, setBrushSize] = useState(brushSizes[3])
  const [textSize, setTextSize] = useState(textSizes[2])
  const [selectedPack, setSelectedPack] = useState(0)
  const [selectedSticker, setSelectedSticker] = useState(stickerPacks[0].stickers[0])
  const [stampText, setStampText] = useState('Thinking of you')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const canvasBackground = theme === 'sender' ? '#fffafc' : '#fbf8ff'
  const activeStickers = stickerPacks[selectedPack].stickers
  const stickerSections = stickerPacks.reduce((sections, pack, index) => {
    const existingSection = sections.find((section) => section.title === pack.section)

    if (existingSection) {
      existingSection.packs.push({ ...pack, index })
      return sections
    }

    return [...sections, { title: pack.section, packs: [{ ...pack, index }] }]
  }, [])

  function getToolPanel(currentTool) {
    if (currentTool === 'draw' || currentTool === 'eraser') {
      return 'brush'
    }

    if (currentTool === 'sticker') {
      return 'stickers'
    }

    return 'text'
  }

  function paintCanvasBackground(context, width, height) {
    context.fillStyle = canvasBackground
    context.fillRect(0, 0, width, height)

    context.save()
    context.globalAlpha = 0.22
    context.fillStyle = theme === 'sender' ? '#ffe9f5' : '#efe7ff'
    context.beginPath()
    context.arc(width - 38, 44, 44, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }

  function renderSnapshotToCanvas(snapshot) {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const renderToken = ++renderTokenRef.current

    paintCanvasBackground(context, width, height)

    if (!snapshot) {
      return
    }

    const image = new Image()
    image.onload = () => {
      if (renderToken !== renderTokenRef.current) {
        return
      }

      context.drawImage(image, 0, 0, width, height)
    }
    image.src = snapshot
  }

  useEffect(() => {
    latestSnapshotRef.current = drawingSnapshot
  }, [drawingSnapshot])

  useEffect(() => {
    setDrawingSnapshot(whiteboardData.drawing || '')
    historyRef.current = [whiteboardData.drawing || '']
  }, [whiteboardData.drawing, whiteboardData.updatedAt])

  useEffect(() => {
    if (!activeStickers.includes(selectedSticker)) {
      setSelectedSticker(activeStickers[0])
    }
  }, [activeStickers, selectedSticker])

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvasHostRef.current

    if (!canvas || !host) {
      return undefined
    }

    function resizeCanvas() {
      const devicePixelRatio = window.devicePixelRatio || 1
      const hostWidth = host.clientWidth
      const nextWidth = Math.max(Math.floor(hostWidth), 240)
      const nextHeight = Math.max(Math.floor(nextWidth * 0.98), 320)

      canvas.width = Math.floor(nextWidth * devicePixelRatio)
      canvas.height = Math.floor(nextHeight * devicePixelRatio)
      canvas.style.width = `${nextWidth}px`
      canvas.style.height = `${nextHeight}px`

      const context = canvas.getContext('2d')
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      renderSnapshotToCanvas(latestSnapshotRef.current)
    }

    resizeCanvas()

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
    })

    resizeObserver.observe(host)

    return () => {
      resizeObserver.disconnect()
    }
  }, [canvasBackground, theme])

  useEffect(() => {
    renderSnapshotToCanvas(drawingSnapshot)
  }, [drawingSnapshot])

  function getCanvasPosition(event) {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  function pushHistory(snapshot) {
    const previous = historyRef.current[historyRef.current.length - 1]

    if (previous === snapshot) {
      return
    }

    historyRef.current = [...historyRef.current.slice(-39), snapshot]
  }

  function commitCanvas() {
    const snapshot = canvasRef.current.toDataURL('image/png')
    setDrawingSnapshot(snapshot)
    pushHistory(snapshot)
  }

  function startDrawing(event) {
    if (tool !== 'draw' && tool !== 'eraser') {
      return
    }

    const context = canvasRef.current.getContext('2d')
    const { x, y } = getCanvasPosition(event)

    isDrawingRef.current = true
    context.beginPath()
    context.moveTo(x, y)
    context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    context.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color
    context.lineWidth = brushSize
    event.preventDefault()
  }

  function draw(event) {
    if (!isDrawingRef.current || (tool !== 'draw' && tool !== 'eraser')) {
      return
    }

    const context = canvasRef.current.getContext('2d')
    const { x, y } = getCanvasPosition(event)

    context.lineTo(x, y)
    context.stroke()
    event.preventDefault()
  }

  function endDrawing() {
    if (!isDrawingRef.current) {
      return
    }

    isDrawingRef.current = false
    const context = canvasRef.current.getContext('2d')
    context.globalCompositeOperation = 'source-over'
    commitCanvas()
  }

  function placeSticker(x, y) {
    const context = canvasRef.current.getContext('2d')

    context.save()
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = `${textSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`
    context.fillText(selectedSticker, x, y)
    context.restore()

    commitCanvas()
  }

  function placeText(x, y) {
    const trimmedText = stampText.trim()

    if (!trimmedText) {
      return
    }

    const context = canvasRef.current.getContext('2d')
    const lines = trimmedText.split('\n').slice(0, 3)
    const lineHeight = Math.max(18, textSize - 2)

    context.save()
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = color
    context.font = `700 ${lineHeight}px "Baloo 2", cursive`
    lines.forEach((line, index) => {
      const offset = (index - (lines.length - 1) / 2) * (lineHeight + 4)
      context.fillText(line, x, y + offset)
    })
    context.restore()

    commitCanvas()
  }

  function handleCanvasPointerDown(event) {
    if (tool === 'draw') {
      startDrawing(event)
      return
    }

    const { x, y } = getCanvasPosition(event)

    if (tool === 'sticker') {
      placeSticker(x, y)
    }

    if (tool === 'text') {
      placeText(x, y)
    }

    event.preventDefault()
  }

  function clearCanvas() {
    isDrawingRef.current = false
    setDrawingSnapshot('')
    pushHistory('')
  }

  function undoLastChange() {
    if (historyRef.current.length <= 1) {
      return
    }

    historyRef.current = historyRef.current.slice(0, -1)
    const previousSnapshot = historyRef.current[historyRef.current.length - 1]
    setDrawingSnapshot(previousSnapshot)
  }

  async function handleSaveWhiteboard() {
    try {
      await saveWhiteboardData({ drawing: drawingSnapshot })
      setError('')
      setFeedback(savedMessage)
    } catch (saveError) {
      setFeedback('')
      setError(saveError.message)
    }
  }

  async function handleSendWhiteboard() {
    const senderRole = currentUser?.role || (theme === 'sender' ? 'pinky' : 'japu')
    const senderName = currentUser?.name || (theme === 'sender' ? 'Pinky' : 'Japu')

    try {
      await saveWhiteboardData({
        drawing: drawingSnapshot,
        lastSentAt: new Date().toISOString(),
        lastSentBy: senderRole,
        lastSentByName: senderName,
        sendCount: (whiteboardData.sendCount || 0) + 1,
      })
      setError('')
      setFeedback(sentMessage)
    } catch (sendError) {
      setFeedback('')
      setError(sendError.message)
    }
  }

  function renderPanel() {
    if (activePanel === 'color') {
      return (
        <div className="whiteboard-popover">
          <span className="whiteboard-popover-title">Text / brush color</span>
          <div className="palette-row dense">
            {palette.map((paletteColor) => (
              <button
                key={paletteColor}
                className={`palette-dot ${color === paletteColor ? 'active' : ''}`}
                style={{ backgroundColor: paletteColor }}
                onClick={() => setColor(paletteColor)}
                aria-label={`Use color ${paletteColor}`}
              />
            ))}
          </div>
        </div>
      )
    }

    if (activePanel === 'brush') {
      return (
        <div className="whiteboard-popover">
          <span className="whiteboard-popover-title">Brush thickness</span>
          <div className="whiteboard-chip-row">
            {brushSizes.map((size) => (
              <button
                key={size}
                className={`size-chip ${brushSize === size ? 'active' : ''}`}
                onClick={() => setBrushSize(size)}
              >
                {size}px
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (activePanel === 'stickers') {
      return (
        <div className="whiteboard-popover">
          <span className="whiteboard-popover-title">Sticker packs</span>
          <div className="sticker-section-stack">
            {stickerSections.map((section) => (
              <div key={section.title} className="sticker-pack-section">
                <span className="whiteboard-popover-subtitle">{section.title}</span>
                <div className="whiteboard-chip-row">
                  {section.packs.map((pack) => (
                    <button
                      key={`${section.title}-${pack.label}`}
                      className={`tool-chip ${selectedPack === pack.index ? 'active' : ''}`}
                      onClick={() => {
                        setTool('sticker')
                        setSelectedPack(pack.index)
                      }}
                    >
                      {pack.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="whiteboard-sticker-grid">
            {activeStickers.map((sticker) => (
              <button
                key={sticker}
                className={`sticker-chip ${selectedSticker === sticker ? 'active' : ''}`}
                onClick={() => {
                  setTool('sticker')
                  setSelectedSticker(sticker)
                }}
              >
                {sticker}
              </button>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="whiteboard-popover">
        <span className="whiteboard-popover-title">Text size</span>
        <div className="whiteboard-chip-row">
          {textSizes.map((size) => (
            <button
              key={size}
              className={`size-chip ${textSize === size ? 'active' : ''}`}
              onClick={() => setTextSize(size)}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>
    )
  }

  const content = (
    <div className="whiteboard-studio">
      <div ref={canvasHostRef} className="drawing-canvas-host studio-host">
        {tool === 'text' ? (
          <div className="whiteboard-floating-textbox-shell">
            <textarea
              className="whiteboard-floating-textbox"
              value={stampText}
              onChange={(event) => setStampText(event.target.value)}
              rows={2}
              placeholder="Type here, then tap the board."
            />
          </div>
        ) : null}
        <canvas
          ref={canvasRef}
          className="drawing-canvas studio-canvas"
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={draw}
          onPointerUp={endDrawing}
          onPointerLeave={endDrawing}
        />
      </div>

      <div className="whiteboard-toolbar">
        <button
          className={`toolbar-button ${tool === 'draw' ? 'active' : ''}`}
          aria-label="Brush"
          onClick={() => {
            setTool('draw')
            setActivePanel('brush')
          }}
        >
          ✎
        </button>
        <button
          className={`toolbar-button ${tool === 'text' ? 'active' : ''}`}
          aria-label="Text"
          onClick={() => {
            setTool('text')
            setActivePanel('text')
          }}
        >
          T
        </button>
        <button
          className={`toolbar-button ${tool === 'sticker' ? 'active' : ''}`}
          aria-label="Sticker"
          onClick={() => {
            setTool('sticker')
            setActivePanel('stickers')
          }}
        >
          ✨
        </button>
        <button
          className={`toolbar-button ${activePanel === 'color' ? 'active' : ''}`}
          aria-label="Color"
          onClick={() => setActivePanel(activePanel === 'color' ? getToolPanel(tool) : 'color')}
        >
          🖍
        </button>
        <button
          className={`toolbar-button ${tool === 'eraser' ? 'active' : ''}`}
          aria-label="Eraser"
          onClick={() => {
            setTool('eraser')
            setActivePanel('brush')
          }}
        >
          ⌫
        </button>
      </div>

      {renderPanel()}

      <div className="whiteboard-action-bar">
        <button className="secondary-button" onClick={undoLastChange}>
          Undo
        </button>
        <button className="secondary-button" onClick={clearCanvas}>
          Clear
        </button>
        <button className="secondary-button" onClick={() => void handleSaveWhiteboard()}>
          {saveLabel}
        </button>
        <button className="primary-button" onClick={() => void handleSendWhiteboard()}>
          {sendLabel}
        </button>
      </div>

      {feedback ? <p className="form-info">{feedback}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  )

  if (embedded) {
    return content
  }

  return <section className="panel-card">{content}</section>
}
