import {
  CANVAS_COMPONENTS,
  type CanvasNode,
} from '../models/canvasNode'

export type CanvasNodeDropPosition = 'before' | 'inside' | 'after' | 'root'

function findNode(nodes: CanvasNode[], targetId: string): CanvasNode | null {
  for (const node of nodes) {
    if (node.id === targetId) return node
    const match = findNode(node.children, targetId)
    if (match) return match
  }
  return null
}

function containsNode(node: CanvasNode, targetId: string): boolean {
  return node.id === targetId || node.children.some((child) => containsNode(child, targetId))
}

function detachNode(
  nodes: CanvasNode[],
  targetId: string,
): { nodes: CanvasNode[]; detached: CanvasNode | null } {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]
    if (node.id === targetId) {
      return {
        nodes: [...nodes.slice(0, index), ...nodes.slice(index + 1)],
        detached: node,
      }
    }

    const result = detachNode(node.children, targetId)
    if (result.detached) {
      return {
        nodes: nodes.map((candidate, childIndex) =>
          childIndex === index
            ? { ...candidate, children: result.nodes }
            : candidate,
        ),
        detached: result.detached,
      }
    }
  }

  return { nodes, detached: null }
}

function placeNode(
  nodes: CanvasNode[],
  movedNode: CanvasNode,
  targetId: string | null,
  position: CanvasNodeDropPosition,
  isRootLevel: boolean,
): { nodes: CanvasNode[]; placed: boolean } {
  if (targetId === null && position === 'root') {
    return {
      nodes: [...nodes, prepareNodeForLevel(movedNode, true)],
      placed: true,
    }
  }

  if (targetId === null) return { nodes, placed: false }

  const targetIndex = nodes.findIndex((node) => node.id === targetId)
  if (targetIndex >= 0) {
    if (position === 'inside') {
      const target = nodes[targetIndex]
      return {
        nodes: nodes.map((node, index) =>
          index === targetIndex
            ? {
                ...target,
                children: [
                  ...target.children,
                  prepareNodeForLevel(movedNode, false),
                ],
              }
            : node,
        ),
        placed: true,
      }
    }

    const insertAt = position === 'before' ? targetIndex : targetIndex + 1
    const siblings = [...nodes]
    siblings.splice(insertAt, 0, prepareNodeForLevel(movedNode, isRootLevel))
    return { nodes: siblings, placed: true }
  }

  for (let index = 0; index < nodes.length; index += 1) {
    const result = placeNode(
      nodes[index].children,
      movedNode,
      targetId,
      position,
      false,
    )
    if (result.placed) {
      return {
        nodes: nodes.map((node, nodeIndex) =>
          nodeIndex === index ? { ...node, children: result.nodes } : node,
        ),
        placed: true,
      }
    }
  }

  return { nodes, placed: false }
}

function prepareNodeForLevel(node: CanvasNode, isRoot: boolean): CanvasNode {
  if (isRoot) {
    const component = CANVAS_COMPONENTS[node.type]
    return {
      ...node,
      layout: { ...node.layout, position: 'absolute' },
      editor: {
        ...node.editor,
        x: node.editor.x ?? 24,
        y: node.editor.y ?? 24,
        width: node.editor.width ?? component.width,
        height: node.editor.height ?? component.height,
      },
    }
  }

  const editor = { ...node.editor }
  delete editor.x
  delete editor.y
  return {
    ...node,
    layout: { ...node.layout, position: 'flow' },
    editor,
  }
}

export function moveCanvasNode(
  nodes: CanvasNode[],
  draggedId: string,
  targetId: string | null,
  position: CanvasNodeDropPosition,
): CanvasNode[] {
  const draggedNode = findNode(nodes, draggedId)
  if (!draggedNode || draggedId === targetId) return nodes
  if (targetId !== null && containsNode(draggedNode, targetId)) return nodes
  if (targetId !== null && !findNode(nodes, targetId)) return nodes

  const detached = detachNode(nodes, draggedId)
  if (!detached.detached) return nodes
  const result = placeNode(
    detached.nodes,
    detached.detached,
    targetId,
    position,
    true,
  )
  return result.placed ? result.nodes : nodes
}

export function renameCanvasNode(
  nodes: CanvasNode[],
  currentId: string,
  nextName: string,
): CanvasNode[] {
  return nodes.map((node) =>
    node.id === currentId
      ? { ...node, name: nextName }
      : { ...node, children: renameCanvasNode(node.children, currentId, nextName) },
  )
}

export function changeCanvasNodeId(
  nodes: CanvasNode[],
  currentId: string,
  nextId: string,
): CanvasNode[] {
  return nodes.map((node) =>
    node.id === currentId
      ? { ...node, id: nextId }
      : { ...node, children: changeCanvasNodeId(node.children, currentId, nextId) },
  )
}
