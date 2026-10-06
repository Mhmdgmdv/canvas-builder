import { useState } from 'react'
import {
  CANVAS_COMPONENTS,
  CANVAS_COMPONENT_TYPES,
  CANVAS_ELEMENT_LABELS,
  type CanvasElementNode,
  type CanvasItem,
  type CanvasItemType,
  type CanvasPage,
} from '../models/canvasItem'
import { TAILWIND_CLASS_OPTIONS } from '../models/tailwindClassOptions'

type CanvasInspectorProps = {
  page: CanvasPage
  selectedItem: CanvasItem | null
  selectedElementId: number | null
  selectedElement: CanvasElementNode | null
  canAddElement: boolean
  onSelectPageRoot: () => void
  onSelectItem: (itemId: number) => void
  onSelectElement: (elementId: number) => void
  onCreateObject: (type: CanvasItemType) => void
  onChangeText: (elementId: number, text: string) => void
  onChangeClasses: (elementId: number | null, classes: string) => void
  onChangeTransform: (
    elementId: number | null,
    transform: Partial<Pick<CanvasItem, 'x' | 'y' | 'width' | 'height' | 'rotation'>>,
  ) => void
  onDeleteItem: () => void
  onDeleteElement: (elementId: number) => void
}

type StructureTreeProps = {
  nodes: CanvasElementNode[]
  selectedElementId: number | null
  depth?: number
  onSelectElement: (elementId: number) => void
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
  selectedElementId,
  depth = 0,
  onSelectElement,
}: StructureTreeProps) {
  return (
    <ul className="structure-list">
      {nodes.map((node) => (
        <li key={node.id}>
          <button
            type="button"
            className={`structure-item ${selectedElementId === node.id ? 'is-active' : ''}`}
            style={{ paddingLeft: 10 + depth * 14 }}
            onClick={() => onSelectElement(node.id)}
          >
            <span>{CANVAS_ELEMENT_LABELS[node.type]}</span>
            <small>{node.text || 'Untitled'}</small>
          </button>
          {node.children.length > 0 && (
            <StructureTree
              nodes={node.children}
              selectedElementId={selectedElementId}
              depth={depth + 1}
              onSelectElement={onSelectElement}
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
  onChange,
}: {
  label: string
  value: number | undefined
  min: number
  max?: number
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
  selectedItem,
  selectedElementId,
  selectedElement,
  canAddElement,
  onSelectPageRoot,
  onSelectItem,
  onSelectElement,
  onCreateObject,
  onChangeText,
  onChangeClasses,
  onChangeTransform,
  onDeleteItem,
  onDeleteElement,
}: CanvasInspectorProps) {
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [utilitySearch, setUtilitySearch] = useState('')
  const [isUtilitySearchOpen, setIsUtilitySearchOpen] = useState(false)
  const [activeUtilityIndex, setActiveUtilityIndex] = useState(0)
  const selectedObjectName = selectedElement
    ? CANVAS_ELEMENT_LABELS[selectedElement.type]
    : selectedItem
      ? CANVAS_COMPONENTS[selectedItem.type].label
      : 'Page root'
  const targetId = selectedElement?.id ?? null
  const targetClasses = selectedElement?.classes ?? selectedItem?.classes ?? ''
  const classes = new Set(targetClasses.split(/\s+/).filter(Boolean))
  const matchingUtilities = TAILWIND_CLASS_OPTIONS
    .filter((utility) =>
      utility.toLowerCase().includes(utilitySearch.trim().toLowerCase()),
    )
    .slice(0, 30)
  const canEditText =
    selectedElement !== null &&
    selectedElement.type !== 'container' &&
    selectedElement.type !== 'divider' &&
    !(selectedElement.type === 'button' && selectedElement.children.length > 0)

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

    onChangeClasses(targetId, [...updatedClasses].join(' '))
  }

  const selectUtility = (utility: string) => {
    toggleClass(utility)
    setUtilitySearch('')
    setActiveUtilityIndex(0)
    setIsUtilitySearchOpen(false)
  }

  const createObject = (type: CanvasItemType) => {
    onCreateObject(type)
    setIsCreateMenuOpen(false)
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
                disabled={selectedItem !== null && !canAddElement}
                onClick={() => createObject(type)}
              >
                <span>{CANVAS_COMPONENTS[type].label}</span>
                <small>{CANVAS_COMPONENTS[type].description}</small>
              </button>
            ))}
            {selectedItem !== null && !canAddElement && (
              <p>Select a container or button node to add a child.</p>
            )}
          </div>
        )}
      </section>

      <section className="inspector-section scene-tree-section">
        <h3>Scene tree</h3>
        <button
          type="button"
          className={`structure-item root-structure-item ${selectedItem === null ? 'is-active' : ''}`}
          onClick={onSelectPageRoot}
        >
          <span>Page · {page.name}</span>
          <small>Root</small>
        </button>
        <ul className="structure-list">
          {page.items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`structure-item root-structure-item ${selectedItem?.id === item.id && selectedElementId === null ? 'is-active' : ''}`}
                onClick={() => onSelectItem(item.id)}
              >
                <span>{CANVAS_COMPONENTS[item.type].label}</span>
                <small>{item.width} × {item.height} · {item.rotation}°</small>
              </button>
              {item.children.length > 0 && (
                <StructureTree
                  nodes={item.children}
                  selectedElementId={
                    selectedItem?.id === item.id ? selectedElementId : null
                  }
                  depth={1}
                  onSelectElement={(elementId) => {
                    onSelectItem(item.id)
                    onSelectElement(elementId)
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </section>
    </aside>

    <aside className="properties-panel">
      <div className="inspector-heading">
        <p>Properties</p>
        <h3>Inspector · {selectedObjectName}</h3>
      </div>
      <section className="inspector-section properties-section">
        {selectedItem ? (
          <>
            {selectedElement ? (
              canEditText ? (
                <label className="inspector-field">
                  <span>
                    {selectedElement.type === 'input'
                      ? 'Placeholder'
                      : selectedElement.type === 'image'
                        ? 'Image label'
                        : selectedElement.type === 'icon'
                          ? 'Icon content'
                          : 'Text content'}
                  </span>
                  <input
                    type="text"
                    value={selectedElement.text}
                    onChange={(event) =>
                      onChangeText(selectedElement.id, event.target.value)
                    }
                  />
                </label>
              ) : (
                <p className="inspector-hint">
                  {selectedElement.type === 'button'
                    ? 'Button content is nested. Select its text or icon child to edit it.'
                    : 'This node has no text content. Its child objects and styles remain editable.'}
                </p>
              )
            ) : (
              <div className="transform-grid">
                <TransformField
                  label="X"
                  value={selectedItem.x}
                  min={0}
                  onChange={(x) => onChangeTransform(null, { x })}
                />
                <TransformField
                  label="Y"
                  value={selectedItem.y}
                  min={0}
                  onChange={(y) => onChangeTransform(null, { y })}
                />
                <TransformField
                  label="Width"
                  value={selectedItem.width}
                  min={32}
                  onChange={(width) => onChangeTransform(null, { width })}
                />
                <TransformField
                  label="Height"
                  value={selectedItem.height}
                  min={24}
                  onChange={(height) => onChangeTransform(null, { height })}
                />
                <TransformField
                  label="Rotation"
                  value={selectedItem.rotation}
                  min={-360}
                  max={360}
                  onChange={(rotation) => onChangeTransform(null, { rotation })}
                />
              </div>
            )}

            {selectedElement && (
              <div className="transform-grid">
                <TransformField
                  label="X"
                  value={selectedElement.x}
                  min={0}
                  onChange={(x) =>
                    onChangeTransform(selectedElement.id, { x })
                  }
                />
                <TransformField
                  label="Y"
                  value={selectedElement.y}
                  min={0}
                  onChange={(y) =>
                    onChangeTransform(selectedElement.id, { y })
                  }
                />
                <TransformField
                  label="Width"
                  value={selectedElement.width}
                  min={32}
                  onChange={(width) =>
                    onChangeTransform(selectedElement.id, { width })
                  }
                />
                <TransformField
                  label="Height"
                  value={selectedElement.height}
                  min={24}
                  onChange={(height) =>
                    onChangeTransform(selectedElement.id, { height })
                  }
                />
                <TransformField
                  label="Rotation"
                  value={selectedElement.rotation}
                  min={-360}
                  max={360}
                  onChange={(rotation) =>
                    onChangeTransform(selectedElement.id, { rotation })
                  }
                />
              </div>
            )}

            <label className="inspector-field">
              <span>Tailwind classes</span>
              <textarea
                rows={3}
                value={targetClasses}
                onChange={(event) =>
                  onChangeClasses(targetId, event.target.value)
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

            {selectedElement ? (
              <button
                type="button"
                className="delete-element-button"
                onClick={() => onDeleteElement(selectedElement.id)}
              >
                Delete node
              </button>
            ) : (
              <button
                type="button"
                className="delete-element-button"
                onClick={onDeleteItem}
              >
                Delete object
              </button>
            )}
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
