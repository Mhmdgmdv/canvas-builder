import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { CanvasNode } from '../models/canvasNode'
import type { CanvasPageSize } from '../services/CanvasPageLayout'
import { getCanvasNodeLayoutStyle } from '../services/CanvasNodeLayout'
import { CanvasNodeChildren } from './CanvasNodeChildren'

type CanvasStageProps = {
  nodes: CanvasNode[]
  selectedNodeId: string | null
  stageRef: RefObject<HTMLDivElement | null>
  pageSize: CanvasPageSize
  onRootNodePointerDown: (node: CanvasNode, event: ReactPointerEvent<HTMLDivElement>) => void
  onChildNodePointerDown: (
    node: CanvasNode,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void
}

export function CanvasStage({
  nodes,
  selectedNodeId,
  stageRef,
  pageSize,
  onRootNodePointerDown,
  onChildNodePointerDown,
}: CanvasStageProps) {
  return (
    <div
      className="canvas-stage"
      ref={stageRef}
      style={{ width: pageSize.width, height: pageSize.height }}
    >
      {nodes.length === 0 && (
        <div className="empty-state">
          Start by picking a component and place it on the canvas.
        </div>
      )}

      {nodes.map((node) => (
        <div
          key={node.id}
          className={`canvas-node ${selectedNodeId === node.id ? 'is-selected' : ''}`}
          style={{
            left: node.editor.x,
            top: node.editor.y,
            width: node.editor.width,
            height: node.editor.height,
            transform: `rotate(${node.editor.rotation ?? 0}deg) scale(${node.editor.scale ?? 1})`,
            transformOrigin: 'center center',
          }}
          id={node.id}
          onPointerDown={(event) => onRootNodePointerDown(node, event)}
        >
          <div
            className={node.styles.classes}
            style={{
              width: '100%',
              height: '100%',
              ...getCanvasNodeLayoutStyle(node.layout),
            }}
          >
            <CanvasNodeChildren
              nodes={node.children}
              selectedNodeId={selectedNodeId}
              onNodePointerDown={onChildNodePointerDown}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
