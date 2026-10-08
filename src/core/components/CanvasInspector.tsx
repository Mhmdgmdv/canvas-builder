import { useState } from 'react'
import {
  CANVAS_COMPONENTS,
  CANVAS_COMPONENT_TYPES,
  CANVAS_NODE_LABELS,
  type CanvasNode,
  type CanvasComponentType,
  type CanvasPage,
} from '../models/canvasNode'
import { TAILWIND_CLASS_OPTIONS } from '../models/tailwindClassOptions'
import type { CanvasNodeDropPosition } from '../services/CanvasNodeTree'

type CanvasInspectorProps = {
  page: CanvasPage
  selectedNodeId: string | null
  selectedNode: CanvasNode | null
  onSelectPageRoot: () => void
  onSelectNode: (nodeId: string) => void
  onCreateObject: (type: CanvasComponentType) => void
  onChangeText: (text: string) => void
  onChangeClasses: (classes: string) => void
  onChangeTransform: (transform: Partial<CanvasNode['editor']>) => void
  onDeleteSelected: () => void
  onRenameNode: (currentId: string, nextId: string) => string | null
  onChangeNodeId: (currentId: string, nextId: string) => string | null
  onMoveNode: (
    draggedId: string,
    targetId: string | null,
    position: CanvasNodeDropPosition,
  ) => void
}

type StructureTreeProps = {
  nodes: CanvasNode[]
  selectedNodeId: string | null
  collapsedNodeIds: Set<string>
  depth?: number
  onSelectNode: (nodeId: string) => void
  onMoveNode: CanvasInspectorProps['onMoveNode']
  onToggleNode: (nodeId: string) => void
}

function getUtilityGroup(utility: string): string | null {
  if (/^text-(xs|sm|base|lg|xl|2xl|3xl)$/.test(utility)) return 'text-size'
  if (/^text-(left|center|right)$/.test(utility)) return 'text-alignment'
  if (utility.startsWith('text-')) return 'text-color'
  if (utility.startsWith('bg-')) return 'background'
  if (utility.startsWith('rounded-')) return 'border-radius'
  if (utility.startsWith('shadow')) return 'shadow'
  if (utility.startsWith('font-')) return 'font-weight'
  if (/^border(-0|-2)?$/.test(utility)) return 'border-width'
  if (utility.startsWith('border-')) return 'border-color'
  if (utility.startsWith('gap-')) return 'gap'
  if (utility.startsWith('flex-')) return 'flex-direction'
  if (utility.startsWith('items-')) return 'align-items'
  if (utility.startsWith('justify-')) return 'justify-content'
  if (
    utility.startsWith('p-') ||
    utility.startsWith('px-') ||
    utility.startsWith('py-')
  ) {
    return 'padding'
  }
  if (/^(m-|mt-|mb-)/.test(utility)) return 'margin'
  if (utility.startsWith('w-')) return 'width'
  if (utility.startsWith('h-')) return 'height'
  if (utility.startsWith('min-h-')) return 'min-height'
  if (['block', 'inline-flex', 'flex', 'grid', 'hidden'].includes(utility)) {
    return 'display'
  }
  return null
}

function StructureTree({
  nodes,
  selectedNodeId,
  collapsedNodeIds,
  depth = 0,
  onSelectNode,
  onMoveNode,
  onToggleNode,
}: StructureTreeProps) {
  const [dropTarget, setDropTarget] = useState<{
    id: string
    position: Exclude<CanvasNodeDropPosition, 'root'>
  } | null>(null)

  const handleDrop = (
    event: React.DragEvent<HTMLButtonElement>,
    targetId: string,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    const draggedId = event.dataTransfer.getData('application/x-canvas-node')
    if (!draggedId) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientY - bounds.top) / bounds.height
    const position: CanvasNodeDropPosition =
      ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'inside'
    setDropTarget(null)
    onMoveNode(draggedId, targetId, position)
  }

  return (
    <ul className="structure-list">
      {nodes.map((node) => (
        <li key={node.id}>
          <div className="structure-row" style={{ paddingLeft: depth * 14 }}>
            {node.children.length > 0 ? (
              <button
                type="button"
                className="structure-disclosure"
                aria-label={`${collapsedNodeIds.has(node.id) ? 'Expand' : 'Collapse'} children of ${node.name}`}
                aria-expanded={!collapsedNodeIds.has(node.id)}
                onClick={() => onToggleNode(node.id)}
              >
                <span className={collapsedNodeIds.has(node.id) ? '' : 'is-expanded'} />
              </button>
            ) : (
              <span className="structure-disclosure-placeholder" />
            )}
            <button
              type="button"
              draggable
              className={[
                'structure-item',
                selectedNodeId === node.id ? 'is-active' : '',
                dropTarget?.id === node.id ? `is-drop-target drop-${dropTarget.position}` : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onSelectNode(node.id)}
              onDragStart={(event) => {
                event.dataTransfer.setData('application/x-canvas-node', node.id)
                event.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(event) => {
                if (event.dataTransfer.types.includes('application/x-canvas-node')) {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  const bounds = event.currentTarget.getBoundingClientRect()
                  const ratio = (event.clientY - bounds.top) / bounds.height
                  const position = ratio < 0.25
                    ? 'before'
                    : ratio > 0.75
                      ? 'after'
                      : 'inside'
                  setDropTarget({ id: node.id, position })
                }
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(event) => handleDrop(event, node.id)}
            >
              <span className="structure-node-name">{node.name}</span>
              <small>{CANVAS_NODE_LABELS[node.type]}</small>
            </button>
          </div>
            {node.children.length > 0 && !collapsedNodeIds.has(node.id) && (
              <StructureTree
                nodes={node.children}
                selectedNodeId={selectedNodeId}
                collapsedNodeIds={collapsedNodeIds}
                depth={depth + 1}
                onSelectNode={onSelectNode}
                onMoveNode={onMoveNode}
                onToggleNode={onToggleNode}
              />
            )}
        </li>
      ))}
    </ul>
  )
}

function TransformField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number | undefined
  min: number
  max?: number
  step?: number
  onChange: (value: number | undefined) => void
}) {
  return (
    <label className="transform-field">
      <span>{label}</span>
      <input
        type="number"
        value={value ?? ''}
        placeholder="Auto"
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          if (event.target.value === '') {
            onChange(undefined)
          } else {
            const value = Number(event.target.value)
            if (Number.isFinite(value)) {
              onChange(value)
            }
          }
        }}
      />
    </label>
  )
}

export function CanvasInspector({
  page,
  selectedNodeId,
  selectedNode,
  onSelectPageRoot,
  onSelectNode,
  onCreateObject,
  onChangeText,
  onChangeClasses,
  onChangeTransform,
  onDeleteSelected,
  onRenameNode,
  onChangeNodeId,
  onMoveNode,
}: CanvasInspectorProps) {
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [utilitySearch, setUtilitySearch] = useState('')
  const [isUtilitySearchOpen, setIsUtilitySearchOpen] = useState(false)
  const [activeUtilityIndex, setActiveUtilityIndex] = useState(0)
  const [nodeNameEdit, setNodeNameEdit] = useState({
    id: selectedNode?.id ?? '',
    value: selectedNode?.name ?? '',
    error: '',
  })
  const [nodeIdEdit, setNodeIdEdit] = useState({
    id: selectedNode?.id ?? '',
    value: selectedNode?.id ?? '',
    error: '',
  })
  const nodeNameDraft =
    selectedNode && nodeNameEdit.id === selectedNode.id
      ? nodeNameEdit.value
      : selectedNode?.name ?? ''
  const nodeNameError =
    selectedNode && nodeNameEdit.id === selectedNode.id
      ? nodeNameEdit.error
      : ''
  const nodeIdDraft =
    selectedNode && nodeIdEdit.id === selectedNode.id
      ? nodeIdEdit.value
      : selectedNode?.id ?? ''
  const nodeIdError =
    selectedNode && nodeIdEdit.id === selectedNode.id
      ? nodeIdEdit.error
      : ''
  const selectedObjectName = selectedNode
    ? CANVAS_NODE_LABELS[selectedNode.type]
    : 'Page root'
  const isRootNode = page.nodes.some((node) => node.id === selectedNodeId)
  const targetClasses = selectedNode?.styles.classes ?? ''
  const classes = new Set(targetClasses.split(/\s+/).filter(Boolean))
  const matchingUtilities = TAILWIND_CLASS_OPTIONS
    .filter((utility) =>
      utility.toLowerCase().includes(utilitySearch.trim().toLowerCase()),
    )
    .slice(0, 30)
  const canEditText =
    selectedNode !== null &&
    !isRootNode &&
    selectedNode.type !== 'container' &&
    selectedNode.type !== 'divider' &&
    !(selectedNode.type === 'button' && selectedNode.children.length > 0)

  const toggleClass = (utility: string) => {
    const updatedClasses = new Set(
      targetClasses.split(/\s+/).filter(Boolean),
    )
    if (updatedClasses.has(utility)) {
      updatedClasses.delete(utility)
    } else {
      const group = getUtilityGroup(utility)
      if (group) {
        for (const currentClass of updatedClasses) {
          if (getUtilityGroup(currentClass) === group) {
            updatedClasses.delete(currentClass)
          }
        }
      }
      updatedClasses.add(utility)
    }

    onChangeClasses([...updatedClasses].join(' '))
  }

  const selectUtility = (utility: string) => {
    toggleClass(utility)
    setUtilitySearch('')
    setActiveUtilityIndex(0)
    setIsUtilitySearchOpen(false)
  }

  const createObject = (type: CanvasComponentType) => {
    onCreateObject(type)
    setIsCreateMenuOpen(false)
  }

  const commitNodeName = () => {
    if (!selectedNode) return
    const error = onRenameNode(selectedNode.id, nodeNameDraft)
    setNodeNameEdit({
      id: selectedNode.id,
      value: error ? nodeNameDraft : nodeNameDraft.trim(),
      error: error ?? '',
    })
  }

  const commitNodeId = () => {
    if (!selectedNode) return
    const error = onChangeNodeId(selectedNode.id, nodeIdDraft)
    const value = error ? nodeIdDraft : nodeIdDraft.trim()
    setNodeIdEdit({ id: error ? selectedNode.id : value, value, error: error ?? '' })
  }

  const handleRootDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const draggedId = event.dataTransfer.getData('application/x-canvas-node')
    if (draggedId) onMoveNode(draggedId, null, 'root')
  }

  return (
    <>
    <aside className="scene-panel">
      <div className="inspector-heading">
        <p>Scene</p>
        <h2>{page.name}</h2>
      </div>

      <section className="inspector-section create-object-section">
        <button
          type="button"
          className="create-object-button"
          aria-expanded={isCreateMenuOpen}
          onClick={() => setIsCreateMenuOpen((open) => !open)}
        >
          <span>+</span> Create object
        </button>
        {isCreateMenuOpen && (
          <div className="object-picker">
            {CANVAS_COMPONENT_TYPES.map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => createObject(type)}
              >
                <span>{CANVAS_COMPONENTS[type].label}</span>
                <small>{CANVAS_COMPONENTS[type].description}</small>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="inspector-section scene-tree-section">
        <h3>Scene tree</h3>
        <button
          type="button"
          className={`structure-item root-structure-item ${selectedNodeId === null ? 'is-active' : ''}`}
          onClick={onSelectPageRoot}
          onDragOver={(event) => {
            if (event.dataTransfer.types.includes('application/x-canvas-node')) {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
            }
          }}
          onDrop={handleRootDrop}
        >
          <span>Page · {page.name}</span>
          <small>Root</small>
        </button>
        <StructureTree
          nodes={page.nodes}
          selectedNodeId={selectedNodeId}
          collapsedNodeIds={collapsedNodeIds}
          onSelectNode={onSelectNode}
          onMoveNode={onMoveNode}
          onToggleNode={(nodeId) =>
            setCollapsedNodeIds((collapsed) => {
              const updated = new Set(collapsed)
              if (updated.has(nodeId)) updated.delete(nodeId)
              else updated.add(nodeId)
              return updated
            })
          }
        />
      </section>
    </aside>

    <aside className="properties-panel">
      <div className="inspector-heading">
        <p>Properties</p>
        <h3>Inspector · {selectedObjectName}</h3>
      </div>
      <section className="inspector-section properties-section">
        {selectedNode ? (
          <>
            <label className="inspector-field node-name-field">
              <span>Name</span>
              <input
                type="text"
                value={nodeNameDraft}
                aria-invalid={Boolean(nodeNameError)}
                onChange={(event) => {
                  setNodeNameEdit({
                    id: selectedNode.id,
                    value: event.target.value,
                    error: '',
                  })
                }}
                onBlur={commitNodeName}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    event.currentTarget.blur()
                  } else if (event.key === 'Escape') {
                    setNodeNameEdit({
                      id: selectedNode.id,
                      value: selectedNode.name,
                      error: '',
                    })
                    event.currentTarget.blur()
                  }
                }}
              />
              {nodeNameError && (
                <small className="field-error">{nodeNameError}</small>
              )}
            </label>
            <label className="inspector-field node-name-field">
              <span>ID</span>
              <input
                type="text"
                value={nodeIdDraft}
                aria-invalid={Boolean(nodeIdError)}
                onChange={(event) =>
                  setNodeIdEdit({
                    id: selectedNode.id,
                    value: event.target.value,
                    error: '',
                  })
                }
                onBlur={commitNodeId}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    event.currentTarget.blur()
                  } else if (event.key === 'Escape') {
                    setNodeIdEdit({
                      id: selectedNode.id,
                      value: selectedNode.id,
                      error: '',
                    })
                    event.currentTarget.blur()
                  }
                }}
              />
              {nodeIdError && <small className="field-error">{nodeIdError}</small>}
            </label>
            {canEditText ? (
                <label className="inspector-field">
                  <span>
                    {selectedNode.type === 'input'
                      ? 'Placeholder'
                      : selectedNode.type === 'image'
                        ? 'Image label'
                        : selectedNode.type === 'icon'
                          ? 'Icon content'
                          : 'Text content'}
                  </span>
                  <input
                    type="text"
                    value={selectedNode.props.text}
                    onChange={(event) => onChangeText(event.target.value)}
                  />
                </label>
              ) : (
                <p className="inspector-hint">
                  {isRootNode
                    ? 'This canvas object is a positioning frame. Select one of its child nodes to edit content.'
                    : selectedNode.type === 'button'
                    ? 'Button content is nested. Select its text or icon child to edit it.'
                    : 'This node has no text content. Its child objects and styles remain editable.'}
                </p>
              )}
            <div className="transform-grid">
                <TransformField
                  label="X"
                  value={selectedNode.editor.x}
                  min={0}
                  onChange={(x) => onChangeTransform({ x })}
                />
                <TransformField
                  label="Y"
                  value={selectedNode.editor.y}
                  min={0}
                  onChange={(y) => onChangeTransform({ y })}
                />
                <TransformField
                  label="Width"
                  value={selectedNode.editor.width}
                  min={32}
                  onChange={(width) => onChangeTransform({ width })}
                />
                <TransformField
                  label="Height"
                  value={selectedNode.editor.height}
                  min={24}
                  onChange={(height) => onChangeTransform({ height })}
                />
                <TransformField
                  label="Rotation"
                  value={selectedNode.editor.rotation}
                  min={-360}
                  max={360}
                  onChange={(rotation) => onChangeTransform({ rotation })}
                />
                <TransformField
                  label="Scale"
                  value={selectedNode.editor.scale ?? 1}
                  min={0.1}
                  max={5}
                  step={0.1}
                  onChange={(scale) => onChangeTransform({ scale })}
                />
              </div>

            <label className="inspector-field">
              <span>Tailwind classes</span>
              <textarea
                rows={3}
                value={targetClasses}
                onChange={(event) =>
                  onChangeClasses(event.target.value)
                }
                spellCheck={false}
              />
            </label>

            <div className="utility-search">
              <label className="inspector-field">
                <span>Find a utility</span>
                <input
                  type="search"
                  role="combobox"
                  aria-label="Search Tailwind utilities"
                  aria-autocomplete="list"
                  aria-expanded={isUtilitySearchOpen && utilitySearch.trim().length > 0}
                  aria-controls="tailwind-utility-suggestions"
                  aria-activedescendant={
                    isUtilitySearchOpen && matchingUtilities.length > 0
                      ? `tailwind-utility-${activeUtilityIndex}`
                      : undefined
                  }
                  placeholder="Search classes, e.g. bg-indigo"
                  value={utilitySearch}
                  onFocus={() => setIsUtilitySearchOpen(true)}
                  onBlur={() => setIsUtilitySearchOpen(false)}
                  onChange={(event) => {
                    setUtilitySearch(event.target.value)
                    setActiveUtilityIndex(0)
                    setIsUtilitySearchOpen(true)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown' && matchingUtilities.length > 0) {
                      event.preventDefault()
                      setIsUtilitySearchOpen(true)
                      setActiveUtilityIndex((index) =>
                        (index + 1) % matchingUtilities.length,
                      )
                    } else if (
                      event.key === 'ArrowUp' &&
                      matchingUtilities.length > 0
                    ) {
                      event.preventDefault()
                      setIsUtilitySearchOpen(true)
                      setActiveUtilityIndex((index) =>
                        (index - 1 + matchingUtilities.length) %
                        matchingUtilities.length,
                      )
                    } else if (
                      event.key === 'Enter' &&
                      isUtilitySearchOpen &&
                      matchingUtilities.length > 0
                    ) {
                      event.preventDefault()
                      selectUtility(matchingUtilities[activeUtilityIndex])
                    } else if (event.key === 'Escape') {
                      setIsUtilitySearchOpen(false)
                    }
                  }}
                />
              </label>
              {isUtilitySearchOpen && utilitySearch.trim() && (
                <div
                  className="utility-suggestions"
                  id="tailwind-utility-suggestions"
                  role="listbox"
                  aria-label="Tailwind utility suggestions"
                >
                  {matchingUtilities.length > 0 ? (
                    matchingUtilities.map((utility, index) => (
                      <button
                        type="button"
                        id={`tailwind-utility-${index}`}
                        role="option"
                        aria-selected={classes.has(utility)}
                        key={utility}
                        className={`utility-suggestion ${index === activeUtilityIndex ? 'is-active' : ''}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectUtility(utility)}
                      >
                        <code>{utility}</code>
                        <span>{classes.has(utility) ? 'Added' : 'Add'}</span>
                      </button>
                    ))
                  ) : (
                    <p className="utility-empty-state">
                      No matching utilities in the common class list.
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="delete-element-button"
              onClick={onDeleteSelected}
            >
              Delete node
            </button>
          </>
        ) : (
          <p className="inspector-hint">
            The page root grows to fit its objects. Select an object in the scene tree to edit
            its transform and styles.
          </p>
        )}
      </section>
    </aside>
    </>
  )
}
