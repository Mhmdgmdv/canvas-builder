import type { CanvasElementNode, CanvasItem } from '../models/canvasItem'

const MINIMUM_PAGE_HEIGHT = 680
const PAGE_PADDING = 32

export type CanvasPageSize = {
  width: number
  height: number
}

function includeNodeBounds(
  nodes: CanvasElementNode[],
  originX: number,
  originY: number,
  parentWidth: number,
  parentHeight: number,
  bounds: CanvasPageSize,
): void {
  for (const node of nodes) {
    const x = originX + (node.x ?? 0)
    const y = originY + (node.y ?? 0)
    const width = node.width ?? parentWidth
    const height = node.height ?? parentHeight
    const radians = ((node.rotation ?? 0) * Math.PI) / 180
    const rotatedWidth =
      Math.abs(width * Math.cos(radians)) +
      Math.abs(height * Math.sin(radians))
    const rotatedHeight =
      Math.abs(height * Math.cos(radians)) +
      Math.abs(width * Math.sin(radians))

    bounds.width = Math.max(
      bounds.width,
      x + width / 2 + rotatedWidth / 2 + PAGE_PADDING,
    )
    bounds.height = Math.max(
      bounds.height,
      y + height / 2 + rotatedHeight / 2 + PAGE_PADDING,
    )
    includeNodeBounds(node.children, x, y, width, height, bounds)
  }
}

export function getCanvasPageSize(
  items: CanvasItem[],
  minimumWidth: number,
): CanvasPageSize {
  let right = minimumWidth
  let bottom = MINIMUM_PAGE_HEIGHT

  for (const item of items) {
    const radians = (item.rotation * Math.PI) / 180
    const rotatedWidth =
      Math.abs(item.width * Math.cos(radians)) +
      Math.abs(item.height * Math.sin(radians))
    const rotatedHeight =
      Math.abs(item.height * Math.cos(radians)) +
      Math.abs(item.width * Math.sin(radians))

    right = Math.max(right, item.x + item.width / 2 + rotatedWidth / 2 + PAGE_PADDING)
    bottom = Math.max(
      bottom,
      item.y + item.height / 2 + rotatedHeight / 2 + PAGE_PADDING,
    )
    const childBounds = { width: right, height: bottom }
    includeNodeBounds(
      item.children,
      item.x,
      item.y,
      item.width,
      item.height,
      childBounds,
    )
    right = Math.max(right, childBounds.width)
    bottom = Math.max(bottom, childBounds.height)
  }

  return {
    width: Math.ceil(right),
    height: Math.ceil(bottom),
  }
}
