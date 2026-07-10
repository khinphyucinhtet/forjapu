import { useEffect, useRef, useState } from 'react'
import { formatTimestamp } from '../utils/app'
import {
  createWhiteboardObject,
  deleteWhiteboardObject,
  saveWhiteboardData,
  sendWhiteboardData,
  useCurrentUser,
  useWhiteboardData,
} from '../utils/storage'

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

function generateObjectId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `wb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function getObjectSortValue(object) {
  if (object.createdAt) {
    return new Date(object.createdAt).getTime()
  }

  return Number(object.clientCreatedAtMs || 0)
}

function mergeWhiteboardObjects(remoteObjects, optimisticObjects, hiddenIds) {
  const objectMap = new Map()

  remoteObjects.forEach((object) => {
    objectMap.set(object.id, object)
  })

  optimisticObjects.forEach((object) => {
    objectMap.set(object.id, object)
  })

  return Array.from(objectMap.values())
    .filter((object) => !object.isDeleted && !hiddenIds.has(object.id))
    .sort((left, right) => {
      const timeDifference = getObjectSortValue(left) - getObjectSortValue(right)

      if (timeDifference !== 0) {
        return timeDifference
      }

      return left.id.localeCompare(right.id)
    })
}

function getToolPanel(currentTool) {
  if (currentTool === 'draw' || currentTool === 'eraser') {
    return 'brush'
  }

  if (currentTool === 'sticker') {
    return 'stickers'
  }

  return 'text'
}

function paintCanvasBackground(context, width, height, theme) {
  const canvasBackground = theme === 'sender' ? '#fffafc' : '#fbf8ff'
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

function renderPathObject(context, object) {
  const points = object.data?.points || []

  if (!points.length) {
    return
  }

  context.save()
  context.globalCompositeOperation = object.data?.mode === 'erase' ? 'destination-out' : 'source-over'
  context.strokeStyle = object.data?.color || '#241B3A'
  context.lineWidth = Number(object.data?.size || 6)
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.beginPath()
  context.moveTo(points[0].x, points[0].y)
  points.slice(1).forEach((point) => {
    context.lineTo(point.x, point.y)
  })
  context.stroke()
  context.restore()
}

function renderTextObject(context, object) {
  const lines = String(object.data?.text || '')
    .split('\n')
    .filter(Boolean)
    .slice(0, 3)

  if (!lines.length) {
    return
  }

  const fontSize = Number(object.data?.size || 30)
  const lineHeight = Math.max(18, fontSize - 2)

  context.save()
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = object.data?.color || '#241B3A'
  context.font = `700 ${lineHeight}px "Baloo 2", cursive`
  lines.forEach((line, index) => {
    const offset = (index - (lines.length - 1) / 2) * (lineHeight + 4)
    context.fillText(line, Number(object.data?.x || 0), Number(object.data?.y || 0) + offset)
  })
  context.restore()
}

function renderStickerObject(context, object) {
  context.save()
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = `${Number(object.data?.size || 30)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`
  context.fillText(String(object.data?.sticker || '✨'), Number(object.data?.x || 0), Number(object.data?.y || 0))
  context.restore()
}

function renderWhiteboardObjects(context, width, height, objects, theme) {
  paintCanvasBackground(context, width, height, theme)

  objects.forEach((object) => {
    if (object.type === 'clear') {
      paintCanvasBackground(context, width, height, theme)
      return
    }

    if (object.type === 'path') {
      renderPathObject(context, object)
      return
    }

    if (object.type === 'text') {
      renderTextObject(context, object)
      return
    }

    if (object.type === 'sticker') {
      renderStickerObject(context, object)
    }
  })
}

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
  const currentStrokeRef = useRef([])
  const renderTokenRef = useRef(0)
  const actionHistoryRef = useRef([])

  const [optimisticObjects, setOptimisticObjects] = useState([])
  const [hiddenObjectIds, setHiddenObjectIds] = useState(new Set())
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
  const [pendingWrites, setPendingWrites] = useState(0)
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [isReconnecting, setIsReconnecting] = useState(false)

  const activeStickers = stickerPacks[selectedPack].stickers
  const stickerSections = stickerPacks.reduce((sections, pack, index) => {
    const existingSection = sections.find((section) => section.title === pack.section)

    if (existingSection) {
      existingSection.packs.push({ ...pack, index })
      return sections
    }

    return [...sections, { title: pack.section, packs: [{ ...pack, index }] }]
  }, [])
  const mergedObjects = mergeWhiteboardObjects(whiteboardData.objects || [], optimisticObjects, hiddenObjectIds)
  const currentStatus = !isOnline
    ? 'Offline'
    : isReconnecting
      ? 'Reconnecting...'
      : pendingWrites > 0
        ? 'Saving...'
        : whiteboardData.updatedAt
          ? 'Saved'
          : 'Live'
  const lastUpdatedLabel =
    whiteboardData.updatedAt && whiteboardData.updatedByName
      ? `Last updated by ${whiteboardData.updatedByName} at ${formatTimestamp(whiteboardData.updatedAt)}`
      : 'Live sync is ready for both Pinky and Japu.'

  useEffect(() => {
    setOptimisticObjects((current) =>
      current.filter(
        (optimisticObject) =>
          !whiteboardData.objects?.some(
            (remoteObject) => remoteObject.id === optimisticObject.id && remoteObject.version >= optimisticObject.version,
          ),
      ),
    )
  }, [whiteboardData.objects])

  useEffect(() => {
    setHiddenObjectIds((current) => {
      const nextIds = new Set(current)
      let didChange = false

      whiteboardData.objects?.forEach((remoteObject) => {
        if (remoteObject.isDeleted && nextIds.has(remoteObject.id)) {
          nextIds.delete(remoteObject.id)
          didChange = true
        }
      })

      return didChange ? nextIds : current
    })
  }, [whiteboardData.objects])

  useEffect(() => {
    if (!activeStickers.includes(selectedSticker)) {
      setSelectedSticker(activeStickers[0])
    }
  }, [activeStickers, selectedSticker])

  useEffect(() => {
    function handleOffline() {
      setIsOnline(false)
      setIsReconnecting(false)
    }

    function handleOnline() {
      setIsOnline(true)
      setIsReconnecting(true)
      window.setTimeout(() => {
        setIsReconnecting(false)
      }, 1200)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

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
      renderWhiteboardObjects(context, nextWidth, nextHeight, mergedObjects, theme)
    }

    resizeCanvas()

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
    })

    resizeObserver.observe(host)

    return () => {
      resizeObserver.disconnect()
    }
  }, [mergedObjects, theme])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const renderToken = ++renderTokenRef.current

    window.requestAnimationFrame(() => {
      if (renderToken !== renderTokenRef.current) {
        return
      }

      renderWhiteboardObjects(context, width, height, mergedObjects, theme)
    })
  }, [mergedObjects, theme])

  function getCanvasPosition(event) {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  async function persistObject(nextObject, successMessage) {
    setError('')
    setFeedback('')
    setPendingWrites((value) => value + 1)
    setOptimisticObjects((current) => [...current, nextObject])

    try {
      await createWhiteboardObject(nextObject)
      actionHistoryRef.current = [...actionHistoryRef.current.slice(-39), nextObject.id]
      setFeedback(successMessage)
    } catch (saveError) {
      setOptimisticObjects((current) => current.filter((object) => object.id !== nextObject.id))
      setError(saveError.message)
    } finally {
      setPendingWrites((value) => Math.max(value - 1, 0))
    }
  }

  function startDrawing(event) {
    if (tool !== 'draw' && tool !== 'eraser') {
      return
    }

    const { x, y } = getCanvasPosition(event)
    isDrawingRef.current = true
    currentStrokeRef.current = [{ x, y }]
    event.preventDefault()
  }

  function draw(event) {
    if (!isDrawingRef.current || (tool !== 'draw' && tool !== 'eraser')) {
      return
    }

    const { x, y } = getCanvasPosition(event)
    currentStrokeRef.current = [...currentStrokeRef.current, { x, y }]
    event.preventDefault()

    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    renderWhiteboardObjects(context, canvas.clientWidth, canvas.clientHeight, mergedObjects, theme)
    renderPathObject(context, {
      data: {
        points: currentStrokeRef.current,
        color,
        size: brushSize,
        mode: tool === 'eraser' ? 'erase' : 'draw',
      },
    })
  }

  async function endDrawing() {
    if (!isDrawingRef.current) {
      return
    }

    isDrawingRef.current = false

    if (currentStrokeRef.current.length < 2) {
      currentStrokeRef.current = []
      return
    }

    const nextObject = {
      id: generateObjectId(),
      type: 'path',
      data: {
        points: currentStrokeRef.current,
        color,
        size: brushSize,
        mode: tool === 'eraser' ? 'erase' : 'draw',
      },
      clientCreatedAtMs: Date.now(),
      version: 1,
      isDeleted: false,
    }

    currentStrokeRef.current = []
    await persistObject(nextObject, savedMessage)
  }

  async function placeSticker(x, y) {
    const nextObject = {
      id: generateObjectId(),
      type: 'sticker',
      data: {
        x,
        y,
        sticker: selectedSticker,
        size: textSize,
      },
      clientCreatedAtMs: Date.now(),
      version: 1,
      isDeleted: false,
    }

    await persistObject(nextObject, savedMessage)
  }

  async function placeText(x, y) {
    const trimmedText = stampText.trim()

    if (!trimmedText) {
      setError('Type a short message first.')
      return
    }

    const nextObject = {
      id: generateObjectId(),
      type: 'text',
      data: {
        x,
        y,
        text: trimmedText,
        color,
        size: textSize,
      },
      clientCreatedAtMs: Date.now(),
      version: 1,
      isDeleted: false,
    }

    await persistObject(nextObject, savedMessage)
  }

  async function handleCanvasPointerDown(event) {
    if (tool === 'draw' || tool === 'eraser') {
      startDrawing(event)
      return
    }

    const { x, y } = getCanvasPosition(event)

    if (tool === 'sticker') {
      await placeSticker(x, y)
    }

    if (tool === 'text') {
      await placeText(x, y)
    }

    event.preventDefault()
  }

  async function clearCanvas() {
    const nextObject = {
      id: generateObjectId(),
      type: 'clear',
      data: {},
      clientCreatedAtMs: Date.now(),
      version: 1,
      isDeleted: false,
    }

    await persistObject(nextObject, 'Board cleared for both of you.')
  }

  async function undoLastChange() {
    const lastObjectId = actionHistoryRef.current[actionHistoryRef.current.length - 1]
    const lastObject = mergedObjects.find((object) => object.id === lastObjectId)

    if (!lastObject) {
      return
    }

    setPendingWrites((value) => value + 1)
    setHiddenObjectIds((current) => new Set([...current, lastObjectId]))
    setError('')
    setFeedback('')

    try {
      await deleteWhiteboardObject(lastObjectId, lastObject.version)
      actionHistoryRef.current = actionHistoryRef.current.slice(0, -1)
      setFeedback('Last board action removed.')
    } catch (deleteError) {
      setHiddenObjectIds((current) => {
        const nextIds = new Set(current)
        nextIds.delete(lastObjectId)
        return nextIds
      })
      setError(deleteError.message)
    } finally {
      setPendingWrites((value) => Math.max(value - 1, 0))
    }
  }

  async function handleSaveWhiteboard() {
    try {
      await saveWhiteboardData()
      setError('')
      setFeedback('Live sync is already on. Every finished stroke or sticker is saved automatically.')
    } catch (saveError) {
      setFeedback('')
      setError(saveError.message)
    }
  }

  async function handleSendWhiteboard() {
    try {
      await sendWhiteboardData()
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
      <div className="whiteboard-live-status">
        <span className="panel-chip">Live</span>
        <span className={`whiteboard-status-badge whiteboard-status-${currentStatus.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
          {currentStatus}
        </span>
      </div>
      <p className="whiteboard-helper">{lastUpdatedLabel}</p>

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
          onPointerDown={(event) => {
            void handleCanvasPointerDown(event)
          }}
          onPointerMove={draw}
          onPointerUp={() => {
            void endDrawing()
          }}
          onPointerLeave={() => {
            void endDrawing()
          }}
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
        <button className="secondary-button" onClick={() => void undoLastChange()}>
          Undo
        </button>
        <button className="secondary-button" onClick={() => void clearCanvas()}>
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
      {!currentUser ? <p className="form-error">Please sign in as Pinky or Japu to use the shared board.</p> : null}
    </div>
  )

  if (embedded) {
    return content
  }

  return <section className="panel-card">{content}</section>
}
