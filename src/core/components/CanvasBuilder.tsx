import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { CanvasNodeFactory } from '../factories/CanvasNodeFactory'
import type {
  CanvasNode,
  CanvasComponentType,
  CanvasPage,
} from '../models/canvasNode'
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

function findNode(
  nodes: CanvasNode[],
  targetId: number,
): CanvasNode | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node
    }

    const match = findNode(node.children, targetId)
    if (match) {
      return match
    }
  }

  return null
}

function updateNode(
  nodes: CanvasNode[],
  targetId: number,
  update: (node: CanvasNode) => CanvasNode,
): CanvasNode[] {
  return nodes.map((node) =>
    node.id === targetId
      ? update(node)
      : { ...node, children: updateNode(node.children, targetId, update) },
  )
}

function appendNode(
  nodes: CanvasNode[],
  targetId: number,
  child: CanvasNode,
): CanvasNode[] {
  return nodes.map((node) =>
    node.id === targetId
      ? { ...node, children: [...node.children, child] }
      : { ...node, children: appendNode(node.children, targetId, child) },
  )
}

function removeNode(
  nodes: CanvasNode[],
  targetId: number,
): CanvasNode[] {
  return nodes
    .filter((node) => node.id !== targetId)
    .map((node) => ({
      ...node,
      children: removeNode(node.children, targetId),
    }))
}

function updateNodesInPages(
  pages: CanvasPage[],
  pageId: string,
  update: (nodes: CanvasNode[]) => CanvasNode[],
): CanvasPage[] {
  return pages.map((page) =>
    page.id === pageId ? { ...page, nodes: update(page.nodes) } : page,
  )
}

export function CanvasBuilder() {
  const [storage] = useState(() => new CanvasWorkspaceStorage())
  const [workspace, setWorkspace] = useState(() => storage.load())
  const [nodeFactory] = useState(() => {
    const factory = new CanvasNodeFactory()
    factory.reserveIds(workspace.pages)
    return factory
  })
  const [projectExporter] = useState(() => new ReactProjectExporter())
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null)
  const [minimumPageWidth, setMinimumPageWidth] = useState(320)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<ActiveDrag | null>(null)
  const activePage =
    workspace.pages.find((page) => page.id === workspace.activePageId) ??
    workspace.pages[0]
  const selectedNode =
    selectedNodeId === null ? null : findNode(activePage.nodes, selectedNodeId)
  const pageSize = getCanvasPageSize(activePage.nodes, minimumPageWidth)

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
        pages: updateNodesInPages(current.pages, current.activePageId, (nodes) =>
          nodes.map((node) =>
            node.id === activeDrag.id
              ? {
                  ...node,
                  editor: {
                    ...node.editor,
                    x: Math.min(Math.max(activeDrag.originX + deltaX, 16), 50000),
                    y: Math.min(Math.max(activeDrag.originY + deltaY, 16), 50000),
                  },
                }
              : node,
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
    setSelectedNodeId(null)
  }

  const createPage = () => {
    const pageNumber = workspace.pages.length + 1
    const page: CanvasPage = {
      id: crypto.randomUUID(),
      name: `Page ${pageNumber}`,
      nodes: [],
    }

    setWorkspace((current) => ({
      pages: [...current.pages, page],
      activePageId: page.id,
    }))
    setSelectedNodeId(null)
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
    setSelectedNodeId(null)
  }

  const updateActiveNodes = (
    update: (nodes: CanvasNode[]) => CanvasNode[],
  ) => {
    setWorkspace((current) => ({
      ...current,
      pages: updateNodesInPages(
        current.pages,
        current.activePageId,
        update,
      ),
    }))
  }

  const createObject = (type: CanvasComponentType) => {
    if (selectedNodeId !== null) {
      const child = nodeFactory.createChild(type)
      updateActiveNodes((nodes) =>
        appendNode(nodes, selectedNodeId, child),
      )
      setSelectedNodeId(child.id)
      return
    }

    const viewportWidth = viewportRef.current?.clientWidth ?? minimumPageWidth
    const item = nodeFactory.createRoot(type, activePage.nodes.length, {
      width: viewportWidth,
      height: pageSize.height,
    })
    updateActiveNodes((nodes) => [...nodes, item])
    setSelectedNodeId(item.id)
  }

  const deleteSelectedNode = () => {
    if (selectedNodeId === null) {
      return
    }

    updateActiveNodes((nodes) => removeNode(nodes, selectedNodeId))
    setSelectedNodeId(null)
  }

  const startDraggingRootNode = (
    item: CanvasNode,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault()
    const selectedCanvasNode = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-canvas-node-id]')
      : null
    setSelectedNodeId(
      selectedCanvasNode
        ? Number(selectedCanvasNode.dataset.canvasNodeId)
        : item.id,
    )

    const stageRect = stageRef.current?.getBoundingClientRect()
    dragRef.current = {
      id: item.id,
      startX: stageRect ? event.clientX - stageRect.left : event.clientX,
      startY: stageRect ? event.clientY - stageRect.top : event.clientY,
      originX: item.editor.x ?? 0,
      originY: item.editor.y ?? 0,
    }
  }

  const changeSelectedText = (text: string) => {
    if (selectedNodeId === null) {
      return
    }

    updateActiveNodes((nodes) =>
      updateNode(nodes, selectedNodeId, (node) => ({
        ...node,
        props: { ...node.props, text },
      })),
    )
  }

  const changeSelectedClasses = (classes: string) => {
    if (selectedNodeId === null) {
      return
    }

    updateActiveNodes((nodes) =>
      updateNode(nodes, selectedNodeId, (node) => ({
        ...node,
        styles: { ...node.styles, classes },
      })),
    )
  }

  const changeSelectedTransform = (
    transform: Partial<
      Pick<CanvasNode['editor'], 'x' | 'y' | 'width' | 'height' | 'rotation'>
    >,
  ) => {
    if (selectedNodeId === null) {
      return
    }

    updateActiveNodes((nodes) =>
      updateNode(nodes, selectedNodeId, (node) => {
        const editor = { ...node.editor, ...transform }
        if (transform.x !== undefined) editor.x = Math.min(Math.max(transform.x, 0), 50000)
        if (transform.y !== undefined) editor.y = Math.min(Math.max(transform.y, 0), 50000)
        if (transform.width !== undefined) editor.width = Math.min(Math.max(transform.width, 32), 5000)
        if (transform.height !== undefined) editor.height = Math.min(Math.max(transform.height, 24), 5000)
        if (transform.rotation !== undefined) editor.rotation = Math.min(Math.max(transform.rotation, -360), 360)
        if ('x' in transform && transform.x === undefined) delete editor.x
        if ('y' in transform && transform.y === undefined) delete editor.y
        if ('width' in transform && transform.width === undefined) delete editor.width
        if ('height' in transform && transform.height === undefined) delete editor.height
        if ('rotation' in transform && transform.rotation === undefined) delete editor.rotation
        return { ...node, editor }
      }),
    )
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
          selectedNodeId={selectedNodeId}
          selectedNode={selectedNode}
          onSelectPageRoot={() => {
            setSelectedNodeId(null)
          }}
          onSelectNode={setSelectedNodeId}
          onCreateObject={createObject}
          onChangeText={changeSelectedText}
          onChangeClasses={changeSelectedClasses}
          onChangeTransform={changeSelectedTransform}
          onDeleteSelected={deleteSelectedNode}
        />

        <main className="canvas-panel">
          <header className="canvas-header">
            <div>
              <p>Design board</p>
              <h1>{activePage.name}</h1>
            </div>
            <span className="counter-badge">
              {activePage.nodes.length} object(s)
            </span>
          </header>

          <div className="canvas-viewport" ref={viewportRef}>
            <CanvasStage
              nodes={activePage.nodes}
              selectedNodeId={selectedNodeId}
              stageRef={stageRef}
              pageSize={pageSize}
              onRootNodePointerDown={startDraggingRootNode}
              onSelectNode={setSelectedNodeId}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
