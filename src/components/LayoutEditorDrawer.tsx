import { useState } from 'react';
import { Minus, Plus, RotateCcw, Shuffle, Trash2, X } from 'lucide-react';
import type {
  DisplaySubZone,
  ShelfId,
  ShelfRowKey,
  ShopState,
  StorageLocation,
  WallId,
} from '../types/shop';
import {
  formatStorageRowLabel,
  formatWallLabel,
} from '../store/shopLayout';

interface LayoutEditorDrawerProps {
  open: boolean;
  shopState: ShopState;
  selectedDisplayId: string | null;
  onClose: () => void;
  onSetDisplayRowCount: (sectionId: string, count: number) => void;
  onAddDisplayCapulana: (sectionId: string) => void;
  onAddDisplayRow: (wallId: WallId, subZone?: DisplaySubZone) => void;
  onRemoveDisplayRow: (sectionId: string) => void;
  onSetShelfRowCount: (shelfRowId: string, count: number) => void;
  onAddShelfCapulana: (shelfRowId: string) => void;
  onAddShelfRow: (shelfId: ShelfId) => void;
  onRemoveShelfRow: (shelfRowId: string) => void;
  onReassignStorage: (slotId: string, storage: StorageLocation) => void;
  onMoveDisplay: (
    slotId: string,
    targetSectionId: string,
    targetPosition?: number,
  ) => void;
  onShuffleWall: (wallId: WallId) => void;
  onResetDefault: () => void;
}

type EditorTab = 'walls' | 'shelves' | 'reassign';

const ADD_ROW_OPTIONS: Record<
  WallId,
  Array<{ label: string; subZone: DisplaySubZone }>
> = {
  front: [
    { label: '+ Add Upper Row', subZone: 'front-upper' },
    { label: '+ Add Lower Bar Row', subZone: 'front-lower' },
  ],
  left: [
    { label: '+ Top Rod Row', subZone: 'left-top' },
    { label: '+ Shawls Row', subZone: 'left-shawls' },
    { label: '+ Lenços Row', subZone: 'left-lencos' },
    { label: '+ Church Row', subZone: 'left-church' },
  ],
  right: [{ label: '+ Add Right Wall Row', subZone: 'right-main' }],
  overshelf: [
    { label: '+ Add Row Over Shelf A', subZone: 'over-a' },
    { label: '+ Add Row Over Shelf B', subZone: 'over-b' },
  ],
};

export function LayoutEditorDrawer({
  open,
  shopState,
  selectedDisplayId,
  onClose,
  onSetDisplayRowCount,
  onAddDisplayCapulana,
  onAddDisplayRow,
  onRemoveDisplayRow,
  onSetShelfRowCount,
  onAddShelfCapulana,
  onAddShelfRow,
  onRemoveShelfRow,
  onReassignStorage,
  onMoveDisplay,
  onShuffleWall,
  onResetDefault,
}: LayoutEditorDrawerProps) {
  const [tab, setTab] = useState<EditorTab>('walls');
  const [wallFilter, setWallFilter] = useState<WallId>('front');
  const [confirmReset, setConfirmReset] = useState(false);

  const allSlots = shopState.sections.flatMap((sec) =>
    sec.slots.map((slot) => ({ slot, section: sec })),
  );

  const [pickedSlotId, setPickedSlotId] = useState<string>(
    selectedDisplayId ?? allSlots[0]?.slot.id ?? '',
  );

  const activeSlotId = allSlots.some(
    (x) => x.slot.id === (selectedDisplayId ?? pickedSlotId),
  )
    ? (selectedDisplayId ?? pickedSlotId)
    : (allSlots[0]?.slot.id ?? '');

  const activeEntry = allSlots.find((x) => x.slot.id === activeSlotId) ?? null;

  const [moveTargetSectionId, setMoveTargetSectionId] = useState<string>(
    activeEntry?.section.id ?? shopState.sections[0]?.id ?? '',
  );
  const [moveTargetPos, setMoveTargetPos] = useState<string>('');

  if (!open) return null;

  const filteredSections = shopState.sections.filter(
    (s) => s.wallId === wallFilter,
  );

  const shelfARows = shopState.shelfRows.filter((r) => r.shelfId === 'A');
  const shelfBRows = shopState.shelfRows.filter((r) => r.shelfId === 'B');

  const getShelfRowCount = (shelfId: ShelfId, rowKey: ShelfRowKey) =>
    shopState.shelfRows.find(
      (r) => r.shelfId === shelfId && r.rowKey === rowKey,
    )?.count ?? 12;

  return (
    <aside
      aria-label="Manage Shop Layout"
      data-testid="layout-editor-drawer"
      className="fixed top-14 right-0 bottom-0 z-30 flex w-full max-w-md flex-col border-l border-zinc-300 bg-white shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5">
        <h2 className="text-sm font-bold text-zinc-900">
          Counts, Shelves &amp; Mapping
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close layout manager"
          className="flex h-8 w-8 items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Layout sections"
        className="grid grid-cols-3 border-b border-zinc-200 bg-zinc-50 p-1"
      >
        {(
          [
            { id: 'walls', label: 'Wall Counts' },
            { id: 'shelves', label: 'Shelf Counts' },
            { id: 'reassign', label: 'Move & Map' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`py-2 text-xs font-semibold transition-colors ${
              tab === t.id
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'walls' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1">
              {(['front', 'left', 'right', 'overshelf'] as WallId[]).map(
                (w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWallFilter(w)}
                    className={`px-2.5 py-1.5 text-xs font-medium ${
                      wallFilter === w
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {formatWallLabel(w)}
                  </button>
                ),
              )}
            </div>

            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <span className="font-mono text-xs text-zinc-600 tabular-nums">
                {filteredSections.length} rows ·{' '}
                {filteredSections.reduce((acc, s) => acc + s.slots.length, 0)}{' '}
                capulanas
              </span>
              <button
                type="button"
                onClick={() => onShuffleWall(wallFilter)}
                className="flex items-center gap-1.5 border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
              >
                <Shuffle className="h-3.5 w-3.5" />
                <span>Shuffle Wall</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ADD_ROW_OPTIONS[wallFilter].map((opt) => (
                <button
                  key={opt.subZone}
                  type="button"
                  onClick={() => onAddDisplayRow(wallFilter, opt.subZone)}
                  className="border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="divide-y divide-zinc-200">
              {filteredSections.map((sec) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between gap-2 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-zinc-900">
                      {sec.label}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-zinc-500 tabular-nums">
                      Positions 01–{String(sec.slots.length).padStart(2, '0')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Decrease ${sec.label}`}
                      onClick={() =>
                        onSetDisplayRowCount(sec.id, sec.slots.length - 1)
                      }
                      className="flex h-8 w-8 items-center justify-center border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      aria-label={`${sec.label} count`}
                      value={sec.slots.length}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        onSetDisplayRowCount(
                          sec.id,
                          Number.isNaN(parsed) ? 0 : parsed,
                        );
                      }}
                      className="h-8 w-13 border border-zinc-300 text-center font-mono text-xs font-semibold text-zinc-900 tabular-nums"
                    />
                    <button
                      type="button"
                      aria-label={`Increase ${sec.label}`}
                      onClick={() => onAddDisplayCapulana(sec.id)}
                      className="flex h-8 w-8 items-center justify-center border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    {filteredSections.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Remove ${sec.label}`}
                        onClick={() => onRemoveDisplayRow(sec.id)}
                        className="flex h-8 w-7 items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'shelves' && (
          <div className="space-y-6">
            {(
              [
                {
                  shelfId: 'A' as ShelfId,
                  title: 'Shelf A (Right-Back Arm)',
                  rows: shelfARows,
                },
                {
                  shelfId: 'B' as ShelfId,
                  title: 'Shelf B (Back Wall Arm)',
                  rows: shelfBRows,
                },
              ] as const
            ).map((group) => {
              const nonTopCount = group.rows.filter((r) => !r.isTop).length;
              return (
                <div key={group.title}>
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <h3 className="text-xs font-bold text-zinc-900">
                      {group.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => onAddShelfRow(group.shelfId)}
                      className="flex items-center gap-1 border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-900 hover:bg-zinc-100"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Shelf Row</span>
                    </button>
                  </div>
                  <div className="divide-y divide-zinc-200">
                    {group.rows.map((row) => (
                      <div
                        key={row.id}
                        className="flex items-center justify-between gap-2 py-2.5"
                      >
                        <div>
                          <div className="text-xs font-semibold text-zinc-900">
                            {row.label}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-500 tabular-nums">
                            Cols 01–{String(row.count).padStart(2, '0')}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            aria-label={`Decrease Shelf ${row.shelfId} ${row.label}`}
                            onClick={() =>
                              onSetShelfRowCount(row.id, row.count - 1)
                            }
                            className="flex h-8 w-8 items-center justify-center border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={60}
                            aria-label={`Shelf ${row.shelfId} ${row.label} count`}
                            value={row.count}
                            onChange={(e) => {
                              const parsed = parseInt(e.target.value, 10);
                              onSetShelfRowCount(
                                row.id,
                                Number.isNaN(parsed) ? 0 : parsed,
                              );
                            }}
                            className="h-8 w-13 border border-zinc-300 text-center font-mono text-xs font-semibold text-zinc-900 tabular-nums"
                          />
                          <button
                            type="button"
                            aria-label={`Add stack to Shelf ${row.shelfId} ${row.label}`}
                            onClick={() => onAddShelfCapulana(row.id)}
                            className="flex h-8 w-8 items-center justify-center border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          {!row.isTop && nonTopCount > 1 && (
                            <button
                              type="button"
                              aria-label={`Remove Shelf ${row.shelfId} ${row.label}`}
                              onClick={() => onRemoveShelfRow(row.id)}
                              className="flex h-8 w-7 items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'reassign' && (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="select-display-capulana"
                className="block text-xs font-semibold text-zinc-900"
              >
                Select Display Capulana
              </label>
              <select
                id="select-display-capulana"
                value={activeSlotId}
                onChange={(e) => {
                  setPickedSlotId(e.target.value);
                  const found = allSlots.find(
                    (x) => x.slot.id === e.target.value,
                  );
                  if (found) setMoveTargetSectionId(found.section.id);
                }}
                className="mt-1.5 w-full border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900"
              >
                {allSlots.map(({ slot, section }) => (
                  <option key={slot.id} value={slot.id}>
                    {formatWallLabel(section.wallId)} · {section.shortLabel} ·
                    Pos {String(slot.position).padStart(2, '0')} (#
                    {slot.displayNumber}) → Shelf {slot.storage.shelfId}{' '}
                    {formatStorageRowLabel(slot.storage.rowKey)} C
                    {String(slot.storage.column).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            {activeEntry && (
              <>
                <div className="border-t border-zinc-200 pt-4">
                  <h3 className="text-xs font-bold text-zinc-900">
                    Reassign Storage Shelf Location
                  </h3>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <label
                        htmlFor="reassign-shelf"
                        className="block text-[11px] font-medium text-zinc-500"
                      >
                        Shelf
                      </label>
                      <select
                        id="reassign-shelf"
                        value={activeEntry.slot.storage.shelfId}
                        onChange={(e) => {
                          const shelfId = e.target.value as ShelfId;
                          onReassignStorage(activeEntry.slot.id, {
                            shelfId,
                            rowKey: activeEntry.slot.storage.rowKey,
                            column: activeEntry.slot.storage.column,
                          });
                        }}
                        className="mt-1 w-full border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs"
                      >
                        <option value="A">Shelf A</option>
                        <option value="B">Shelf B</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="reassign-row"
                        className="block text-[11px] font-medium text-zinc-500"
                      >
                        Row / Top
                      </label>
                      <select
                        id="reassign-row"
                        value={activeEntry.slot.storage.rowKey}
                        onChange={(e) => {
                          onReassignStorage(activeEntry.slot.id, {
                            ...activeEntry.slot.storage,
                            rowKey: e.target.value as ShelfRowKey,
                          });
                        }}
                        className="mt-1 w-full border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs"
                      >
                        {shopState.shelfRows
                          .filter(
                            (r) =>
                              r.shelfId === activeEntry.slot.storage.shelfId,
                          )
                          .map((r) => (
                            <option key={r.id} value={r.rowKey}>
                              {formatStorageRowLabel(r.rowKey)}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="reassign-col"
                        className="block text-[11px] font-medium text-zinc-500"
                      >
                        Column
                      </label>
                      <input
                        id="reassign-col"
                        type="number"
                        min={1}
                        max={Math.max(
                          1,
                          getShelfRowCount(
                            activeEntry.slot.storage.shelfId,
                            activeEntry.slot.storage.rowKey,
                          ),
                        )}
                        value={activeEntry.slot.storage.column}
                        onChange={(e) => {
                          const col = parseInt(e.target.value, 10);
                          if (!Number.isNaN(col)) {
                            onReassignStorage(activeEntry.slot.id, {
                              ...activeEntry.slot.storage,
                              column: col,
                            });
                          }
                        }}
                        className="mt-1 w-full border border-zinc-300 px-2 py-1.5 font-mono text-xs tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-200 pt-4">
                  <h3 className="text-xs font-bold text-zinc-900">
                    Move to Different Wall Spot
                  </h3>
                  <div className="mt-3 space-y-2.5">
                    <div>
                      <label
                        htmlFor="move-wall-section"
                        className="block text-[11px] font-medium text-zinc-500"
                      >
                        Destination Wall &amp; Row
                      </label>
                      <select
                        id="move-wall-section"
                        value={moveTargetSectionId}
                        onChange={(e) => setMoveTargetSectionId(e.target.value)}
                        className="mt-1 w-full border border-zinc-300 bg-white px-2 py-1.5 text-xs"
                      >
                        {shopState.sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {formatWallLabel(s.wallId)} · {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label
                          htmlFor="move-position"
                          className="block text-[11px] font-medium text-zinc-500"
                        >
                          Position (optional)
                        </label>
                        <input
                          id="move-position"
                          type="number"
                          min={1}
                          placeholder="End of row"
                          value={moveTargetPos}
                          onChange={(e) => setMoveTargetPos(e.target.value)}
                          className="mt-1 w-full border border-zinc-300 px-2 py-1.5 font-mono text-xs tabular-nums"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const pos = parseInt(moveTargetPos, 10);
                          onMoveDisplay(
                            activeEntry.slot.id,
                            moveTargetSectionId,
                            Number.isNaN(pos) ? undefined : pos,
                          );
                          setMoveTargetPos('');
                        }}
                        className="bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
                      >
                        Move
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-5 py-3">
        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-700">Reset all counts?</span>
            <button
              type="button"
              onClick={() => {
                onResetDefault();
                setConfirmReset(false);
              }}
              className="bg-red-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-800"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
            >
              Cancel
            </button>
          </div>
        )}

        <span className="font-mono text-[11px] text-zinc-500 tabular-nums">
          {allSlots.length} display ·{' '}
          {shopState.shelfRows.reduce((a, r) => a + r.count, 0)} shelf
        </span>
      </div>
    </aside>
  );
}
