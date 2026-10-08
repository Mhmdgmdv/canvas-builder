import type { CanvasNode } from '../models/canvasNode'

const MINIMUM_PAGE_HEIGHT = 680
const PAGE_PADDING = 32

export type CanvasPageSize = {
  width: number
  height: number
}

function includeNodeBounds(
  nodes: CanvasNode[],
  originX: number,
  originY: number,
  bounds: CanvasPageSize,
): void {
  for (const node of nodes) {
    const {
      x = 0,
      y = 0,
      width = 0,
      height = 0,
      rotation = 0,
      scale = 1,
    } = node.editor
    const scaledWidth = width * scale
    const scaledHeight = height * scale
    const radians = (rotation * Math.PI) / 180
    const rotatedWidth =
      Math.abs(scaledWidth * Math.cos(radians)) +
      Math.abs(scaledHeight * Math.sin(radians))
    const rotatedHeight =
      Math.abs(scaledHeight * Math.cos(radians)) +
      Math.abs(scaledWidth * Math.sin(radians))
    const absoluteX = originX + x
    const absoluteY = originY + y

    bounds.width = Math.max(
      bounds.width,
      absoluteX + width / 2 + rotatedWidth / 2 + PAGE_PADDING,
    )
    bounds.height = Math.max(
      bounds.height,
      absoluteY + height / 2 + rotatedHeight / 2 + PAGE_PADDING,
    )
    includeNodeBounds(node.children, absoluteX, absoluteY, bounds)
  }
}

export function getCanvasPageSize(
  nodes: CanvasNode[],
  minimumWidth: number,
): CanvasPageSize {
  const bounds = {
    width: minimumWidth,
    height: MINIMUM_PAGE_HEIGHT,
  }
  includeNodeBounds(nodes, 0, 0, bounds)

  return {
    width: Math.ceil(bounds.width),
    height: Math.ceil(bounds.height),
  }
}
