import { useEffect, useRef, useState } from 'react'
import './App.css'

type CanvasItemType = 'header' | 'hero' | 'text' | 'button' | 'card'

type CanvasItem = {
  id: number
  type: CanvasItemType
  x: number
  y: number
  width: number
  height: number
}

const componentLibrary = {
  header: {
    label: 'Header',
    width: 560,
    height: 78,
    description: 'Brand + nav links',
  },
  hero: {
    label: 'Hero card',
    width: 520,
    height: 156,
    description: 'Title, copy, actions',
  },
  text: {
    label: 'Text block',
    width: 320,
    height: 110,
    description: 'Paragraph and labels',
  },
  button: {
    label: 'Button',
    width: 180,
    height: 62,
    description: 'Primary CTA',
  },
  card: {
    label: 'Info card',
    width: 260,
    height: 120,
    description: 'Dashboard stats',
  },
} as const

const componentTypes = Object.keys(componentLibrary) as CanvasItemType[]

function CanvasElement({ type }: { type: CanvasItemType }) {
  switch (type) {
    case 'header':
      return (
        <div className="node-header">
          <span className="brand">Northstar</span>
          <nav>
            <span>Home</span>
            <span>Features</span>
            <span>Pricing</span>
          </nav>
          <button type="button">Launch</button>
        </div>
      )
    case 'hero':
      return (
        <div className="node-hero">
          <div>
            <p className="eyebrow">Product launch</p>
            <h3>Build a brand people remember.</h3>
            <p>Turn ideas into polished user experiences.</p>
          </div>
          <div className="cta-row">
            <button type="button">Get started</button>
            <button type="button" className="secondary">
              View demo
            </button>
          </div>
        </div>
      )
    case 'text':
      return (
        <div className="node-text">
          <h4>Section title</h4>
          <p>Describe your value clearly and keep the message easy to scan.</p>
        </div>
      )
    case 'button':
      return (
        <div className="node-button-wrap">
          <button type="button">Primary action</button>
        </div>
      )
    case 'card':
      return (
        <div className="node-card">
          <div className="sparkline" aria-hidden="true" />
          <div>
            <p className="mini-label">Revenue</p>
            <strong>$38.4K</strong>
            <span>+24% this month</span>
          </div>
        </div>
      )
    default:
      return null
  }
}

function App() {
  const [pageName, setPageName] = useState('Landing page')
  const [items, setItems] = useState<CanvasItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{
    id: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const nextId = useRef(1)

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const activeDrag = dragRef.current
      const stage = stageRef.current

      if (!activeDrag || !stage) {
        return
      }

      const stageRect = stage.getBoundingClientRect()
      const deltaX = event.clientX - stageRect.left - activeDrag.startX
      const deltaY = event.clientY - stageRect.top - activeDrag.startY

      setItems((current) =>
        current.map((item) => {
          if (item.id !== activeDrag.id) {
            return item
          }

          const maxX = Math.max(16, stage.clientWidth - item.width - 16)
          const maxY = Math.max(16, stage.clientHeight - item.height - 16)

          return {
            ...item,
            x: Math.min(Math.max(activeDrag.originX + deltaX, 16), maxX),
            y: Math.min(Math.max(activeDrag.originY + deltaY, 16), maxY),
          }
        }),
      )
    }

    const handlePointerUp = () => {
      dragRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  const addComponent = (type: CanvasItemType) => {
    const details = componentLibrary[type]
    const stage = stageRef.current
    const width = stage ? Math.min(details.width, Math.max(200, stage.clientWidth - 32)) : details.width

    const createdItem: CanvasItem = {
      id: nextId.current,
      type,
      x: stage ? Math.min(24 + (items.length % 3) * 52, stage.clientWidth - width - 24) : 24,
      y: stage ? Math.min(24 + (items.length % 4) * 44, stage.clientHeight - details.height - 24) : 24,
      width,
      height: details.height,
    }

    nextId.current += 1
    setItems((current) => [...current, createdItem])
    setSelectedId(createdItem.id)
  }

  const removeSelected = () => {
    if (selectedId === null) {
      return
    }

    setItems((current) => current.filter((item) => item.id !== selectedId))
    setSelectedId(null)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="panel-header">
          <span className="status-pill">Phase 1</span>
        </div>

        <label className="field-group">
          <span>Page name</span>
          <input
            type="text"
            value={pageName}
            onChange={(event) => setPageName(event.target.value || 'Untitled page')}
            placeholder="Landing page"
          />
        </label>

        <div className="component-panel">
          <h2>Components</h2>
          <div className="component-grid">
            {componentTypes.map((type) => (
              <button
                key={type}
                type="button"
                className="component-tile"
                onClick={() => addComponent(type)}
              >
                <span className="tile-name">{componentLibrary[type].label}</span>
                <small>{componentLibrary[type].description}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="action-row">
          <button type="button" className="secondary-button" onClick={() => setItems([])}>
            Clear canvas
          </button>
          <button type="button" className="primary-button" onClick={removeSelected}>
            Delete selected
          </button>
        </div>
      </aside>

      <main className="canvas-panel">
        <header className="canvas-header">
          <div>
            <p>Design board</p>
            <h1>{pageName || 'Untitled page'}</h1>
          </div>
          <span className="counter-badge">{items.length} item(s)</span>
        </header>

        <div className="canvas-stage" ref={stageRef}>
          {items.length === 0 && (
            <div className="empty-state">
              Start by picking a component and place it on the canvas.
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className={`canvas-node ${selectedId === item.id ? 'is-selected' : ''}`}
              style={{
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
              }}
              onPointerDown={(event) => {
                event.preventDefault()
                setSelectedId(item.id)

                const stageRect = stageRef.current?.getBoundingClientRect()
                dragRef.current = {
                  id: item.id,
                  startX: stageRect ? event.clientX - stageRect.left : event.clientX,
                  startY: stageRect ? event.clientY - stageRect.top : event.clientY,
                  originX: item.x,
                  originY: item.y,
                }
              }}
            >
              <CanvasElement type={item.type} />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
