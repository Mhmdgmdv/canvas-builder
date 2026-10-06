import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { CanvasItemFactory } from '../factories/CanvasItemFactory'
import type {
  CanvasElementNode,
  CanvasItem,
  CanvasItemType,
  CanvasPage,
} from '../models/canvasItem'
import { CanvasInspector } from './CanvasInspector'
import { CanvasPageToolbar } from './CanvasPageToolbar'
import { CanvasStage } from './CanvasStage'
import { getCanvasPageSize } from '../services/CanvasPageLayout'
import { CanvasWorkspaceStorage } from '../services/CanvasWorkspaceStorage'
import { ReactProjectExporter } from '../services/ReactProjectExporter'
import './CanvasBuilder.css'

type ActiveDrag = {
  id: number
  startX: number
  startY: number
  originX: number
  originY: number
}

function findElement(
  nodes: CanvasElementNode[],
  targetId: number,
): CanvasElementNode | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node
    }

    const match = findElement(node.children, targetId)
    if (match) {
      return match
    }
  }

  return null
}

function updateElement(
  nodes: CanvasElementNode[],
  targetId: number,
  update: (node: CanvasElementNode) => CanvasElementNode,
): CanvasElementNode[] {
  return nodes.map((node) =>
    node.id === targetId
      ? update(node)
      : { ...node, children: updateElement(node.children, targetId, update) },
  )
}

function appendElement(
  nodes: CanvasElementNode[],
  targetId: number,
  child: CanvasElementNode,
): CanvasElementNode[] {
  return nodes.map((node) =>
    node.id === targetId
      ? { ...node, children: [...node.children, child] }
      : { ...node, children: appendElement(node.children, targetId, child) },
  )
}

function removeElement(
  nodes: CanvasElementNode[],
  targetId: number,
): CanvasElementNode[] {
  return nodes
    .filter((node) => node.id !== targetId)
    .map((node) => ({
      ...node,
      children: removeElement(node.children, targetId),
    }))
}

function updateItemInPages(
  pages: CanvasPage[],
  pageId: string,
  update: (items: CanvasItem[]) => CanvasItem[],
): CanvasPage[] {
  return pages.map((page) =>
    page.id === pageId ? { ...page, items: update(page.items) } : page,
  )
}

export function CanvasBuilder() {
  const [storage] = useState(() => new CanvasWorkspaceStorage())
  const [workspace, setWorkspace] = useState(() => storage.load())
  const [itemFactory] = useState(() => {
    const factory = new CanvasItemFactory()
    factory.reserveIds(workspace.pages)
    return factory
  })
  const [projectExporter] = useState(() => new ReactProjectExporter())
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null)
  const [minimumPageWidth, setMinimumPageWidth] = useState(320)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<ActiveDrag | null>(null)
  const activePage =
    workspace.pages.find((page) => page.id === workspace.activePageId) ??
    workspace.pages[0]
  const selectedItem =
    activePage.items.find((item) => item.id === selectedId) ?? null
  const selectedElement =
    selectedItem && selectedElementId !== null
      ? findElement(selectedItem.children, selectedElementId)
      : null
  const canAddElement = selectedItem !== null
  const pageSize = getCanvasPageSize(activePage.items, minimumPageWidth)

  useEffect(() => {
    storage.save(workspace)
  }, [storage, workspace])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    const updateWidth = () => {
      setMinimumPageWidth(Math.max(320, viewport.clientWidth))
    }
    const observer = new ResizeObserver(updateWidth)
    observer.observe(viewport)
    updateWidth()

    return () => observer.disconnect()
  }, [])

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

      setWorkspace((current) => ({
        ...current,
        pages: updateItemInPages(current.pages, current.activePageId, (items) =>
          items.map((item) =>
            item.id === activeDrag.id
              ? {
                  ...item,
                  x: Math.min(Math.max(activeDrag.originX + deltaX, 16), 50000),
                  y: Math.min(Math.max(activeDrag.originY + deltaY, 16), 50000),
                }
              : item,
          ),
        ),
      }))
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

  const selectPage = (pageId: string) => {
    setWorkspace((current) => ({ ...current, activePageId: pageId }))
    setSelectedId(null)
    setSelectedElementId(null)
  }

  const createPage = () => {
    const pageNumber = workspace.pages.length + 1
    const page: CanvasPage = {
      id: crypto.randomUUID(),
      name: `Page ${pageNumber}`,
      items: [],
    }

    setWorkspace((current) => ({
      pages: [...current.pages, page],
      activePageId: page.id,
    }))
    setSelectedId(null)
    setSelectedElementId(null)
  }

  const renamePage = (name: string) => {
    setWorkspace((current) => ({
      ...current,
      pages: current.pages.map((page) =>
        page.id === current.activePageId
          ? { ...page, name: name || 'Untitled page' }
          : page,
      ),
    }))
  }

  const deletePage = () => {
    if (workspace.pages.length <= 1) {
      return
    }

    const activeIndex = workspace.pages.findIndex(
      (page) => page.id === workspace.activePageId,
    )
    const pages = workspace.pages.filter(
      (page) => page.id !== workspace.activePageId,
    )
    const nextPage = pages[Math.max(0, activeIndex - 1)]
    setWorkspace({ pages, activePageId: nextPage.id })
    setSelectedId(null)
    setSelectedElementId(null)
  }

  const updateActiveItems = (
    update: (items: CanvasItem[]) => CanvasItem[],
  ) => {
    setWorkspace((current) => ({
      ...current,
      pages: updateItemInPages(
        current.pages,
        current.activePageId,
        update,
      ),
    }))
  }

  const createObject = (type: CanvasItemType) => {
    if (selectedItem) {
      const child = itemFactory.createElement(type)
      updateActiveItems((items) =>
        items.map((item) => {
          if (item.id !== selectedItem.id) {
            return item
          }

          const children =
            selectedElementId === null
              ? [...item.children, child]
              : appendElement(item.children, selectedElementId, child)

          return { ...item, children }
        }),
      )
      setSelectedElementId(child.id)
      return
    }

    const viewportWidth = viewportRef.current?.clientWidth ?? minimumPageWidth
    const item = itemFactory.create(type, activePage.items.length, {
      width: viewportWidth,
      height: pageSize.height,
    })
    updateActiveItems((items) => [...items, item])
    setSelectedId(item.id)
    setSelectedElementId(null)
  }

  const deleteSelectedItem = () => {
    if (selectedId === null) {
      return
    }

    updateActiveItems((items) => items.filter((item) => item.id !== selectedId))
    setSelectedId(null)
    setSelectedElementId(null)
  }

  const startDraggingItem = (
    item: CanvasItem,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault()
    setSelectedId(item.id)
    const selectedElement = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-canvas-element-id]')
      : null
    setSelectedElementId(
      selectedElement ? Number(selectedElement.dataset.canvasElementId) : null,
    )

    const stageRect = stageRef.current?.getBoundingClientRect()
    dragRef.current = {
      id: item.id,
      startX: stageRect ? event.clientX - stageRect.left : event.clientX,
      startY: stageRect ? event.clientY - stageRect.top : event.clientY,
      originX: item.x,
      originY: item.y,
    }
  }

  const changeElementText = (elementId: number, text: string) => {
    if (selectedId === null) {
      return
    }

    updateActiveItems((items) =>
      items.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              children: updateElement(item.children, elementId, (node) => ({
                ...node,
                text,
              })),
            }
          : item,
      ),
    )
  }

  const changeElementClasses = (
    elementId: number | null,
    classes: string,
  ) => {
    if (selectedId === null) {
      return
    }

    updateActiveItems((items) =>
      items.map((item) => {
        if (item.id !== selectedId) {
          return item
        }

        return elementId === null
          ? { ...item, classes }
          : {
              ...item,
              children: updateElement(item.children, elementId, (node) => ({
                ...node,
                classes,
              })),
            }
      }),
    )
  }

  const changeTransform = (
    elementId: number | null,
    transform: Partial<
      Pick<CanvasItem, 'x' | 'y' | 'width' | 'height' | 'rotation'>
    >,
  ) => {
    if (selectedId === null) {
      return
    }

    updateActiveItems((items) =>
      items.map((item) => {
        if (item.id !== selectedId) {
          return item
        }

        if (elementId !== null) {
          return {
            ...item,
            children: updateElement(item.children, elementId, (node) => {
              const updated = { ...node, ...transform }
              if (transform.x !== undefined) updated.x = Math.min(Math.max(transform.x, 0), 50000)
              if (transform.y !== undefined) updated.y = Math.min(Math.max(transform.y, 0), 50000)
              if (transform.width !== undefined) updated.width = Math.min(Math.max(transform.width, 32), 5000)
              if (transform.height !== undefined) updated.height = Math.min(Math.max(transform.height, 24), 5000)
              if (transform.rotation !== undefined) updated.rotation = Math.min(Math.max(transform.rotation, -360), 360)
              if ('x' in transform && transform.x === undefined) delete updated.x
              if ('y' in transform && transform.y === undefined) delete updated.y
              if ('width' in transform && transform.width === undefined) delete updated.width
              if ('height' in transform && transform.height === undefined) delete updated.height
              if ('rotation' in transform && transform.rotation === undefined) delete updated.rotation
              return updated
            }),
          }
        }

        return {
          ...item,
          ...transform,
          x: Math.min(Math.max(transform.x ?? item.x, 0), 50000),
          y: Math.min(Math.max(transform.y ?? item.y, 0), 50000),
          width: Math.min(Math.max(transform.width ?? item.width, 32), 5000),
          height: Math.min(Math.max(transform.height ?? item.height, 24), 5000),
          rotation: Math.min(
            Math.max(transform.rotation ?? item.rotation, -360),
            360,
          ),
        }
      }),
    )
  }

  const deleteElement = (elementId: number) => {
    if (selectedId === null) {
      return
    }

    updateActiveItems((items) =>
      items.map((item) =>
        item.id === selectedId
          ? { ...item, children: removeElement(item.children, elementId) }
          : item,
      ),
    )
    setSelectedElementId(null)
  }

  const exportProject = () => {
    try {
      const blob = projectExporter.export(workspace.pages)
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = 'canvas-builder-react-project.zip'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (error) {
      console.error('Unable to export the React project.', error)
      window.alert('The React project could not be exported. See the console for details.')
    }
  }

  return (
    <div className="app-shell">
      <CanvasPageToolbar
        pages={workspace.pages}
        activePage={activePage}
        onSelectPage={selectPage}
        onCreatePage={createPage}
        onRenamePage={renamePage}
        onDeletePage={deletePage}
        onExport={exportProject}
      />

      <div className="editor-layout">
        <CanvasInspector
          page={activePage}
          selectedItem={selectedItem}
          selectedElementId={selectedElementId}
          selectedElement={selectedElement}
          canAddElement={canAddElement}
          onSelectPageRoot={() => {
            setSelectedId(null)
            setSelectedElementId(null)
          }}
          onSelectItem={(itemId) => {
            setSelectedId(itemId)
            setSelectedElementId(null)
          }}
          onSelectElement={setSelectedElementId}
          onCreateObject={createObject}
          onChangeText={changeElementText}
          onChangeClasses={changeElementClasses}
          onChangeTransform={changeTransform}
          onDeleteItem={deleteSelectedItem}
          onDeleteElement={deleteElement}
        />

        <main className="canvas-panel">
          <header className="canvas-header">
            <div>
              <p>Design board</p>
              <h1>{activePage.name}</h1>
            </div>
            <span className="counter-badge">
              {activePage.items.length} object(s)
            </span>
          </header>

          <div className="canvas-viewport" ref={viewportRef}>
            <CanvasStage
              items={activePage.items}
              selectedId={selectedId}
              selectedElementId={selectedElementId}
              stageRef={stageRef}
              pageSize={pageSize}
              onItemPointerDown={startDraggingItem}
              onSelectElement={(itemId, elementId) => {
                setSelectedId(itemId)
                setSelectedElementId(elementId)
              }}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
