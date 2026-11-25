import { useState } from 'react';
import { ChevronDown, ChevronUp, Minus, Plus, Shuffle } from 'lucide-react';
import type {
  CameraViewId,
  DisplaySection,
  DisplaySlot,
  DisplaySubZone,
  ShelfId,
  ShopState,
  WallId,
} from '../types/shop';
import { formatWallLabel } from '../store/shopLayout';

interface BottomDockProps {
  activeView: CameraViewId;
  shopState: ShopState;
  selectedDisplayId: string | null;
  editorOpen: boolean;
  onSelectView: (view: CameraViewId) => void;
  onSelectDisplay: (slot: DisplaySlot, section: DisplaySection) => void;
  onSetDisplayRowCount: (sectionId: string, count: number) => void;
  onAddDisplayRow: (wallId: WallId, subZone?: DisplaySubZone) => void;
  onSetShelfRowCount: (shelfRowId: string, count: number) => void;
  onAddShelfRow: (shelfId: ShelfId) => void;
  onShuffleWall: (wallId: WallId) => void;
}

const VIEW_BUTTONS: Array<{ id: CameraViewId; label: string }> = [
  { id: 'top', label: 'Top View' },
  { id: 'front', label: 'Front Wall' },
  { id: 'left', label: 'Left Wall' },
  { id: 'right', label: 'Right Wall' },
  { id: 'shelves', label: 'Back Shelves' },
  { id: 'overshelf', label: 'Over-Shelf' },
];

type QuickTarget = WallId | 'shelf-a' | 'shelf-b';

export function BottomDock({
  activeView,
  shopState,
  selectedDisplayId,
  editorOpen,
  onSelectView,
  onSelectDisplay,
  onSetDisplayRowCount,
  onAddDisplayRow,
  onSetShelfRowCount,
  onAddShelfRow,
  onShuffleWall,
}: BottomDockProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [quickTarget, setQuickTarget] = useState<QuickTarget>('right');
  const [quickRowId, setQuickRowId] = useState<string>('');

  const isWallView =
    activeView === 'front' ||
    activeView === 'left' ||
    activeView === 'right' ||
    activeView === 'overshelf';

  const wallSections = isWallView
    ? shopState.sections.filter((s) => s.wallId === activeView)
    : [];

  const currentSection =
    wallSections.find((s) => s.id === activeSectionId) ??
    wallSections[0] ??
    null;

  // For Top View / Back Shelves quick row count adjustment
  const isShelfTarget = quickTarget === 'shelf-a' || quickTarget === 'shelf-b';
  const quickShelfRows = isShelfTarget
    ? shopState.shelfRows.filter(
        (r) => r.shelfId === (quickTarget === 'shelf-a' ? 'A' : 'B'),
      )
    : [];
  const quickWallSections = !isShelfTarget
    ? shopState.sections.filter((s) => s.wallId === quickTarget)
    : [];

  const activeQuickShelfRow = isShelfTarget
    ? (quickShelfRows.find((r) => r.id === quickRowId) ?? quickShelfRows[0] ?? null)
    : null;
  const activeQuickSection = !isShelfTarget
    ? (quickWallSections.find((s) => s.id === quickRowId) ??
        quickWallSections[0] ??
        null)
    : null;

  return (
    <div
      className={`pointer-events-none fixed bottom-4 z-20 flex -translate-x-1/2 flex-col items-center transition-all ${
        editorOpen
          ? 'left-1/2 w-[min(760px,95vw)] md:left-[calc(50%-14rem)] md:w-[min(680px,calc(100vw-38rem))]'
          : 'left-1/2 w-[min(860px,calc(100vw-16rem))] max-sm:w-[95vw]'
      }`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="pointer-events-auto flex items-center gap-1.5 border border-b-0 border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
      >
        {collapsed ? (
          <>
            <ChevronUp className="h-3.5 w-3.5" />
            <span>Show Controls</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5" />
            <span>Hide Controls</span>
          </>
        )}
      </button>

      {!collapsed && (
        <div className="pointer-events-auto w-full border border-zinc-300 bg-white px-3 py-2.5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              role="group"
              aria-label="Camera Views"
              className="flex flex-wrap items-center gap-1"
            >
              {VIEW_BUTTONS.map((btn) => {
                const active = activeView === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => onSelectView(btn.id)}
                    className={`whitespace-nowrap shrink-0 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>

            {isWallView && currentSection && (
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center border border-zinc-300 bg-white">
                  <button
                    type="button"
                    aria-label={`Decrease ${currentSection.shortLabel} items`}
                    onClick={() =>
                      onSetDisplayRowCount(
                        currentSection.id,
                        currentSection.slots.length - 1,
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center text-zinc-700 hover:bg-zinc-100"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    aria-label={`${currentSection.shortLabel} item count`}
                    value={currentSection.slots.length}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onSetDisplayRowCount(
                        currentSection.id,
                        Number.isNaN(val) ? 0 : val,
                      );
                    }}
                    className="h-7 w-11 border-x border-zinc-200 text-center font-mono text-xs font-semibold text-zinc-900 tabular-nums"
                  />
                  <button
                    type="button"
                    aria-label={`Increase ${currentSection.shortLabel} items`}
                    onClick={() =>
                      onSetDisplayRowCount(
                        currentSection.id,
                        currentSection.slots.length + 1,
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center text-zinc-700 hover:bg-zinc-100"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onAddDisplayRow(
                      activeView as WallId,
                      currentSection.subZone,
                    )
                  }
                  className="flex items-center gap-1 whitespace-nowrap shrink-0 border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Row</span>
                </button>
                <button
                  type="button"
                  onClick={() => onShuffleWall(activeView as WallId)}
                  className="flex items-center gap-1 whitespace-nowrap shrink-0 border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  <span>Shuffle</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Row Item Count & Add Row controls directly inside Top View and Shelves View */}
          {!isWallView && (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <label
                  htmlFor="quick-zone-select"
                  className="text-[11px] font-semibold text-zinc-500"
                >
                  Zone
                </label>
                <select
                  id="quick-zone-select"
                  value={quickTarget}
                  onChange={(e) => {
                    setQuickTarget(e.target.value as QuickTarget);
                    setQuickRowId('');
                  }}
                  className="h-7 border border-zinc-300 bg-white px-2 text-xs font-medium text-zinc-900"
                >
                  <option value="front">Front Wall</option>
                  <option value="left">Left Wall</option>
                  <option value="right">Right Wall</option>
                  <option value="overshelf">Over-Shelf Display</option>
                  <option value="shelf-a">Shelf A</option>
                  <option value="shelf-b">Shelf B</option>
                </select>

                <label
                  htmlFor="quick-row-select"
                  className="text-[11px] font-semibold text-zinc-500"
                >
                  Row
                </label>
                {isShelfTarget ? (
                  <select
                    id="quick-row-select"
                    value={activeQuickShelfRow?.id ?? ''}
                    onChange={(e) => setQuickRowId(e.target.value)}
                    className="h-7 border border-zinc-300 bg-white px-2 text-xs font-medium text-zinc-900"
                  >
                    {quickShelfRows.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label} ({r.count})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    id="quick-row-select"
                    value={activeQuickSection?.id ?? ''}
                    onChange={(e) => setQuickRowId(e.target.value)}
                    className="h-7 border border-zinc-300 bg-white px-2 text-xs font-medium text-zinc-900"
                  >
                    {quickWallSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label} ({s.slots.length})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {isShelfTarget && activeQuickShelfRow && (
                  <>
                    <div className="flex items-center border border-zinc-300 bg-white">
                      <button
                        type="button"
                        aria-label="Decrease selected shelf row count"
                        onClick={() =>
                          onSetShelfRowCount(
                            activeQuickShelfRow.id,
                            activeQuickShelfRow.count - 1,
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center text-zinc-700 hover:bg-zinc-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        aria-label="Selected shelf row item count"
                        value={activeQuickShelfRow.count}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          onSetShelfRowCount(
                            activeQuickShelfRow.id,
                            Number.isNaN(val) ? 0 : val,
                          );
                        }}
                        className="h-7 w-12 border-x border-zinc-200 text-center font-mono text-xs font-semibold text-zinc-900 tabular-nums"
                      />
                      <button
                        type="button"
                        aria-label="Increase selected shelf row count"
                        onClick={() =>
                          onSetShelfRowCount(
                            activeQuickShelfRow.id,
                            activeQuickShelfRow.count + 1,
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center text-zinc-700 hover:bg-zinc-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onAddShelfRow(quickTarget === 'shelf-a' ? 'A' : 'B')
                      }
                      className="flex items-center gap-1 whitespace-nowrap border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Shelf</span>
                    </button>
                  </>
                )}

                {!isShelfTarget && activeQuickSection && (
                  <>
                    <div className="flex items-center border border-zinc-300 bg-white">
                      <button
                        type="button"
                        aria-label="Decrease selected wall row count"
                        onClick={() =>
                          onSetDisplayRowCount(
                            activeQuickSection.id,
                            activeQuickSection.slots.length - 1,
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center text-zinc-700 hover:bg-zinc-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        aria-label="Selected wall row item count"
                        value={activeQuickSection.slots.length}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          onSetDisplayRowCount(
                            activeQuickSection.id,
                            Number.isNaN(val) ? 0 : val,
                          );
                        }}
                        className="h-7 w-12 border-x border-zinc-200 text-center font-mono text-xs font-semibold text-zinc-900 tabular-nums"
                      />
                      <button
                        type="button"
                        aria-label="Increase selected wall row count"
                        onClick={() =>
                          onSetDisplayRowCount(
                            activeQuickSection.id,
                            activeQuickSection.slots.length + 1,
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center text-zinc-700 hover:bg-zinc-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onAddDisplayRow(
                          activeQuickSection.wallId,
                          activeQuickSection.subZone,
                        )
                      }
                      className="flex items-center gap-1 whitespace-nowrap border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>
                        Add Row to {formatWallLabel(activeQuickSection.wallId)}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {isWallView && wallSections.length > 0 && (
            <div className="mt-2.5 border-t border-zinc-200 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {wallSections.map((sec) => {
                  const active = currentSection?.id === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveSectionId(sec.id)}
                      className={`whitespace-nowrap shrink-0 px-2.5 py-1 font-mono text-[11px] font-medium tabular-nums transition-colors ${
                        active
                          ? 'bg-zinc-800 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {sec.shortLabel} ({sec.slots.length})
                    </button>
                  );
                })}
              </div>

              {currentSection && (
                <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-1">
                  {currentSection.slots.length === 0 ? (
                    <span className="text-xs text-zinc-500">
                      No capulanas in this row.
                    </span>
                  ) : (
                    currentSection.slots.map((slot) => {
                      const isSel = selectedDisplayId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => onSelectDisplay(slot, currentSection)}
                          aria-label={`${currentSection.label} Position ${slot.position} Number ${slot.displayNumber}`}
                          className={`shrink-0 border px-2 py-1 font-mono text-[11px] font-semibold tabular-nums transition-colors ${
                            isSel
                              ? 'border-red-700 bg-red-700 text-white'
                              : 'border-zinc-300 bg-zinc-50 text-zinc-800 hover:border-zinc-900 hover:bg-zinc-100'
                          }`}
                        >
                          {String(slot.position).padStart(2, '0')}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
