import type { CanvasPage } from '../models/canvasItem'

export type CanvasWorkspaceSnapshot = {
  pages: CanvasPage[]
  activePageId: string
}

const STORAGE_KEY = 'canvas-builder.workspace.v1'

function createInitialPage(): CanvasPage {
  return {
    id: crypto.randomUUID(),
    name: 'Landing page',
    items: [],
  }
}

function isCanvasPage(value: unknown): value is CanvasPage {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const page = value as Partial<CanvasPage>
  return (
    typeof page.id === 'string' &&
    typeof page.name === 'string' &&
    Array.isArray(page.items) &&
    page.items.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'number' &&
        typeof item.type === 'string' &&
        typeof item.x === 'number' &&
        typeof item.y === 'number' &&
        typeof item.width === 'number' &&
        typeof item.height === 'number' &&
        typeof item.rotation === 'number' &&
        typeof item.classes === 'string' &&
        Array.isArray(item.children),
    )
  )
}

export class CanvasWorkspaceStorage {
  load(): CanvasWorkspaceSnapshot {
    try {
      const storedValue = localStorage.getItem(STORAGE_KEY)
      if (!storedValue) {
        const page = createInitialPage()
        return { pages: [page], activePageId: page.id }
      }

      const parsed: unknown = JSON.parse(storedValue)
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'pages' in parsed &&
        Array.isArray(parsed.pages) &&
        parsed.pages.length > 0 &&
        parsed.pages.every(isCanvasPage) &&
        'activePageId' in parsed &&
        typeof parsed.activePageId === 'string'
      ) {
        const activePageId = parsed.pages.some(
          (page) => page.id === parsed.activePageId,
        )
          ? parsed.activePageId
          : parsed.pages[0].id
        return { pages: parsed.pages, activePageId }
      }

      console.error('Saved Canvas Builder workspace has an invalid format.')
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
