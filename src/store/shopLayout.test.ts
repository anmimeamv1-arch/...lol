import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDisplayCapulana,
  addDisplayRow,
  addShelfCapulana,
  addShelfRow,
  createDefaultShopState,
  findDisplaysAtStorage,
  formatStorageRowLabel,
  moveDisplayCapulana,
  reassignDisplayStorage,
  removeDisplayRow,
  removeShelfRow,
  setDisplayRowCount,
  setShelfRowCount,
  shuffleWallPositions,
  storageKey,
} from './shopLayout';

test('default shop state satisfies all walls, over-shelf display, and >= 12 per shelf row', () => {
  const state = createDefaultShopState();

  const wallTotals = {
    front: 0,
    left: 0,
    right: 0,
    overshelf: 0,
  };

  for (const section of state.sections) {
    wallTotals[section.wallId] += section.slots.length;
  }

  assert.ok(wallTotals.front >= 20, 'Front wall should have >= 20 capulanas');
  assert.ok(wallTotals.left >= 20, 'Left wall should have >= 20 capulanas');
  assert.ok(wallTotals.right >= 20, 'Right wall should have >= 20 capulanas');
  assert.ok(wallTotals.overshelf >= 20, 'Over-shelf display should have >= 20 capulanas');

  for (const row of state.shelfRows) {
    assert.ok(row.count >= 12, `Shelf row ${row.id} should default to >= 12`);
  }

  // Every default display slot should map to a unique exact storage position
  const seen = new Set<string>();
  for (const section of state.sections) {
    for (const slot of section.slots) {
      const key = storageKey(slot.storage);
      assert.equal(seen.has(key), false, `Duplicate default storage mapping: ${key}`);
      seen.add(key);
    }
  }
});

test('setShelfRowCount freely adjusts counts up and down and clamps dependent display mappings', () => {
  let state = createDefaultShopState();

  // Increase Shelf A Row 1 to 24
  state = setShelfRowCount(state, 'A-row-1', 24);
  const increased = state.shelfRows.find((r) => r.id === 'A-row-1');
  assert.equal(increased?.count, 24);

  // Assign a display slot to column 22 on A-row-1
  const targetSlot = state.sections[0].slots[0];
  state = reassignDisplayStorage(state, targetSlot.id, {
    shelfId: 'A',
    rowKey: 'row-1',
    column: 22,
  });

  const updatedSlot = state.sections[0].slots[0];
  assert.deepEqual(updatedSlot.storage, {
    shelfId: 'A',
    rowKey: 'row-1',
    column: 22,
  });

  // Shrink A-row-1 down to 8 -> column 22 clamps safely to 8
  state = setShelfRowCount(state, 'A-row-1', 8);
  const clampedSlot = state.sections[0].slots[0];
  assert.equal(clampedSlot.storage.column, 8);
});

test('setDisplayRowCount adds and trims display capulanas cleanly', () => {
  let state = createDefaultShopState();
  const initialCount = state.sections.find((s) => s.id === 'right-row-1')!.slots.length;

  state = setDisplayRowCount(state, 'right-row-1', initialCount + 5);
  const expanded = state.sections.find((s) => s.id === 'right-row-1')!;
  assert.equal(expanded.slots.length, initialCount + 5);
  assert.equal(expanded.slots[expanded.slots.length - 1].position, initialCount + 5);

  state = setDisplayRowCount(state, 'right-row-1', 4);
  const trimmed = state.sections.find((s) => s.id === 'right-row-1')!;
  assert.equal(trimmed.slots.length, 4);
});

test('adding, moving, reassigning, and shuffling preserve valid positions and exact mappings', () => {
  let state = createDefaultShopState();

  // Add a top-of-shelf stack
  const beforeTop = state.shelfRows.find((r) => r.id === 'B-top')!.count;
  state = addShelfCapulana(state, 'B-top', 2);
  assert.equal(state.shelfRows.find((r) => r.id === 'B-top')!.count, beforeTop + 2);

  // Add a capulana to front-top-1 targeting B-top col 17
  const addResult = addDisplayCapulana(state, 'front-top-1', {
    shelfId: 'B',
    rowKey: 'top',
    column: beforeTop + 1,
  });
  state = addResult.state;
  assert.ok(addResult.addedSlot);
  assert.equal(addResult.addedSlot.storage.rowKey, 'top');
  assert.equal(addResult.addedSlot.storage.column, beforeTop + 1);

  // Move that capulana to over-shelf-b-1 at position 1
  state = moveDisplayCapulana(state, addResult.addedSlot.id, 'over-shelf-b-1', 1);
  const targetSec = state.sections.find((s) => s.id === 'over-shelf-b-1')!;
  assert.equal(targetSec.slots[0].id, addResult.addedSlot.id);
  assert.equal(targetSec.slots[0].position, 1);
  assert.equal(targetSec.slots[1].position, 2);

  // Find displays mapped to B-top col 17
  const matches = findDisplaysAtStorage(state, {
    shelfId: 'B',
    rowKey: 'top',
    column: beforeTop + 1,
  });
  assert.ok(matches.some((m) => m.slot.id === addResult.addedSlot!.id));

  // Shuffle right wall positions deterministically
  const rightBefore = state.sections
    .filter((s) => s.wallId === 'right')
    .flatMap((s) => s.slots.map((slot) => slot.displayNumber))
    .sort((a, b) => a - b);

  state = shuffleWallPositions(state, 'right', () => 0.37);
  const rightAfter = state.sections
    .filter((s) => s.wallId === 'right')
    .flatMap((s) => s.slots.map((slot) => slot.displayNumber))
    .sort((a, b) => a - b);

  assert.deepEqual(rightAfter, rightBefore);
  assert.equal(formatStorageRowLabel('top'), 'Top of Shelf');
  assert.equal(formatStorageRowLabel('row-3'), 'Row 3');
});

test('adding and removing display rows and shelf rows works across walls and shelves', () => {
  let state = createDefaultShopState();

  // Add a 3rd and 4th row on Over-Shelf B
  const overBCountBefore = state.sections.filter(
    (s) => s.subZone === 'over-b',
  ).length;
  const r3 = addDisplayRow(state, 'overshelf', 'over-b', 12);
  state = r3.state;
  const r4 = addDisplayRow(state, 'overshelf', 'over-b', 10);
  state = r4.state;
  const overBCountAfter = state.sections.filter(
    (s) => s.subZone === 'over-b',
  ).length;
  assert.equal(overBCountAfter, overBCountBefore + 2);
  assert.equal(r3.addedSection.slots.length, 12);
  assert.equal(r4.addedSection.slots.length, 10);

  // Remove the 4th row cleanly
  state = removeDisplayRow(state, r4.addedSection.id);
  assert.equal(
    state.sections.filter((s) => s.subZone === 'over-b').length,
    overBCountBefore + 1,
  );

  // Add a 5th and 6th shelf row on Shelf A
  const shelfARowsBefore = state.shelfRows.filter((r) => r.shelfId === 'A').length;
  const sA1 = addShelfRow(state, 'A', 15);
  state = sA1.state;
  assert.equal(sA1.addedRow.rowKey, 'row-5');
  assert.equal(sA1.addedRow.count, 15);
  assert.equal(
    state.shelfRows.filter((r) => r.shelfId === 'A').length,
    shelfARowsBefore + 1,
  );

  // Map a display item to the newly added shelf row, then remove it and verify safe clamping
  const targetDisplay = state.sections[0].slots[0];
  state = reassignDisplayStorage(state, targetDisplay.id, {
    shelfId: 'A',
    rowKey: 'row-5',
    column: 14,
  });
  state = removeShelfRow(state, sA1.addedRow.id);
  assert.equal(
    state.shelfRows.filter((r) => r.shelfId === 'A').length,
    shelfARowsBefore,
  );
  const clamped = state.sections[0].slots[0].storage;
  assert.notEqual(clamped.rowKey, 'row-5');
});

