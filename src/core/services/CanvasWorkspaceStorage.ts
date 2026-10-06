import {
  CANVAS_COMPONENT_TYPES,
  type CanvasNode,
  type CanvasNodeLayout,
  type CanvasPage,
} from '../models/canvasNode'

export type CanvasWorkspaceSnapshot = {
  pages: CanvasPage[]
  activePageId: string
}

const STORAGE_KEY = 'canvas-builder.workspace.v2'
const LEGACY_STORAGE_KEY = 'canvas-builder.workspace.v1'

function createInitialPage(): CanvasPage {
  return {
    id: crypto.randomUUID(),
    name: 'Landing page',
    nodes: [],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCanvasNodeType(value: unknown): value is CanvasNode['type'] {
  return (
    typeof value === 'string' &&
    CANVAS_COMPONENT_TYPES.some((type) => type === value)
  )
}

function isOptionalFiniteNumber(
  value: Record<string, unknown>,
  key: string,
): boolean {
  return value[key] === undefined ||
    (typeof value[key] === 'number' && Number.isFinite(value[key]))
}

function isOneOf(value: unknown, options: readonly string[]): boolean {
  return value === undefined ||
    (typeof value === 'string' && options.some((option) => option === value))
}

function isOptionalCssLength(value: unknown): boolean {
  return value === undefined ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    typeof value === 'string'
}

function isCanvasNodeLayout(value: Record<string, unknown>): boolean {
  return (
    isOneOf(value.position, ['flow', 'absolute']) &&
    isOneOf(value.display, ['block', 'flex', 'grid', 'inline', 'inline-flex']) &&
    isOneOf(value.flexDirection, ['row', 'column', 'row-reverse', 'column-reverse']) &&
    isOneOf(value.flexWrap, ['nowrap', 'wrap', 'wrap-reverse']) &&
    isOneOf(value.alignItems, ['start', 'center', 'end', 'stretch', 'baseline']) &&
    isOneOf(value.justifyContent, [
      'start',
      'center',
      'end',
      'space-between',
      'space-around',
      'space-evenly',
    ]) &&
    ['gap', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'margin', 'padding']
      .every((key) => isOptionalCssLength(value[key])) &&
    ['gridTemplateColumns', 'gridTemplateRows'].every(
      (key) => value[key] === undefined || typeof value[key] === 'string',
    )
  )
}

function isCanvasNode(value: unknown): value is CanvasNode {
  if (!isRecord(value)) return false
  const { props, styles, layout, editor, children } = value
  return (
    typeof value.id === 'number' &&
    Number.isFinite(value.id) &&
    isCanvasNodeType(value.type) &&
    isRecord(props) &&
    typeof props.text === 'string' &&
    isRecord(styles) &&
    typeof styles.classes === 'string' &&
    isRecord(layout) &&
    isCanvasNodeLayout(layout) &&
    isRecord(editor) &&
    ['x', 'y', 'width', 'height', 'rotation'].every((key) =>
      isOptionalFiniteNumber(editor, key),
    ) &&
    Array.isArray(children) &&
    children.every(isCanvasNode)
  )
}

function isCanvasPage(value: unknown): value is CanvasPage {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.nodes) &&
    value.nodes.every(isCanvasNode)
  )
}

function isWorkspace(value: unknown): value is CanvasWorkspaceSnapshot {
  return (
    isRecord(value) &&
    Array.isArray(value.pages) &&
    value.pages.length > 0 &&
    value.pages.every(isCanvasPage) &&
    typeof value.activePageId === 'string'
  )
}

function optionalNumber(source: Record<string, unknown>, key: string): number | undefined {
  const value = source[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function migrateLegacyNode(value: unknown, isRoot: boolean): CanvasNode | null {
  if (!isRecord(value) || !Array.isArray(value.children)) return null
  const text = typeof value.text === 'string' ? value.text : isRoot ? '' : null
  if (
    typeof value.id !== 'number' ||
    !Number.isFinite(value.id) ||
    !isCanvasNodeType(value.type) ||
    text === null ||
    typeof value.classes !== 'string'
  ) {
    return null
  }

  const children = value.children.map((child) => migrateLegacyNode(child, false))
  if (children.some((child) => child === null)) return null

  const layout: CanvasNodeLayout = { position: isRoot ? 'absolute' : 'flow' }
  const editor = {
    x: optionalNumber(value, 'x'),
    y: optionalNumber(value, 'y'),
    width: optionalNumber(value, 'width'),
    height: optionalNumber(value, 'height'),
    rotation: optionalNumber(value, 'rotation'),
  }

  return {
    id: value.id,
    type: value.type,
    props: { text },
    styles: { classes: value.classes },
    layout,
    editor,
    children: children.filter((child): child is CanvasNode => child !== null),
  }
}

function migrateLegacyWorkspace(value: unknown): CanvasWorkspaceSnapshot | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.pages) ||
    value.pages.length === 0 ||
    typeof value.activePageId !== 'string'
  ) {
    return null
  }

  const pages: CanvasPage[] = []
  for (const page of value.pages) {
    if (
      !isRecord(page) ||
      typeof page.id !== 'string' ||
      typeof page.name !== 'string' ||
      !Array.isArray(page.items)
    ) {
      return null
    }
    const nodes = page.items.map((item) => migrateLegacyNode(item, true))
    if (nodes.some((node) => node === null)) return null
    pages.push({
      id: page.id,
      name: page.name,
      nodes: nodes.filter((node): node is CanvasNode => node !== null),
    })
  }

  const activePageId = pages.some((page) => page.id === value.activePageId)
    ? value.activePageId
    : pages[0].id
  return { pages, activePageId }
}

export class CanvasWorkspaceStorage {
  load(): CanvasWorkspaceSnapshot {
    try {
      const storedValue = localStorage.getItem(STORAGE_KEY)
      if (storedValue) {
        const parsed: unknown = JSON.parse(storedValue)
        if (isWorkspace(parsed)) {
          const activePageId = parsed.pages.some(
            (page) => page.id === parsed.activePageId,
          )
            ? parsed.activePageId
            : parsed.pages[0].id
          return { pages: parsed.pages, activePageId }
        }
        console.error('Saved Canvas Builder workspace has an invalid format.')
      } else {
        const legacyValue = localStorage.getItem(LEGACY_STORAGE_KEY)
        if (legacyValue) {
          const migrated = migrateLegacyWorkspace(JSON.parse(legacyValue))
          if (migrated) return migrated
          console.error('Saved legacy Canvas Builder workspace could not be migrated.')
        }
      }
    } catch (error) {
      console.error('Unable to load the saved Canvas Builder workspace.', error)
    }

    const page = createInitialPage()
    return { pages: [page], activePageId: page.id }
  }

  save(snapshot: CanvasWorkspaceSnapshot): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    } catch (error) {
      console.error('Unable to save the Canvas Builder workspace.', error)
    }
  }
}
