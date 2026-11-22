import type { ReactNode } from 'react';

/** A div rather than a <button>: Firefox cannot start a drag from a button element. */
export function DraggableScene({
  sceneId,
  canDrag,
  onOpen,
  title,
  className,
  children,
}: {
  sceneId: number;
  canDrag: boolean;
  onOpen: () => void;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable={canDrag}
      title={title}
      className={className}
      onDragStart={(event) => event.dataTransfer.setData('text/scene-id', String(sceneId))}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      {children}
    </div>
  );
}
