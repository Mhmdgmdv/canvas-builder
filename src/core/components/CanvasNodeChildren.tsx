import type { ReactNode } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { CanvasNode } from '../models/canvasNode'
import { getCanvasNodeLayoutStyle } from '../services/CanvasNodeLayout'

type CanvasSelectionProps = {
  selectedNodeId: string | null
  onNodePointerDown: (
    node: CanvasNode,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void
}

type CanvasNodeChildrenProps = CanvasSelectionProps & {
  nodes: CanvasNode[]
}

type CanvasElementProps = CanvasSelectionProps & {
  node: CanvasNode
  insideButton?: boolean
}

function renderChildren(
  nodes: CanvasNode[],
  selectedNodeId: string | null,
  onNodePointerDown: CanvasSelectionProps['onNodePointerDown'],
  insideButton = false,
) {
  return nodes.map((child) => (
    <CanvasElement
      key={child.id}
      node={child}
      selectedNodeId={selectedNodeId}
      onNodePointerDown={onNodePointerDown}
      insideButton={insideButton}
    />
  ))
}

function CanvasElement({
  node,
  selectedNodeId,
  onNodePointerDown,
  insideButton = false,
}: CanvasElementProps) {
  const classes = [
    node.styles.classes,
    selectedNodeId === node.id ? 'canvas-node-selected' : '',
  ]
    .filter(Boolean)
    .join(' ')
  let content: ReactNode
  switch (node.type) {
    case 'container':
      content = (
        <div className={classes} style={getCanvasNodeLayoutStyle(node.layout)}>
          {renderChildren(node.children, selectedNodeId, onNodePointerDown)}
        </div>
      )
      break
    case 'text':
      content = insideButton ? (
        <span className={classes} style={getCanvasNodeLayoutStyle(node.layout)}>
          {node.props.text}
        </span>
      ) : (
        <p className={classes} style={getCanvasNodeLayoutStyle(node.layout)}>
          {node.props.text}
        </p>
      )
      break
    case 'button':
      content = (
        <button type="button" className={classes} style={getCanvasNodeLayoutStyle(node.layout)}>
          {node.children.length > 0
            ? renderChildren(node.children, selectedNodeId, onNodePointerDown, true)
            : node.props.text}
        </button>
      )
      break
    case 'header':
      content = (
        <header className={classes} style={getCanvasNodeLayoutStyle(node.layout)}>
          {renderChildren(node.children, selectedNodeId, onNodePointerDown)}
        </header>
      )
      break
    case 'hero':
    case 'section':
      content = (
        <section className={classes} style={getCanvasNodeLayoutStyle(node.layout)}>
          {renderChildren(node.children, selectedNodeId, onNodePointerDown)}
        </section>
      )
      break
    case 'card':
      content = (
        <article className={classes} style={getCanvasNodeLayoutStyle(node.layout)}>
          {renderChildren(node.children, selectedNodeId, onNodePointerDown)}
        </article>
      )
      break
    case 'icon':
      content = (
        <span
          className={classes}
          aria-hidden="true"
          style={getCanvasNodeLayoutStyle(node.layout)}
        >
          {node.props.text}
        </span>
      )
      break
    case 'image':
      content = (
        <div className={classes} role="img" aria-label={node.props.text} style={getCanvasNodeLayoutStyle(node.layout)}>
          {node.props.text}
        </div>
      )
      break
    case 'input':
      content = (
        <input
          className={classes}
          type="text"
          placeholder={node.props.text}
          aria-label={node.props.text}
          readOnly
          style={getCanvasNodeLayoutStyle(node.layout)}
        />
      )
      break
    case 'divider':
      content = <hr className={classes} style={getCanvasNodeLayoutStyle(node.layout)} />
      break
  }

  return (
    <div
      className="canvas-node-frame"
      style={{
        position:
          node.layout.position === 'absolute'
            ? 'absolute'
            : node.editor.x !== undefined || node.editor.y !== undefined
              ? 'relative'
              : undefined,
        left: node.editor.x,
        top: node.editor.y,
        width: node.editor.width,
        height: node.editor.height,
        transform: node.editor.rotation || (node.editor.scale ?? 1) !== 1
          ? `rotate(${node.editor.rotation ?? 0}deg) scale(${node.editor.scale ?? 1})`
          : undefined,
        transformOrigin: 'center center',
      }}
      id={node.id}
      onPointerDown={(event) => onNodePointerDown(node, event)}
      data-canvas-node-id={node.id}
    >
      {content}
      {node.children.length > 0 &&
        !['container', 'button', 'header', 'hero', 'card', 'section'].includes(node.type) &&
        renderChildren(node.children, selectedNodeId, onNodePointerDown)}
    </div>
  )
}

export function CanvasNodeChildren({
  nodes,
  selectedNodeId,
  onNodePointerDown,
}: CanvasNodeChildrenProps) {
  return (
    <div className="canvas-node-children">
      {renderChildren(nodes, selectedNodeId, onNodePointerDown)}
    </div>
  )
}
