'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils/cn';

// ═══════════════════════════════════════════════════════════
// Reusable Sortable/Draggable Components powered by dnd-kit
// ═══════════════════════════════════════════════════════════

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

/**
 * Production-ready sortable list with keyboard + pointer support.
 * Pass items with `id` field and a render function.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className={cn('space-y-2', className)}>
          {items.map((item, index) => (
            <SortableItem key={item.id} id={item.id}>
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative transition-shadow',
        isDragging && 'z-50 shadow-xl opacity-90 scale-[1.02]'
      )}
    >
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-none"
          aria-label="Drag to reorder"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.5" />
            <circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="11" cy="13" r="1.5" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Kanban Board Component
// ═══════════════════════════════════════════════════════════

interface KanbanColumn<T extends { id: string }> {
  id: string;
  title: string;
  icon?: string;
  color?: string;
  items: T[];
}

interface KanbanBoardProps<T extends { id: string }> {
  columns: KanbanColumn<T>[];
  onMove: (itemId: string, fromColumn: string, toColumn: string) => void;
  onReorder: (columnId: string, items: T[]) => void;
  renderCard: (item: T) => React.ReactNode;
  className?: string;
}

/**
 * Kanban board with drag-and-drop columns.
 * Items can be reordered within a column or moved between columns.
 */
export function KanbanBoard<T extends { id: string }>({
  columns,
  onMove,
  onReorder,
  renderCard,
  className,
}: KanbanBoardProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which columns the items belong to
    const activeColumn = columns.find(col => col.items.some(item => item.id === activeId));
    const overColumn = columns.find(col => col.items.some(item => item.id === overId)) ||
                       columns.find(col => col.id === overId);

    if (!activeColumn || !overColumn) return;

    if (activeColumn.id === overColumn.id) {
      // Reorder within same column
      const oldIndex = activeColumn.items.findIndex(item => item.id === activeId);
      const newIndex = activeColumn.items.findIndex(item => item.id === overId);
      if (oldIndex !== newIndex) {
        const newItems = arrayMove(activeColumn.items, oldIndex, newIndex);
        onReorder(activeColumn.id, newItems);
      }
    } else {
      // Move between columns
      onMove(activeId, activeColumn.id, overColumn.id);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className={cn('flex gap-3 overflow-x-auto pb-2', className)}>
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-64">
            <div className="flex items-center gap-2 mb-2 px-1">
              {column.icon && <span className="text-sm">{column.icon}</span>}
              <h3 className="text-xs font-bold text-harbor-800 dark:text-white uppercase tracking-wide">{column.title}</h3>
              <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-harbor-800 px-1.5 py-0.5 rounded-full">{column.items.length}</span>
            </div>
            <SortableContext items={column.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 min-h-[100px] p-2 rounded-xl bg-gray-50 dark:bg-harbor-900/50 border border-dashed border-gray-200 dark:border-harbor-700">
                {column.items.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400">
                    Drop items here
                  </div>
                ) : (
                  column.items.map((item) => (
                    <SortableKanbanCard key={item.id} id={item.id}>
                      {renderCard(item)}
                    </SortableKanbanCard>
                  ))
                )}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
    </DndContext>
  );
}

function SortableKanbanCard({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing touch-none',
        isDragging && 'z-50 shadow-xl opacity-90 scale-[1.02] rotate-1'
      )}
    >
      {children}
    </div>
  );
}
