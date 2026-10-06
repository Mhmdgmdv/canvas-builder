import type { CSSProperties } from 'react'
import type { CanvasNodeLayout } from '../models/canvasNode'

export function getCanvasNodeLayoutStyle(layout: CanvasNodeLayout): CSSProperties {
  return {
    display: layout.display,
    flexDirection: layout.flexDirection,
    flexWrap: layout.flexWrap,
    alignItems: layout.alignItems,
    justifyContent: layout.justifyContent,
    gap: layout.gap,
    width: layout.width,
    height: layout.height,
    minWidth: layout.minWidth,
    maxWidth: layout.maxWidth,
    minHeight: layout.minHeight,
    maxHeight: layout.maxHeight,
    gridTemplateColumns: layout.gridTemplateColumns,
    gridTemplateRows: layout.gridTemplateRows,
    margin: layout.margin,
    padding: layout.padding,
  }
}
