import type {
  DisplaySection,
  DisplaySlot,
  DisplaySubZone,
  ShelfId,
  ShelfRow,
  ShelfRowKey,
  ShopState,
  StorageLocation,
  WallId,
} from '../types/shop';

export const STORAGE_KEY = 'capulana-shop-map-v1';

interface SectionBlueprint {
  id: string;
  wallId: WallId;
  subZone: DisplaySubZone;
  label: string;
  shortLabel: string;
  rowOrder: number;
  kind: DisplaySection['kind'];
  defaultCount: number;
  priceCardAt?: Record<number, string>;
}

const SECTION_BLUEPRINTS: SectionBlueprint[] = [
  // Front Wall (Window/Bars + Top above window)
  {
    id: 'front-top-1',
    wallId: 'front',
    subZone: 'front-upper',
    label: 'Top Row 1 (Above Window)',
    shortLabel: 'Top 1',
    rowOrder: 1,
    kind: 'capulana',
    defaultCount: 11,
    priceCardAt: { 4: '70MT' },
  },
  {
    id: 'front-top-2',
    wallId: 'front',
    subZone: 'front-upper',
    label: 'Top Row 2 (Upper Transom)',
    shortLabel: 'Top 2',
    rowOrder: 2,
    kind: 'capulana',
    defaultCount: 10,
  },
  {
    id: 'front-lower',
    wallId: 'front',
    subZone: 'front-lower',
    label: 'Lower Bars Row',
    shortLabel: 'Lower',
    rowOrder: 3,
    kind: 'capulana',
    defaultCount: 8,
  },

  // Left Wall (Top rod, fringed shawls, lenços, church capulanas above stairs & counter)
  {
    id: 'left-top-rod',
    wallId: 'left',
    subZone: 'left-top',
    label: 'Top Rod (Ceiling)',
    shortLabel: 'Top Rod',
    rowOrder: 1,
    kind: 'capulana',
    defaultCount: 10,
    priceCardAt: { 4: '150MT' },
  },
  {
    id: 'left-shawls',
    wallId: 'left',
    subZone: 'left-shawls',
    label: 'Fringed Shawls (Above Stairs)',
    shortLabel: 'Shawls',
    rowOrder: 2,
    kind: 'shawl',
    defaultCount: 6,
    priceCardAt: { 6: '250MT' },
  },
  {
    id: 'left-lencos-1',
    wallId: 'left',
    subZone: 'left-lencos',
    label: 'Headscarves / Lenços Row 1',
    shortLabel: 'Lenços 1',
    rowOrder: 3,
    kind: 'lenco',
    defaultCount: 10,
    priceCardAt: { 9: '50MT' },
  },
  {
    id: 'left-lencos-2',
    wallId: 'left',
    subZone: 'left-lencos',
    label: 'Headscarves / Lenços Row 2',
    shortLabel: 'Lenços 2',
    rowOrder: 4,
    kind: 'lenco',
    defaultCount: 10,
  },
  {
    id: 'left-church-1',
    wallId: 'left',
    subZone: 'left-church',
    label: 'Church Capulanas Row 1 (Upper)',
    shortLabel: 'Church 1',
    rowOrder: 5,
    kind: 'church',
    defaultCount: 10,
    priceCardAt: { 6: '270MT' },
  },
  {
    id: 'left-church-2',
    wallId: 'left',
    subZone: 'left-church',
    label: 'Church Capulanas Row 2 (Lower)',
    shortLabel: 'Church 2',
    rowOrder: 6,
    kind: 'church',
    defaultCount: 10,
  },

  // Right Wall (Multi-row hanging capulana wall with price cards)
  {
    id: 'right-row-1',
    wallId: 'right',
    subZone: 'right-main',
    label: 'Right Wall Row 1 (Top)',
    shortLabel: 'Row 1',
    rowOrder: 1,
    kind: 'capulana',
    defaultCount: 15,
    priceCardAt: { 3: '200MT', 8: '80MT' },
  },
  {
    id: 'right-row-2',
    wallId: 'right',
    subZone: 'right-main',
    label: 'Right Wall Row 2 (Upper Mid)',
    shortLabel: 'Row 2',
    rowOrder: 2,
    kind: 'capulana',
    defaultCount: 15,
    priceCardAt: { 3: '200MT', 8: '180MT' },
  },
  {
    id: 'right-row-3',
    wallId: 'right',
    subZone: 'right-main',
    label: 'Right Wall Row 3 (Lower Mid)',
    shortLabel: 'Row 3',
    rowOrder: 3,
    kind: 'capulana',
    defaultCount: 12,
    priceCardAt: { 4: '200MT', 8: '180MT' },
  },
  {
    id: 'right-row-4',
    wallId: 'right',
    subZone: 'right-main',
    label: 'Right Wall Row 4 (Bottom)',
    shortLabel: 'Row 4',
    rowOrder: 4,
    kind: 'capulana',
    defaultCount: 10,
    priceCardAt: { 2: '200MT', 4: '230MT' },
  },

  // Display Over Both Shelves (Right arm Shelf A + Back arm Shelf B)
  {
    id: 'over-shelf-a-1',
    wallId: 'overshelf',
    subZone: 'over-a',
    label: 'Over Shelf A · Row 1',
    shortLabel: 'Over A1',
    rowOrder: 1,
    kind: 'capulana',
    defaultCount: 10,
  },
  {
    id: 'over-shelf-a-2',
    wallId: 'overshelf',
    subZone: 'over-a',
    label: 'Over Shelf A · Row 2',
    shortLabel: 'Over A2',
    rowOrder: 2,
    kind: 'capulana',
    defaultCount: 10,
  },
  {
    id: 'over-shelf-b-1',
    wallId: 'overshelf',
    subZone: 'over-b',
    label: 'Over Shelf B · Row 1',
    shortLabel: 'Over B1',
    rowOrder: 3,
    kind: 'capulana',
    defaultCount: 12,
  },
  {
    id: 'over-shelf-b-2',
    wallId: 'overshelf',
    subZone: 'over-b',
    label: 'Over Shelf B · Row 2',
    shortLabel: 'Over B2',
    rowOrder: 4,
    kind: 'capulana',
    defaultCount: 12,
    priceCardAt: { 6: '180MT' },
  },
];

const DEFAULT_SHELF_ROWS: ShelfRow[] = [
  // Shelf A (Right-Back Arm of L-Shelf)
  {
    id: 'A-top',
    shelfId: 'A',
    rowKey: 'top',
    label: 'Top of Shelf A',
    isTop: true,
    levelOrder: 0,
    count: 14,
  },
  {
    id: 'A-row-1',
    shelfId: 'A',
    rowKey: 'row-1',
    label: 'Row 1 (Upper)',
    isTop: false,
    levelOrder: 1,
    count: 16,
  },
  {
    id: 'A-row-2',
    shelfId: 'A',
    rowKey: 'row-2',
    label: 'Row 2 (Mid-Upper)',
    isTop: false,
    levelOrder: 2,
    count: 16,
  },
  {
    id: 'A-row-3',
    shelfId: 'A',
    rowKey: 'row-3',
    label: 'Row 3 (Mid-Lower)',
    isTop: false,
    levelOrder: 3,
    count: 16,
  },
  {
    id: 'A-row-4',
    shelfId: 'A',
    rowKey: 'row-4',
    label: 'Row 4 (Bottom)',
    isTop: false,
    levelOrder: 4,
    count: 16,
  },

  // Shelf B (Back Arm of L-Shelf)
  {
    id: 'B-top',
    shelfId: 'B',
    rowKey: 'top',
    label: 'Top of Shelf B',
    isTop: true,
    levelOrder: 0,
    count: 16,
  },
  {
    id: 'B-row-1',
    shelfId: 'B',
    rowKey: 'row-1',
    label: 'Row 1 (Upper)',
    isTop: false,
    levelOrder: 1,
    count: 18,
  },
  {
    id: 'B-row-2',
    shelfId: 'B',
    rowKey: 'row-2',
    label: 'Row 2 (Second)',
    isTop: false,
    levelOrder: 2,
    count: 18,
  },
  {
    id: 'B-row-3',
    shelfId: 'B',
    rowKey: 'row-3',
    label: 'Row 3 (Third)',
    isTop: false,
    levelOrder: 3,
    count: 18,
  },
  {
    id: 'B-row-4',
    shelfId: 'B',
    rowKey: 'row-4',
    label: 'Row 4 (Fourth)',
    isTop: false,
    levelOrder: 4,
    count: 18,
  },
  {
    id: 'B-row-5',
    shelfId: 'B',
    rowKey: 'row-5',
    label: 'Row 5 (Bottom)',
    isTop: false,
    levelOrder: 5,
    count: 18,
  },
];

export function inferSectionSubZone(section: DisplaySection): DisplaySubZone {
  if (section.subZone) return section.subZone;
  if (section.id.startsWith('front-top')) return 'front-upper';
  if (section.id.startsWith('front-lower')) return 'front-lower';
  if (section.id.startsWith('left-top')) return 'left-top';
  if (section.id.startsWith('left-shawls')) return 'left-shawls';
  if (section.id.startsWith('left-lencos')) return 'left-lencos';
  if (section.id.startsWith('left-church')) return 'left-church';
  if (section.id.startsWith('over-shelf-a')) return 'over-a';
  if (section.id.startsWith('over-shelf-b')) return 'over-b';
  if (section.wallId === 'front') return 'front-upper';
  if (section.wallId === 'left') return 'left-church';
  if (section.wallId === 'overshelf') return 'over-b';
  return 'right-main';
}

export function storageKey(loc: StorageLocation): string {
  return `${loc.shelfId}:${loc.rowKey}:${loc.column}`;
}

export function enumerateShelfSpots(shelfRows: ShelfRow[]): StorageLocation[] {
  const spots: StorageLocation[] = [];
  for (const row of shelfRows) {
    for (let col = 1; col <= row.count; col += 1) {
      spots.push({
        shelfId: row.shelfId,
        rowKey: row.rowKey,
        column: col,
      });
    }
  }
  return spots;
}

export function findNextAvailableSpot(state: ShopState): StorageLocation {
  const used = new Set<string>();
  for (const section of state.sections) {
    for (const slot of section.slots) {
      used.add(storageKey(slot.storage));
    }
  }

  const allSpots = enumerateShelfSpots(state.shelfRows);
  for (const spot of allSpots) {
    if (!used.has(storageKey(spot))) {
      return spot;
    }
  }

  return allSpots[0] ?? { shelfId: 'A', rowKey: 'row-1', column: 1 };
}

export function createDefaultShopState(): ShopState {
  const shelfRows = DEFAULT_SHELF_ROWS.map((r) => ({ ...r }));
  const allSpots = enumerateShelfSpots(shelfRows);

  let spotIndex = 0;
  let displayNumber = 1;

  const sections: DisplaySection[] = SECTION_BLUEPRINTS.map((bp) => {
    const slots: DisplaySlot[] = [];
    for (let pos = 1; pos <= bp.defaultCount; pos += 1) {
      const storage =
        allSpots[spotIndex % allSpots.length] ?? {
          shelfId: 'A' as ShelfId,
          rowKey: 'row-1' as ShelfRowKey,
          column: 1,
        };
      spotIndex += 1;
      slots.push({
        id: `${bp.id}-${String(pos).padStart(2, '0')}`,
        sectionId: bp.id,
        wallId: bp.wallId,
        position: pos,
        displayNumber,
        priceLabel: bp.priceCardAt?.[pos],
        storage: { ...storage },
      });
      displayNumber += 1;
    }

    return {
      id: bp.id,
      wallId: bp.wallId,
      subZone: bp.subZone,
      label: bp.label,
      shortLabel: bp.shortLabel,
      rowOrder: bp.rowOrder,
      kind: bp.kind,
      slots,
    };
  });

  return {
    sections,
    shelfRows,
    nextDisplayNumber: displayNumber,
  };
}

export function formatStorageRowLabel(rowKey: ShelfRowKey): string {
  if (rowKey === 'top') return 'Top of Shelf';
  const num = rowKey.replace('row-', '');
  return `Row ${num}`;
}

export function formatWallLabel(wallId: WallId): string {
  switch (wallId) {
    case 'front':
      return 'Front Wall';
    case 'left':
      return 'Left Wall';
    case 'right':
      return 'Right Wall';
    case 'overshelf':
      return 'Over-Shelf Display';
  }
}

export function clampCount(value: number, min = 0, max = 60): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function setDisplayRowCount(
  state: ShopState,
  sectionId: string,
  newCountRaw: number,
): ShopState {
  const newCount = clampCount(newCountRaw, 0, 60);
  const targetSection = state.sections.find((s) => s.id === sectionId);
  if (!targetSection || targetSection.slots.length === newCount) {
    return state;
  }

  let nextDisplayNumber = state.nextDisplayNumber;
  const workingState = state;

  const updatedSections = state.sections.map((section) => {
    if (section.id !== sectionId) return section;

    if (newCount < section.slots.length) {
      return {
        ...section,
        slots: section.slots.slice(0, newCount),
      };
    }

    const added: DisplaySlot[] = [];
    const currentLen = section.slots.length;
    for (let pos = currentLen + 1; pos <= newCount; pos += 1) {
      const storage = findNextAvailableSpot({
        ...workingState,
        sections: workingState.sections.map((s) =>
          s.id === sectionId
            ? { ...s, slots: [...section.slots, ...added] }
            : s,
        ),
      });
      added.push({
        id: `${section.id}-${String(pos).padStart(2, '0')}-${nextDisplayNumber}`,
        sectionId: section.id,
        wallId: section.wallId,
        position: pos,
        displayNumber: nextDisplayNumber,
        storage,
      });
      nextDisplayNumber += 1;
    }

    return {
      ...section,
      slots: [...section.slots, ...added],
    };
  });

  return {
    ...state,
    sections: updatedSections,
    nextDisplayNumber,
  };
}

export function addDisplayCapulana(
  state: ShopState,
  sectionId: string,
  preferredStorage?: StorageLocation,
): { state: ShopState; addedSlot: DisplaySlot | null } {
  const section = state.sections.find((s) => s.id === sectionId);
  if (!section) return { state, addedSlot: null };

  const pos = section.slots.length + 1;
  const storage = preferredStorage
    ? clampStorageToCapacity(state.shelfRows, preferredStorage)
    : findNextAvailableSpot(state);

  const newSlot: DisplaySlot = {
    id: `${section.id}-${String(pos).padStart(2, '0')}-${state.nextDisplayNumber}`,
    sectionId: section.id,
    wallId: section.wallId,
    position: pos,
    displayNumber: state.nextDisplayNumber,
    storage,
  };

  return {
    state: {
      ...state,
      nextDisplayNumber: state.nextDisplayNumber + 1,
      sections: state.sections.map((s) =>
        s.id === sectionId ? { ...s, slots: [...s.slots, newSlot] } : s,
      ),
    },
    addedSlot: newSlot,
  };
}

export function addDisplayRow(
  state: ShopState,
  wallId: WallId,
  subZone?: DisplaySubZone,
  initialCount = 10,
): { state: ShopState; addedSection: DisplaySection } {
  const resolvedSubZone: DisplaySubZone =
    subZone ??
    (wallId === 'front'
      ? 'front-upper'
      : wallId === 'left'
        ? 'left-church'
        : wallId === 'overshelf'
          ? 'over-b'
          : 'right-main');

  const sameZone = state.sections.filter(
    (s) => inferSectionSubZone(s) === resolvedSubZone,
  );
  const nextIndex = sameZone.length + 1;
  const maxOrder = state.sections.reduce(
    (m, s) => Math.max(m, s.rowOrder),
    0,
  );

  const labelMap: Record<
    DisplaySubZone,
    { prefix: string; short: string; kind: DisplaySection['kind'] }
  > = {
    'front-upper': { prefix: 'Top Row', short: 'Top', kind: 'capulana' },
    'front-lower': { prefix: 'Lower Bars Row', short: 'Lower', kind: 'capulana' },
    'left-top': { prefix: 'Top Rod Row', short: 'Top Rod', kind: 'capulana' },
    'left-shawls': { prefix: 'Fringed Shawls Row', short: 'Shawls', kind: 'shawl' },
    'left-lencos': { prefix: 'Headscarves / Lenços Row', short: 'Lenços', kind: 'lenco' },
    'left-church': { prefix: 'Church Capulanas Row', short: 'Church', kind: 'church' },
    'right-main': { prefix: 'Right Wall Row', short: 'Row', kind: 'capulana' },
    'over-a': { prefix: 'Over Shelf A · Row', short: 'Over A', kind: 'capulana' },
    'over-b': { prefix: 'Over Shelf B · Row', short: 'Over B', kind: 'capulana' },
  };

  const meta = labelMap[resolvedSubZone];
  const uniqueSuffix = `${nextIndex}-${Date.now().toString(36).slice(-4)}-${state.nextDisplayNumber}`;
  const sectionId = `${resolvedSubZone}-${uniqueSuffix}`;
  const shortLabel =
    resolvedSubZone === 'over-a'
      ? `Over A${nextIndex}`
      : resolvedSubZone === 'over-b'
        ? `Over B${nextIndex}`
        : `${meta.short} ${nextIndex}`;

  const emptySection: DisplaySection = {
    id: sectionId,
    wallId,
    subZone: resolvedSubZone,
    label: `${meta.prefix} ${nextIndex}`,
    shortLabel,
    rowOrder: maxOrder + 1,
    kind: meta.kind,
    slots: [],
  };

  let working: ShopState = {
    ...state,
    sections: [...state.sections, emptySection],
  };

  const count = clampCount(initialCount, 0, 60);
  if (count > 0) {
    working = setDisplayRowCount(working, sectionId, count);
  }

  const addedSection = working.sections.find((s) => s.id === sectionId)!;
  return { state: working, addedSection };
}

export function removeDisplayRow(
  state: ShopState,
  sectionId: string,
): ShopState {
  const target = state.sections.find((s) => s.id === sectionId);
  if (!target) return state;
  const sameWall = state.sections.filter((s) => s.wallId === target.wallId);
  if (sameWall.length <= 1) return state;
  return {
    ...state,
    sections: state.sections.filter((s) => s.id !== sectionId),
  };
}

export function addShelfRow(
  state: ShopState,
  shelfId: ShelfId,
  initialCount = 12,
): { state: ShopState; addedRow: ShelfRow } {
  const sameShelf = state.shelfRows.filter((r) => r.shelfId === shelfId);
  const numberedRows = sameShelf.filter((r) => !r.isTop);
  const nextRowNum =
    numberedRows.reduce((max, r) => {
      const n = parseInt(r.rowKey.replace('row-', ''), 10);
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0) + 1;

  const rowKey: ShelfRowKey = `row-${nextRowNum}`;
  const newRow: ShelfRow = {
    id: `${shelfId}-${rowKey}`,
    shelfId,
    rowKey,
    label: `Row ${nextRowNum}`,
    isTop: false,
    levelOrder: nextRowNum,
    count: clampCount(initialCount, 0, 60),
  };

  // Insert after last row of the same shelf
  const shelfRows: ShelfRow[] = [];
  let inserted = false;
  for (let i = 0; i < state.shelfRows.length; i += 1) {
    const r = state.shelfRows[i];
    shelfRows.push(r);
    const next = state.shelfRows[i + 1];
    if (r.shelfId === shelfId && (!next || next.shelfId !== shelfId)) {
      shelfRows.push(newRow);
      inserted = true;
    }
  }
  if (!inserted) {
    shelfRows.push(newRow);
  }

  return {
    state: {
      ...state,
      shelfRows,
    },
    addedRow: newRow,
  };
}

export function removeShelfRow(
  state: ShopState,
  shelfRowId: string,
): ShopState {
  const target = state.shelfRows.find((r) => r.id === shelfRowId);
  if (!target || target.isTop) return state;
  const sameShelfNonTop = state.shelfRows.filter(
    (r) => r.shelfId === target.shelfId && !r.isTop,
  );
  if (sameShelfNonTop.length <= 1) return state;

  const shelfRows = state.shelfRows.filter((r) => r.id !== shelfRowId);
  const sections = state.sections.map((section) => ({
    ...section,
    slots: section.slots.map((slot) => ({
      ...slot,
      storage: clampStorageToCapacity(shelfRows, slot.storage),
    })),
  }));

  return {
    ...state,
    shelfRows,
    sections,
  };
}

export function clampStorageToCapacity(
  shelfRows: ShelfRow[],
  storage: StorageLocation,
): StorageLocation {
  const row = shelfRows.find(
    (r) => r.shelfId === storage.shelfId && r.rowKey === storage.rowKey,
  );
  if (!row || row.count <= 0) {
    const firstNonEmpty = shelfRows.find((r) => r.count > 0);
    if (!firstNonEmpty) {
      return { shelfId: 'A', rowKey: 'row-1', column: 1 };
    }
    return {
      shelfId: firstNonEmpty.shelfId,
      rowKey: firstNonEmpty.rowKey,
      column: 1,
    };
  }
  return {
    shelfId: row.shelfId,
    rowKey: row.rowKey,
    column: Math.max(1, Math.min(row.count, Math.round(storage.column))),
  };
}

export function setShelfRowCount(
  state: ShopState,
  shelfRowId: string,
  newCountRaw: number,
): ShopState {
  const newCount = clampCount(newCountRaw, 0, 60);
  const shelfRows = state.shelfRows.map((row) =>
    row.id === shelfRowId ? { ...row, count: newCount } : row,
  );

  const sections = state.sections.map((section) => ({
    ...section,
    slots: section.slots.map((slot) => ({
      ...slot,
      storage: clampStorageToCapacity(shelfRows, slot.storage),
    })),
  }));

  return {
    ...state,
    shelfRows,
    sections,
  };
}

export function addShelfCapulana(
  state: ShopState,
  shelfRowId: string,
  amount = 1,
): ShopState {
  const row = state.shelfRows.find((r) => r.id === shelfRowId);
  if (!row) return state;
  return setShelfRowCount(state, shelfRowId, row.count + Math.max(1, amount));
}

export function reassignDisplayStorage(
  state: ShopState,
  slotId: string,
  nextStorage: StorageLocation,
): ShopState {
  const validStorage = clampStorageToCapacity(state.shelfRows, nextStorage);
  return {
    ...state,
    sections: state.sections.map((section) => ({
      ...section,
      slots: section.slots.map((slot) =>
        slot.id === slotId ? { ...slot, storage: validStorage } : slot,
      ),
    })),
  };
}

export function moveDisplayCapulana(
  state: ShopState,
  slotId: string,
  targetSectionId: string,
  targetPosition?: number,
): ShopState {
  let movingSlot: DisplaySlot | null = null;
  for (const section of state.sections) {
    const found = section.slots.find((s) => s.id === slotId);
    if (found) {
      movingSlot = found;
      break;
    }
  }
  if (!movingSlot) return state;

  const targetSection = state.sections.find((s) => s.id === targetSectionId);
  if (!targetSection) return state;

  const sectionsWithout = state.sections.map((section) => {
    if (section.id !== movingSlot!.sectionId) return section;
    const filtered = section.slots
      .filter((s) => s.id !== slotId)
      .map((s, idx) => ({ ...s, position: idx + 1 }));
    return { ...section, slots: filtered };
  });

  const updatedSections = sectionsWithout.map((section) => {
    if (section.id !== targetSectionId) return section;
    const list = [...section.slots];
    const insertIdx =
      targetPosition === undefined
        ? list.length
        : Math.max(0, Math.min(list.length, targetPosition - 1));
    const moved: DisplaySlot = {
      ...movingSlot!,
      sectionId: targetSection.id,
      wallId: targetSection.wallId,
    };
    list.splice(insertIdx, 0, moved);
    return {
      ...section,
      slots: list.map((s, idx) => ({ ...s, position: idx + 1 })),
    };
  });

  return {
    ...state,
    sections: updatedSections,
  };
}

export function shuffleWallPositions(
  state: ShopState,
  wallId: WallId,
  rng: () => number = Math.random,
): ShopState {
  const wallSections = state.sections.filter((s) => s.wallId === wallId);
  const allSlots = wallSections.flatMap((s) => s.slots);
  if (allSlots.length <= 1) return state;

  const pool = [...allSlots];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let cursor = 0;
  const sections = state.sections.map((section) => {
    if (section.wallId !== wallId) return section;
    const nextSlots = section.slots.map((slot, idx) => {
      const picked = pool[cursor];
      cursor += 1;
      return {
        ...picked,
        sectionId: section.id,
        wallId: section.wallId,
        position: idx + 1,
      };
    });
    return {
      ...section,
      slots: nextSlots,
    };
  });

  return {
    ...state,
    sections,
  };
}

export function findDisplaySlotById(
  state: ShopState,
  slotId: string | null,
): { slot: DisplaySlot; section: DisplaySection } | null {
  if (!slotId) return null;
  for (const section of state.sections) {
    const slot = section.slots.find((s) => s.id === slotId);
    if (slot) return { slot, section };
  }
  return null;
}

export function findDisplaysAtStorage(
  state: ShopState,
  loc: StorageLocation,
): Array<{ slot: DisplaySlot; section: DisplaySection }> {
  const results: Array<{ slot: DisplaySlot; section: DisplaySection }> = [];
  for (const section of state.sections) {
    for (const slot of section.slots) {
      if (
        slot.storage.shelfId === loc.shelfId &&
        slot.storage.rowKey === loc.rowKey &&
        slot.storage.column === loc.column
      ) {
        results.push({ slot, section });
      }
    }
  }
  return results;
}

export function saveShopState(state: ShopState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota/storage errors in restricted contexts
  }
}

export function loadShopState(): ShopState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultShopState();
    const parsed = JSON.parse(raw) as ShopState;
    if (
      !parsed ||
      !Array.isArray(parsed.sections) ||
      !Array.isArray(parsed.shelfRows) ||
      parsed.sections.length === 0 ||
      parsed.shelfRows.length === 0
    ) {
      return createDefaultShopState();
    }
    return {
      ...parsed,
      sections: parsed.sections.map((s) => ({
        ...s,
        subZone: inferSectionSubZone(s),
      })),
    };
  } catch {
    return createDefaultShopState();
  }
}
