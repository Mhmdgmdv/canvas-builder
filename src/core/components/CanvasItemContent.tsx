import type { ReactNode } from 'react'
import type { CanvasElementNode } from '../models/canvasItem'

type CanvasSelectionProps = {
  selectedElementId: number | null
  onSelectElement: (id: number) => void
}

type CanvasItemContentProps = CanvasSelectionProps & {
  nodes: CanvasElementNode[]
}

type CanvasElementProps = CanvasSelectionProps & {
  node: CanvasElementNode
  insideButton?: boolean
}

function renderChildren(
  nodes: CanvasElementNode[],
  selectedElementId: number | null,
  onSelectElement: (id: number) => void,
  insideButton = false,
) {
  return nodes.map((child) => (
    <CanvasElement
      key={child.id}
      node={child}
      selectedElementId={selectedElementId}
      onSelectElement={onSelectElement}
      insideButton={insideButton}
    />
  ))
}

function CanvasElement({
  node,
  selectedElementId,
  onSelectElement,
  insideButton = false,
}: CanvasElementProps) {
  const classes = [
    node.classes,
    selectedElementId === node.id ? 'canvas-element-selected' : '',
  ]
    .filter(Boolean)
    .join(' ')
  let content: ReactNode
  switch (node.type) {
    case 'container':
      content = <div className={classes}>{renderChildren(node.children, selectedElementId, onSelectElement)}</div>
      break
    case 'text':
      content = insideButton
        ? <span className={classes}>{node.text}</span>
        : <p className={classes}>{node.text}</p>
      break
    case 'button':
      content = (
        <button type="button" className={classes}>
          {node.children.length > 0
            ? renderChildren(node.children, selectedElementId, onSelectElement, true)
            : node.text}
        </button>
      )
      break
    case 'header':
      content = <header className={classes}>{renderChildren(node.children, selectedElementId, onSelectElement)}</header>
      break
    case 'hero':
      content = <section className={classes}>{renderChildren(node.children, selectedElementId, onSelectElement)}</section>
      break
    case 'card':
      content = <article className={classes}>{renderChildren(node.children, selectedElementId, onSelectElement)}</article>
      break
    case 'section':
      content = <section className={classes}>{renderChildren(node.children, selectedElementId, onSelectElement)}</section>
      break
    case 'icon':
      content = (
        <span className={classes} aria-hidden="true">
          {node.text}
        </span>
      )
      break
    case 'image':
      content = (
        <div className={classes} role="img" aria-label={node.text}>
          {node.text}
        </div>
      )
      break
    case 'input':
      content = (
        <input
          className={classes}
          type="text"
          placeholder={node.text}
          aria-label={node.text}
          readOnly
        />
      )
      break
    case 'divider':
      content = <hr className={classes} />
      break
  }

  return (
    <div
      className="canvas-element-frame"
      style={{
        position: node.x !== undefined || node.y !== undefined ? 'relative' : undefined,
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        transform: node.rotation ? `rotate(${node.rotation}deg)` : undefined,
        transformOrigin: 'center center',
      }}
      onPointerDown={() => onSelectElement(node.id)}
      data-canvas-element-id={node.id}
    >
      {content}
      {node.children.length > 0 &&
        !['container', 'button', 'header', 'hero', 'card', 'section'].includes(node.type) &&
        renderChildren(node.children, selectedElementId, onSelectElement)}
    </div>
  )
}

export function CanvasItemContent({
  nodes,
  selectedElementId,
  onSelectElement,
}: CanvasItemContentProps) {
  return (
    <div className="canvas-item-body">
      {renderChildren(nodes, selectedElementId, onSelectElement)}
    </div>
  )
}
