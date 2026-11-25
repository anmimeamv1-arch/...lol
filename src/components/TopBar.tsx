import type { CameraViewId } from '../types/shop';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  activeView: CameraViewId;
  onSelectView: (view: CameraViewId) => void;
  onOpenEditor: () => void;
}

const NAV_ITEMS: Array<{ id: CameraViewId; label: string }> = [
  { id: 'top', label: 'Top View' },
  { id: 'front', label: 'Front' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'shelves', label: 'Shelves' },
  { id: 'overshelf', label: 'Over-Shelf' },
];

export function TopBar({
  activeView,
  onSelectView,
  onOpenEditor,
}: TopBarProps) {
  return (
    <header className="relative z-20 flex h-14 w-full items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 sm:px-5">
      <button
        type="button"
        onClick={() => onSelectView('top')}
        className="whitespace-nowrap shrink-0 text-left text-base font-bold tracking-tight text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      >
        Capulana Shop Map
      </button>

      <nav
        aria-label="Shop Views"
        className="hidden md:flex items-center gap-6 overflow-x-auto"
      >
        {NAV_ITEMS.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap shrink-0 border-b-2 py-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
                active
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 shrink-0">
        <PWAInstallButton />
        <button
          type="button"
          onClick={onOpenEditor}
          className="whitespace-nowrap shrink-0 rounded-md bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Manage Layout
        </button>
      </div>
    </header>
  );
}
