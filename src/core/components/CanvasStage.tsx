import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { CanvasItem } from '../models/canvasItem'
import type { CanvasPageSize } from '../services/CanvasPageLayout'
import { CanvasItemContent } from './CanvasItemContent'

type CanvasStageProps = {
  items: CanvasItem[]
  selectedId: number | null
  selectedElementId: number | null
  stageRef: RefObject<HTMLDivElement | null>
  pageSize: CanvasPageSize
  onItemPointerDown: (item: CanvasItem, event: ReactPointerEvent<HTMLDivElement>) => void
  onSelectElement: (itemId: number, elementId: number) => void
}

export function CanvasStage({
  items,
  selectedId,
  selectedElementId,
  stageRef,
  pageSize,
  onItemPointerDown,
  onSelectElement,
}: CanvasStageProps) {
  return (
    <div
      className="canvas-stage"
      ref={stageRef}
      style={{ width: pageSize.width, height: pageSize.height }}
    >
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
            transform: `rotate(${item.rotation}deg)`,
            transformOrigin: 'center center',
          }}
          onPointerDown={(event) => onItemPointerDown(item, event)}
        >
          <div className={item.classes} style={{ width: '100%', height: '100%' }}>
            <CanvasItemContent
              nodes={item.children}
              selectedElementId={selectedId === item.id ? selectedElementId : null}
              onSelectElement={(elementId) => onSelectElement(item.id, elementId)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
