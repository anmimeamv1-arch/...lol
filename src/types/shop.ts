export type WallId = 'front' | 'left' | 'right' | 'overshelf';

export type CameraViewId =
  | 'top'
  | 'front'
  | 'left'
  | 'right'
  | 'shelves'
  | 'overshelf';

export type ShelfId = 'A' | 'B';

export type ShelfRowKey = 'top' | `row-${number}`;

export interface StorageLocation {
  shelfId: ShelfId;
  rowKey: ShelfRowKey;
  column: number; // 1-indexed column along that shelf row
}

export interface DisplaySlot {
  id: string; // e.g. "right-row-1-04"
  sectionId: string;
  wallId: WallId;
  position: number; // 1-indexed position along the row
  displayNumber: number; // Sequential display tag number
  priceLabel?: string; // Optional monochrome price card marker
  storage: StorageLocation;
}

export type DisplaySubZone =
  | 'front-upper'
  | 'front-lower'
  | 'left-top'
  | 'left-shawls'
  | 'left-lencos'
  | 'left-church'
  | 'right-main'
  | 'over-a'
  | 'over-b';

export interface DisplaySection {
  id: string;
  wallId: WallId;
  subZone?: DisplaySubZone;
  label: string;
  shortLabel: string;
  rowOrder: number;
  kind: 'capulana' | 'shawl' | 'lenco' | 'church';
  slots: DisplaySlot[];
}

export interface ShelfRow {
  id: string; // e.g. "A-row-1"
  shelfId: ShelfId;
  rowKey: ShelfRowKey;
  label: string; // e.g. "Row 1", "Top of Shelf"
  isTop: boolean;
  levelOrder: number; // 0 = top, 1..N = shelves top-to-bottom
  count: number; // Editable number of stacks along this shelf row
}

export interface ShopState {
  sections: DisplaySection[];
  shelfRows: ShelfRow[];
  nextDisplayNumber: number;
}
