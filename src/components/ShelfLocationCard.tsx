import { X } from 'lucide-react';
import type {
  DisplaySection,
  DisplaySlot,
  StorageLocation,
} from '../types/shop';
import {
  formatStorageRowLabel,
  formatWallLabel,
} from '../store/shopLayout';

interface ShelfLocationCardProps {
  selectedDisplay: { slot: DisplaySlot; section: DisplaySection } | null;
  inspectedShelf: {
    location: StorageLocation;
    mappedDisplays: Array<{ slot: DisplaySlot; section: DisplaySection }>;
  } | null;
  onReturnToWall: (wallId: DisplaySlot['wallId']) => void;
  onSelectDisplayFromShelf: (slot: DisplaySlot, section: DisplaySection) => void;
  onClose: () => void;
}

export function ShelfLocationCard({
  selectedDisplay,
  inspectedShelf,
  onReturnToWall,
  onSelectDisplayFromShelf,
  onClose,
}: ShelfLocationCardProps) {
  if (!selectedDisplay && !inspectedShelf) return null;

  if (selectedDisplay) {
    const { slot, section } = selectedDisplay;
    const rowLabel = formatStorageRowLabel(slot.storage.rowKey);

    return (
      <aside
        aria-label="Shelf Location"
        data-testid="shelf-location-card"
        className="pointer-events-auto absolute top-4 left-4 z-20 w-72 border border-zinc-300 bg-white p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="font-mono text-xs text-zinc-500 tabular-nums">
            {formatWallLabel(section.wallId)} · {section.shortLabel} · Pos{' '}
            {String(slot.position).padStart(2, '0')} · #{slot.displayNumber}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shelf location"
            className="flex h-6 w-6 items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-2 border-t border-zinc-200 pt-2.5">
          <div className="text-[11px] font-medium text-zinc-500">
            Shelf Location
          </div>
          <div
            data-testid="shelf-location-value"
            className="mt-1 font-mono text-lg font-bold tracking-tight text-red-700 tabular-nums"
          >
            Shelf {slot.storage.shelfId} · {rowLabel} · Col{' '}
            {String(slot.storage.column).padStart(2, '0')}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onReturnToWall(section.wallId)}
            className="whitespace-nowrap border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-100"
          >
            Back to {formatWallLabel(section.wallId)}
          </button>
        </div>
      </aside>
    );
  }

  if (inspectedShelf) {
    const { location, mappedDisplays } = inspectedShelf;
    return (
      <aside
        aria-label="Shelf Slot"
        data-testid="shelf-location-card"
        className="pointer-events-auto absolute top-4 left-4 z-20 w-72 border border-zinc-300 bg-white p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <div
            data-testid="shelf-location-value"
            className="font-mono text-sm font-bold text-red-700 tabular-nums"
          >
            Shelf {location.shelfId} · {formatStorageRowLabel(location.rowKey)} ·
            Col {String(location.column).padStart(2, '0')}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shelf slot"
            className="flex h-6 w-6 items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-2.5 border-t border-zinc-200 pt-2">
          {mappedDisplays.length === 0 ? (
            <div className="text-xs text-zinc-500">
              No display assigned to this shelf spot.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {mappedDisplays.map(({ slot, section }) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => onSelectDisplayFromShelf(slot, section)}
                  className="flex items-center justify-between border border-zinc-200 px-2.5 py-1.5 text-left font-mono text-xs text-zinc-900 hover:bg-zinc-50 tabular-nums"
                >
                  <span>
                    {formatWallLabel(section.wallId)} · {section.shortLabel}
                  </span>
                  <span className="font-semibold">
                    Pos {String(slot.position).padStart(2, '0')} (#
                    {slot.displayNumber})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    );
  }

  return null;
}
