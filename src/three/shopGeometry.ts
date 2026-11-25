import * as THREE from 'three';
import type {
  CameraViewId,
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
import { inferSectionSubZone, storageKey } from '../store/shopLayout';
import {
  getDisplayTileTexture,
  getFloorGridTexture,
  getShelfStackTexture,
  getWallLabelTexture,
} from './proceduralTextures';

export interface CameraPreset {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

export const ROOM_W = 6.4;
export const ROOM_D = 6.4;
export const ROOM_H = 3.7;

export const CAMERA_PRESETS: Record<CameraViewId, CameraPreset> = {
  top: {
    position: new THREE.Vector3(0, 14.0, 3.6),
    target: new THREE.Vector3(0, 0.7, 0.2),
    fov: 46,
  },
  front: {
    position: new THREE.Vector3(0, 2.05, 5.25),
    target: new THREE.Vector3(0, 1.78, -2.2),
    fov: 50,
  },
  left: {
    position: new THREE.Vector3(5.25, 2.05, 0.0),
    target: new THREE.Vector3(-2.2, 1.75, 0.0),
    fov: 50,
  },
  right: {
    position: new THREE.Vector3(-5.05, 2.05, -0.85),
    target: new THREE.Vector3(2.2, 1.75, -0.85),
    fov: 50,
  },
  shelves: {
    position: new THREE.Vector3(-3.35, 2.55, -3.25),
    target: new THREE.Vector3(1.5, 1.15, 2.0),
    fov: 48,
  },
  overshelf: {
    position: new THREE.Vector3(-3.65, 3.35, -3.05),
    target: new THREE.Vector3(1.5, 2.65, 2.1),
    fov: 48,
  },
};

export interface InteractableMeta {
  kind: 'wall' | 'display' | 'shelf';
  wallId?: WallId;
  cameraView?: CameraViewId;
  slot?: DisplaySlot;
  section?: DisplaySection;
  shelfLocation?: StorageLocation;
}

export interface ShopSceneHandles {
  root: THREE.Group;
  dynamicGroup: THREE.Group;
  highlightGroup: THREE.Group;
  interactables: THREE.Object3D[];
  shelfWorldPositions: Map<string, THREE.Vector3>;
  displayWorldPositions: Map<string, THREE.Vector3>;
  updateCutawayVisibility: (camera: THREE.Camera) => void;
  rebuildInventory: (
    state: ShopState,
    selectedDisplayId: string | null,
    highlightedStorage: StorageLocation | null,
  ) => void;
  dispose: () => void;
}

const MAT_WALL_LIGHT = new THREE.MeshStandardMaterial({
  color: 0xe8e8e5,
  roughness: 0.9,
  metalness: 0.02,
});

const MAT_WALL_LOWER_TILE = new THREE.MeshStandardMaterial({
  color: 0xf4f4f1,
  roughness: 0.65,
  metalness: 0.04,
});

const MAT_WALL_ACCENT_DARK = new THREE.MeshStandardMaterial({
  color: 0x27272a,
  roughness: 0.8,
  metalness: 0.08,
});

const MAT_MATTE_CHARCOAL = new THREE.MeshStandardMaterial({
  color: 0x18181b,
  roughness: 0.68,
  metalness: 0.15,
});

const MAT_SHELF_FRAME = new THREE.MeshStandardMaterial({
  color: 0xb8b8b2,
  roughness: 0.72,
  metalness: 0.05,
});

const MAT_SHELF_BOARD = new THREE.MeshStandardMaterial({
  color: 0x3f3f46,
  roughness: 0.8,
  metalness: 0.04,
});

const MAT_GLASS_COUNTER = new THREE.MeshPhysicalMaterial({
  color: 0xd4d4d8,
  roughness: 0.18,
  metalness: 0.05,
  transparent: true,
  opacity: 0.55,
});

const MAT_HIGHLIGHT_ACCENT = new THREE.MeshStandardMaterial({
  color: 0xdc2626,
  emissive: 0xdc2626,
  emissiveIntensity: 0.45,
  roughness: 0.35,
  metalness: 0.1,
});

const MAT_HIGHLIGHT_ROW = new THREE.MeshBasicMaterial({
  color: 0xdc2626,
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
});

const MAT_DISPLAY_RING = new THREE.MeshBasicMaterial({
  color: 0xdc2626,
  side: THREE.DoubleSide,
});

interface RowPlacement {
  origin: THREE.Vector3;
  axis: THREE.Vector3;
  normal: THREE.Vector3;
  span: number;
  maxTileW: number;
  tileH: number;
  tiltOut: number;
  wallGroupKey: 'front' | 'left' | 'right' | 'back';
}

interface ShelfRowLayout {
  center: THREE.Vector3;
  axis: THREE.Vector3;
  normal: THREE.Vector3;
  span: number;
  depth: number;
  boardY: number;
  stackH: number;
}

function computeShelfLayouts(shelfRows: ShelfRow[]): {
  byRowId: Map<string, ShelfRowLayout>;
  topHeights: Record<ShelfId, number>;
} {
  const byRowId = new Map<string, ShelfRowLayout>();
  const topHeights: Record<ShelfId, number> = { A: 1.92, B: 1.92 };

  for (const shelfId of ['A', 'B'] as ShelfId[]) {
    const rows = shelfRows.filter((r) => r.shelfId === shelfId);
    const numbered = rows
      .filter((r) => !r.isTop)
      .sort((a, b) => a.levelOrder - b.levelOrder);
    const topRow = rows.find((r) => r.isTop);

    const n = Math.max(numbered.length, 1);
    // Keep top height >= 1.92, grow taller smoothly when user adds 6+ shelves
    const shelfTopY = n <= 5 ? 1.92 : 1.92 + (n - 5) * 0.34;
    topHeights[shelfId] = shelfTopY;

    const minY = 0.14;
    const usableH = shelfTopY - minY;
    const stepY = usableH / n;
    const stackH = Math.min(0.22, Math.max(0.14, stepY * 0.62));

    const isA = shelfId === 'A';
    const centerXZ = isA ? { x: 2.86, z: 1.88 } : { x: 0.4, z: 2.86 };
    const axis = isA
      ? new THREE.Vector3(0, 0, 1)
      : new THREE.Vector3(-1, 0, 0);
    const normal = isA
      ? new THREE.Vector3(-1, 0, 0)
      : new THREE.Vector3(0, 0, -1);
    const span = isA ? 2.34 : 4.08;

    if (topRow) {
      byRowId.set(topRow.id, {
        center: new THREE.Vector3(centerXZ.x, shelfTopY, centerXZ.z),
        axis: axis.clone(),
        normal: normal.clone(),
        span,
        depth: 0.44,
        boardY: shelfTopY,
        stackH: 0.26,
      });
    }

    numbered.forEach((row, idx) => {
      // idx 0 = top numbered row (Row 1), idx n-1 = bottom row
      const boardY = shelfTopY - (idx + 1) * stepY;
      byRowId.set(row.id, {
        center: new THREE.Vector3(centerXZ.x, boardY, centerXZ.z),
        axis: axis.clone(),
        normal: normal.clone(),
        span,
        depth: 0.44,
        boardY,
        stackH,
      });
    });
  }

  return { byRowId, topHeights };
}

function computeSectionPlacements(
  sections: DisplaySection[],
  topHeights: Record<ShelfId, number>,
): Map<string, RowPlacement> {
  const result = new Map<string, RowPlacement>();
  const X_WALL = ROOM_W / 2 - 0.09; // 3.11
  const Z_WALL = ROOM_D / 2 - 0.09; // 3.11

  const byZone = new Map<DisplaySubZone, DisplaySection[]>();
  for (const s of sections) {
    const zone = inferSectionSubZone(s);
    const list = byZone.get(zone) ?? [];
    list.push(s);
    byZone.set(zone, list);
  }

  const placeZone = (
    zone: DisplaySubZone,
    cfg: {
      x: number;
      z: number;
      yTop: number;
      yBottom: number;
      axis: THREE.Vector3;
      normal: THREE.Vector3;
      span: number;
      maxTileW: number;
      maxTileH: number;
      tiltOut: number;
      wallGroupKey: RowPlacement['wallGroupKey'];
    },
  ) => {
    const list = (byZone.get(zone) ?? []).sort(
      (a, b) => a.rowOrder - b.rowOrder,
    );
    const n = list.length;
    if (n === 0) return;

    const totalAvail = Math.max(0.4, cfg.yTop - cfg.yBottom);
    const step = n === 1 ? 0 : totalAvail / (n - 1);
    const tileH =
      n === 1
        ? cfg.maxTileH
        : Math.min(cfg.maxTileH, Math.max(0.24, step * 0.86));

    list.forEach((sec, idx) => {
      const y = n === 1 ? (cfg.yTop + cfg.yBottom) / 2 : cfg.yTop - idx * step;
      result.set(sec.id, {
        origin: new THREE.Vector3(cfg.x, y, cfg.z),
        axis: cfg.axis.clone(),
        normal: cfg.normal.clone(),
        span: cfg.span,
        maxTileW: cfg.maxTileW,
        tileH,
        tiltOut: cfg.tiltOut,
        wallGroupKey: cfg.wallGroupKey,
      });
    });
  };

  // Front Wall (-Z, facing +Z)
  placeZone('front-upper', {
    x: 0,
    z: -Z_WALL,
    yTop: 3.12,
    yBottom: 2.34,
    axis: new THREE.Vector3(1, 0, 0),
    normal: new THREE.Vector3(0, 0, 1),
    span: 5.3,
    maxTileW: 0.44,
    maxTileH: 0.54,
    tiltOut: 0.06,
    wallGroupKey: 'front',
  });
  placeZone('front-lower', {
    x: 0,
    z: -Z_WALL + 0.06,
    yTop: 1.56,
    yBottom: 1.0,
    axis: new THREE.Vector3(1, 0, 0),
    normal: new THREE.Vector3(0, 0, 1),
    span: 4.9,
    maxTileW: 0.48,
    maxTileH: 0.62,
    tiltOut: 0.02,
    wallGroupKey: 'front',
  });

  // Left Wall (-X, facing +X)
  placeZone('left-top', {
    x: -X_WALL + 0.04,
    z: -0.35,
    yTop: 3.18,
    yBottom: 2.74,
    axis: new THREE.Vector3(0, 0, -1),
    normal: new THREE.Vector3(1, 0, 0),
    span: 4.8,
    maxTileW: 0.4,
    maxTileH: 0.5,
    tiltOut: 0.06,
    wallGroupKey: 'left',
  });
  placeZone('left-shawls', {
    x: -X_WALL,
    z: 1.38,
    yTop: 2.28,
    yBottom: 1.98,
    axis: new THREE.Vector3(0, 0, -1),
    normal: new THREE.Vector3(1, 0, 0),
    span: 1.85,
    maxTileW: 0.28,
    maxTileH: 0.64,
    tiltOut: 0.03,
    wallGroupKey: 'left',
  });
  placeZone('left-lencos', {
    x: -X_WALL,
    z: 1.3,
    yTop: 1.58,
    yBottom: 1.12,
    axis: new THREE.Vector3(0, 0, -1),
    normal: new THREE.Vector3(1, 0, 0),
    span: 1.75,
    maxTileW: 0.16,
    maxTileH: 0.34,
    tiltOut: 0.02,
    wallGroupKey: 'left',
  });
  placeZone('left-church', {
    x: -X_WALL,
    z: -1.35,
    yTop: 2.18,
    yBottom: 1.32,
    axis: new THREE.Vector3(0, 0, -1),
    normal: new THREE.Vector3(1, 0, 0),
    span: 3.15,
    maxTileW: 0.29,
    maxTileH: 0.6,
    tiltOut: 0.03,
    wallGroupKey: 'left',
  });

  // Right Wall (+X, facing -X)
  placeZone('right-main', {
    x: X_WALL,
    z: -1.2,
    yTop: 3.12,
    yBottom: 0.92,
    axis: new THREE.Vector3(0, 0, 1),
    normal: new THREE.Vector3(-1, 0, 0),
    span: 3.55,
    maxTileW: 0.26,
    maxTileH: 0.56,
    tiltOut: 0.05,
    wallGroupKey: 'right',
  });

  // Over-Shelf A (above Shelf A) — supports 2, 3, 4+ rows dynamically!
  const overACount = byZone.get('over-a')?.length ?? 2;
  const overABase = topHeights.A + 0.52;
  const overATop = Math.max(overABase + 0.62, overABase + (overACount - 1) * 0.46);
  placeZone('over-a', {
    x: X_WALL - 0.04,
    z: 1.88,
    yTop: overATop,
    yBottom: overABase,
    axis: new THREE.Vector3(0, 0, 1),
    normal: new THREE.Vector3(-1, 0, 0),
    span: 2.38,
    maxTileW: 0.24,
    maxTileH: 0.5,
    tiltOut: 0.08,
    wallGroupKey: 'right',
  });

  // Over-Shelf B (above Shelf B) — supports 2, 3, 4+ rows dynamically!
  const overBCount = byZone.get('over-b')?.length ?? 2;
  const overBBase = topHeights.B + 0.52;
  const overBTop = Math.max(overBBase + 0.62, overBBase + (overBCount - 1) * 0.46);
  placeZone('over-b', {
    x: 0.4,
    z: Z_WALL - 0.04,
    yTop: overBTop,
    yBottom: overBBase,
    axis: new THREE.Vector3(-1, 0, 0),
    normal: new THREE.Vector3(0, 0, -1),
    span: 4.15,
    maxTileW: 0.32,
    maxTileH: 0.5,
    tiltOut: 0.08,
    wallGroupKey: 'back',
  });

  return result;
}

export function computeShelfFocusCamera(
  shelfWorldPositions: Map<string, THREE.Vector3>,
  shelfRows: ShelfRow[],
  loc: StorageLocation,
): CameraPreset {
  const { byRowId } = computeShelfLayouts(shelfRows);
  const row = shelfRows.find(
    (r) => r.shelfId === loc.shelfId && r.rowKey === loc.rowKey,
  );
  const layout = row ? byRowId.get(row.id) : undefined;
  const pos = shelfWorldPositions.get(storageKey(loc));

  const target = pos
    ? pos.clone()
    : layout
      ? layout.center.clone()
      : new THREE.Vector3(1.5, 1.2, 2.2);

  const normal = layout
    ? layout.normal.clone()
    : loc.shelfId === 'A'
      ? new THREE.Vector3(-1, 0, 0)
      : new THREE.Vector3(0, 0, -1);

  const camOffset = normal
    .multiplyScalar(3.35)
    .add(new THREE.Vector3(0, 0.45, 0));

  if (loc.shelfId === 'A') {
    camOffset.z -= 0.75;
  } else {
    camOffset.x -= 0.75;
  }

  return {
    position: target.clone().add(camOffset),
    target,
    fov: 44,
  };
}

function buildStaticShopShell(
  root: THREE.Group,
  wallInteractables: THREE.Object3D[],
): {
  wallShellGroups: Record<'front' | 'left' | 'right' | 'back', THREE.Group>;
} {
  const halfW = ROOM_W / 2;
  const halfD = ROOM_D / 2;
  const wallT = 0.12;

  const wallShellGroups = {
    front: new THREE.Group(),
    left: new THREE.Group(),
    right: new THREE.Group(),
    back: new THREE.Group(),
  };

  root.add(wallShellGroups.front);
  root.add(wallShellGroups.left);
  root.add(wallShellGroups.right);
  root.add(wallShellGroups.back);

  // 1. Matte Architectural Floor Plinth + Tiled Grid
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM_W + 0.36, 0.14, ROOM_D + 0.36),
    MAT_MATTE_CHARCOAL,
  );
  plinth.position.set(0, -0.07, 0);
  plinth.receiveShadow = true;
  root.add(plinth);

  const floorTex = getFloorGridTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.02,
  });
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_W, ROOM_D),
    floorMat,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.005;
  floor.receiveShadow = true;
  root.add(floor);

  const addWallHitbox = (
    parent: THREE.Group,
    w: number,
    h: number,
    d: number,
    pos: THREE.Vector3,
    wallId: WallId,
    cameraView: CameraViewId,
  ) => {
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hitbox.position.copy(pos);
    hitbox.layers.enable(1);
    hitbox.userData = {
      kind: 'wall',
      wallId,
      cameraView,
    } satisfies InteractableMeta;
    parent.add(hitbox);
    wallInteractables.push(hitbox);
  };

  // 2. Front Wall (-Z)
  const frontHeader = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM_W + wallT * 2, 1.55, wallT),
    MAT_WALL_LIGHT,
  );
  frontHeader.position.set(0, ROOM_H - 0.775, -halfD - wallT / 2);
  wallShellGroups.front.add(frontHeader);

  for (const sx of [-1, 1]) {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, ROOM_H, wallT),
      MAT_WALL_LIGHT,
    );
    pillar.position.set(sx * (halfW - 0.225), ROOM_H / 2, -halfD - wallT / 2);
    wallShellGroups.front.add(pillar);
  }

  const gateTransom = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM_W - 0.85, 0.08, 0.06),
    MAT_MATTE_CHARCOAL,
  );
  gateTransom.position.set(0, 2.08, -halfD - 0.02);
  wallShellGroups.front.add(gateTransom);

  const barGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.08, 8);
  for (let i = -8; i <= 8; i += 1) {
    const bar = new THREE.Mesh(barGeo, MAT_MATTE_CHARCOAL);
    bar.position.set(i * 0.31, 1.04, -halfD - 0.02);
    wallShellGroups.front.add(bar);
  }
  addWallHitbox(
    wallShellGroups.front,
    ROOM_W,
    ROOM_H,
    0.32,
    new THREE.Vector3(0, ROOM_H / 2, -halfD),
    'front',
    'front',
  );

  // 3. Left Wall (-X)
  const leftUpper = new THREE.Mesh(
    new THREE.BoxGeometry(wallT, ROOM_H - 1.25, ROOM_D),
    MAT_WALL_LIGHT,
  );
  leftUpper.position.set(-halfW - wallT / 2, 1.25 + (ROOM_H - 1.25) / 2, 0);
  wallShellGroups.left.add(leftUpper);

  const leftLower = new THREE.Mesh(
    new THREE.BoxGeometry(wallT + 0.02, 1.25, ROOM_D),
    MAT_WALL_LOWER_TILE,
  );
  leftLower.position.set(-halfW - wallT / 2, 1.25 / 2, 0);
  wallShellGroups.left.add(leftLower);

  // Stairs ascending at Back-Left corner (kept visible on floor)
  const stairGroup = new THREE.Group();
  for (let step = 0; step < 4; step += 1) {
    const tread = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.22, 0.38),
      MAT_WALL_LOWER_TILE,
    );
    tread.position.set(-halfW + 0.48, 0.11 + step * 0.22, 1.65 + step * 0.38);
    tread.receiveShadow = true;
    tread.castShadow = true;
    stairGroup.add(tread);
  }
  const railPost1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.9, 8),
    MAT_MATTE_CHARCOAL,
  );
  railPost1.position.set(-halfW + 0.92, 0.45, 1.5);
  stairGroup.add(railPost1);

  const railPost2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 1.4, 8),
    MAT_MATTE_CHARCOAL,
  );
  railPost2.position.set(-halfW + 0.92, 0.9, 2.85);
  stairGroup.add(railPost2);

  const railBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 1.62, 8),
    MAT_MATTE_CHARCOAL,
  );
  railBar.position.set(-halfW + 0.92, 1.22, 2.17);
  railBar.rotation.x = Math.PI / 2 - 0.45;
  stairGroup.add(railBar);
  root.add(stairGroup);

  // Glass Counter along Front-Left
  const counterGroup = new THREE.Group();
  const counterBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.56, 2.75),
    MAT_MATTE_CHARCOAL,
  );
  counterBase.position.set(-halfW + 0.38, 0.28, -1.35);
  counterBase.castShadow = true;
  counterBase.receiveShadow = true;
  counterGroup.add(counterBase);

  const counterGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.34, 2.71),
    MAT_GLASS_COUNTER,
  );
  counterGlass.position.set(-halfW + 0.38, 0.73, -1.35);
  counterGroup.add(counterGlass);

  const counterTopFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.05, 2.78),
    MAT_MATTE_CHARCOAL,
  );
  counterTopFrame.position.set(-halfW + 0.38, 0.92, -1.35);
  counterGroup.add(counterTopFrame);
  root.add(counterGroup);

  const breakerBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.24, 0.32),
    MAT_SHELF_FRAME,
  );
  breakerBox.position.set(-halfW + 0.045, 1.38, -2.96);
  wallShellGroups.left.add(breakerBox);

  addWallHitbox(
    wallShellGroups.left,
    0.32,
    ROOM_H,
    ROOM_D,
    new THREE.Vector3(-halfW, ROOM_H / 2, 0),
    'left',
    'left',
  );

  // 4. Right Wall (+X)
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallT, ROOM_H, ROOM_D),
    MAT_WALL_LIGHT,
  );
  rightWall.position.set(halfW + wallT / 2, ROOM_H / 2, 0);
  wallShellGroups.right.add(rightWall);
  addWallHitbox(
    wallShellGroups.right,
    0.32,
    ROOM_H,
    3.7,
    new THREE.Vector3(halfW, ROOM_H / 2, -1.2),
    'right',
    'right',
  );

  // 5. Back Wall (+Z)
  const backUpper = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM_W - 1.35, ROOM_H - 1.75, wallT),
    MAT_WALL_LIGHT,
  );
  backUpper.position.set(0.675, 1.75 + (ROOM_H - 1.75) / 2, halfD + wallT / 2);
  wallShellGroups.back.add(backUpper);

  const backLower = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM_W - 1.35, 1.75, wallT + 0.02),
    MAT_WALL_LOWER_TILE,
  );
  backLower.position.set(0.675, 1.75 / 2, halfD + wallT / 2);
  wallShellGroups.back.add(backLower);

  const doorHeader = new THREE.Mesh(
    new THREE.BoxGeometry(1.38, ROOM_H - 2.5, wallT),
    MAT_WALL_ACCENT_DARK,
  );
  doorHeader.position.set(-halfW + 0.69, 2.5 + (ROOM_H - 2.5) / 2, halfD + wallT / 2);
  wallShellGroups.back.add(doorHeader);

  const doorOpening = new THREE.Mesh(
    new THREE.BoxGeometry(1.24, 2.5, 0.06),
    MAT_MATTE_CHARCOAL,
  );
  doorOpening.position.set(-halfW + 0.66, 1.25, halfD + wallT / 2);
  wallShellGroups.back.add(doorOpening);

  // Compact office chair silhouette near Shelf A
  const chairGroup = new THREE.Group();
  const chairSeat = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.08, 0.46),
    MAT_MATTE_CHARCOAL,
  );
  chairSeat.position.set(0, 0.46, 0);
  chairGroup.add(chairSeat);
  const chairBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.62, 0.08),
    MAT_MATTE_CHARCOAL,
  );
  chairBack.position.set(0, 0.78, -0.2);
  chairGroup.add(chairBack);
  const chairStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.44, 8),
    MAT_SHELF_FRAME,
  );
  chairStem.position.set(0, 0.22, 0);
  chairGroup.add(chairStem);
  chairGroup.position.set(2.05, 0, 1.78);
  chairGroup.rotation.y = -0.65;
  root.add(chairGroup);

  // Over-Shelf display hitboxes
  addWallHitbox(
    wallShellGroups.right,
    0.4,
    1.5,
    2.5,
    new THREE.Vector3(halfW - 0.1, 2.8, 1.88),
    'overshelf',
    'overshelf',
  );
  addWallHitbox(
    wallShellGroups.back,
    4.3,
    1.5,
    0.4,
    new THREE.Vector3(0.41, 2.8, halfD - 0.1),
    'overshelf',
    'overshelf',
  );

  // 6. Crisp Top-Edge Architectural Zone Plaques
  const addPlaque = (
    parent: THREE.Group,
    title: string,
    sub: string,
    pos: THREE.Vector3,
    rotX: number,
    rotY: number,
    rotZ: number,
    wallId: WallId,
    cameraView: CameraViewId,
  ) => {
    const tex = getWallLabelTexture(title, sub);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.36), mat);
    plaque.position.copy(pos);
    plaque.rotation.set(rotX, rotY, rotZ);
    plaque.layers.enable(1);
    plaque.userData = {
      kind: 'wall',
      wallId,
      cameraView,
    } satisfies InteractableMeta;
    parent.add(plaque);
    wallInteractables.push(plaque);
  };

  addPlaque(
    wallShellGroups.front,
    'FRONT WALL',
    'WINDOW & BARS',
    new THREE.Vector3(0, ROOM_H + 0.08, -halfD - 0.04),
    -Math.PI / 2,
    0,
    0,
    'front',
    'front',
  );
  addPlaque(
    wallShellGroups.left,
    'LEFT WALL',
    'STAIRS · COUNTER · CHURCH',
    new THREE.Vector3(-halfW - 0.04, ROOM_H + 0.08, 0),
    -Math.PI / 2,
    0,
    Math.PI / 2,
    'left',
    'left',
  );
  addPlaque(
    wallShellGroups.right,
    'RIGHT WALL',
    'MULTI-ROW DISPLAY',
    new THREE.Vector3(halfW + 0.04, ROOM_H + 0.08, -1.1),
    -Math.PI / 2,
    0,
    -Math.PI / 2,
    'right',
    'right',
  );
  addPlaque(
    wallShellGroups.back,
    'OVER-SHELF',
    'DISPLAY ABOVE A & B',
    new THREE.Vector3(0.4, ROOM_H + 0.08, halfD + 0.04),
    -Math.PI / 2,
    0,
    0,
    'overshelf',
    'overshelf',
  );

  return { wallShellGroups };
}

export function createShopScene(): ShopSceneHandles {
  const root = new THREE.Group();
  const dynamicGroup = new THREE.Group();
  const highlightGroup = new THREE.Group();
  const wallInteractables: THREE.Object3D[] = [];
  const interactables: THREE.Object3D[] = [];

  const { wallShellGroups } = buildStaticShopShell(root, wallInteractables);
  root.add(dynamicGroup);
  root.add(highlightGroup);

  const wallDisplayGroups: Record<'front' | 'left' | 'right' | 'back', THREE.Group> = {
    front: new THREE.Group(),
    left: new THREE.Group(),
    right: new THREE.Group(),
    back: new THREE.Group(),
  };
  dynamicGroup.add(wallDisplayGroups.front);
  dynamicGroup.add(wallDisplayGroups.left);
  dynamicGroup.add(wallDisplayGroups.right);
  dynamicGroup.add(wallDisplayGroups.back);

  const shelfWorldPositions = new Map<string, THREE.Vector3>();
  const displayWorldPositions = new Map<string, THREE.Vector3>();

  let createdGeometries: THREE.BufferGeometry[] = [];
  let createdMaterials: THREE.Material[] = [];

  const clearDynamic = () => {
    for (const g of Object.values(wallDisplayGroups)) {
      while (g.children.length > 0) g.remove(g.children[0]);
    }
    const keepGroups = new Set<THREE.Object3D>(Object.values(wallDisplayGroups));
    for (let i = dynamicGroup.children.length - 1; i >= 0; i -= 1) {
      const ch = dynamicGroup.children[i];
      if (!keepGroups.has(ch)) {
        dynamicGroup.remove(ch);
      }
    }
    while (highlightGroup.children.length > 0) {
      highlightGroup.remove(highlightGroup.children[0]);
    }
    for (const g of createdGeometries) g.dispose();
    for (const m of createdMaterials) m.dispose();
    createdGeometries = [];
    createdMaterials = [];
    interactables.length = 0;
    interactables.push(...wallInteractables);
    shelfWorldPositions.clear();
    displayWorldPositions.clear();
  };

  const updateCutawayVisibility = (camera: THREE.Camera) => {
    // Only cut away blocking walls when orbiting at horizontal / eye-level elevation
    const isTopOverview = camera.position.y >= 5.2;
    const hideFront = !isTopOverview && camera.position.z < -3.25;
    const hideLeft = !isTopOverview && camera.position.x < -3.25;
    const hideRight = !isTopOverview && camera.position.x > 3.25;
    const hideBack = !isTopOverview && camera.position.z > 3.25;

    wallShellGroups.front.visible = !hideFront;
    wallDisplayGroups.front.visible = !hideFront;

    wallShellGroups.left.visible = !hideLeft;
    wallDisplayGroups.left.visible = !hideLeft;

    wallShellGroups.right.visible = !hideRight;
    wallDisplayGroups.right.visible = !hideRight;

    wallShellGroups.back.visible = !hideBack;
    wallDisplayGroups.back.visible = !hideBack;
  };

  const rebuildInventory = (
    state: ShopState,
    selectedDisplayId: string | null,
    highlightedStorage: StorageLocation | null,
  ) => {
    clearDynamic();

    const { byRowId, topHeights } = computeShelfLayouts(state.shelfRows);
    const sectionPlacements = computeSectionPlacements(
      state.sections,
      topHeights,
    );

    // 1. Build dynamic L-Shaped Shelving Frames & Boards matching current shelf count!
    const buildShelfFrame = (
      shelfId: ShelfId,
      topY: number,
      postsX: number[],
      postsZ: number[],
      boardSize: [number, number, number],
      boardCenter: [number, number],
    ) => {
      const frameH = topY + 0.04;
      const postGeo = new THREE.BoxGeometry(0.045, frameH, 0.045);
      createdGeometries.push(postGeo);
      for (const px of postsX) {
        for (const pz of postsZ) {
          const post = new THREE.Mesh(postGeo, MAT_SHELF_FRAME);
          post.position.set(px, frameH / 2, pz);
          post.castShadow = true;
          dynamicGroup.add(post);
        }
      }

      const boardGeo = new THREE.BoxGeometry(
        boardSize[0],
        boardSize[1],
        boardSize[2],
      );
      createdGeometries.push(boardGeo);
      const rows = state.shelfRows.filter((r) => r.shelfId === shelfId);
      for (const row of rows) {
        const layout = byRowId.get(row.id);
        if (!layout) continue;
        const board = new THREE.Mesh(boardGeo, MAT_SHELF_BOARD);
        board.position.set(boardCenter[0], layout.boardY - 0.02, boardCenter[1]);
        board.castShadow = true;
        board.receiveShadow = true;
        dynamicGroup.add(board);
      }
    };

    buildShelfFrame(
      'A',
      topHeights.A,
      [2.62, 3.1],
      [0.68, 1.88, 3.08],
      [0.52, 0.032, 2.44],
      [2.86, 1.88],
    );
    buildShelfFrame(
      'B',
      topHeights.B,
      [-1.72, -0.3, 1.12, 2.54],
      [2.62, 3.1],
      [4.3, 0.032, 0.52],
      [0.41, 2.86],
    );

    // 2. Build all Display Sections dynamically
    for (const section of state.sections) {
      const count = section.slots.length;
      if (count === 0) continue;

      const placement = sectionPlacements.get(section.id);
      if (!placement) continue;

      const targetGroup = wallDisplayGroups[placement.wallGroupKey];
      const gap = Math.min(0.035, placement.span / Math.max(count * 6, 1));
      const slotW = Math.min(
        placement.maxTileW,
        Math.max(0.08, (placement.span - gap * (count - 1)) / count),
      );
      const totalUsed = count * slotW + (count - 1) * gap;
      const startOffset = -totalUsed / 2 + slotW / 2;

      const rodGeo = new THREE.CylinderGeometry(
        0.01,
        0.01,
        placement.span + 0.12,
        8,
      );
      createdGeometries.push(rodGeo);
      const rodMesh = new THREE.Mesh(rodGeo, MAT_MATTE_CHARCOAL);
      rodMesh.position
        .copy(placement.origin)
        .addScaledVector(placement.normal, 0.025);
      rodMesh.position.y += placement.tileH / 2 + 0.02;
      if (Math.abs(placement.axis.x) > 0.5) {
        rodMesh.rotation.z = Math.PI / 2;
      } else {
        rodMesh.rotation.x = Math.PI / 2;
      }
      targetGroup.add(rodMesh);

      const panelGeo = new THREE.BoxGeometry(slotW, placement.tileH, 0.024);
      createdGeometries.push(panelGeo);

      for (let idx = 0; idx < count; idx += 1) {
        const slot = section.slots[idx];
        const offsetAlongAxis = startOffset + idx * (slotW + gap);

        const pos = placement.origin
          .clone()
          .addScaledVector(placement.axis, offsetAlongAxis)
          .addScaledVector(placement.normal, 0.045);

        const tex = getDisplayTileTexture(
          slot.position,
          slot.displayNumber,
          section.kind,
          slot.priceLabel,
        );
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          color: 0xffffff,
          roughness: 0.88,
          metalness: 0.02,
        });
        createdMaterials.push(mat);

        const mesh = new THREE.Mesh(panelGeo, mat);
        mesh.position.copy(pos);

        const lookTarget = pos.clone().add(placement.normal);
        mesh.lookAt(lookTarget);
        mesh.rotateX(-placement.tiltOut);

        mesh.castShadow = true;
        mesh.layers.enable(1);
        mesh.userData = {
          kind: 'display',
          wallId: section.wallId,
          slot,
          section,
        } satisfies InteractableMeta;

        targetGroup.add(mesh);
        interactables.push(mesh);
        displayWorldPositions.set(slot.id, pos.clone());

        if (selectedDisplayId === slot.id) {
          const frameGeo = new THREE.BoxGeometry(
            slotW + 0.045,
            placement.tileH + 0.045,
            0.036,
          );
          createdGeometries.push(frameGeo);
          const edgesGeo = new THREE.EdgesGeometry(frameGeo);
          createdGeometries.push(edgesGeo);
          const edges = new THREE.LineSegments(edgesGeo, MAT_DISPLAY_RING);
          edges.position.copy(pos);
          edges.quaternion.copy(mesh.quaternion);
          highlightGroup.add(edges);

          const backGlow = new THREE.Mesh(frameGeo, MAT_HIGHLIGHT_ACCENT);
          backGlow.position
            .copy(pos)
            .addScaledVector(placement.normal, -0.015);
          backGlow.quaternion.copy(mesh.quaternion);
          highlightGroup.add(backGlow);
        }
      }
    }

    // 3. Build all Storage Shelf Stacks dynamically
    for (const row of state.shelfRows) {
      const count = row.count;
      const layout = byRowId.get(row.id);
      if (!layout) continue;

      const isTargetRow =
        highlightedStorage !== null &&
        highlightedStorage.shelfId === row.shelfId &&
        highlightedStorage.rowKey === row.rowKey;

      if (isTargetRow) {
        const bandW =
          row.shelfId === 'A' ? layout.depth + 0.08 : layout.span + 0.1;
        const bandD =
          row.shelfId === 'A' ? layout.span + 0.1 : layout.depth + 0.08;
        const bandGeo = new THREE.BoxGeometry(
          bandW,
          layout.stackH + 0.06,
          bandD,
        );
        createdGeometries.push(bandGeo);
        const bandMesh = new THREE.Mesh(bandGeo, MAT_HIGHLIGHT_ROW);
        bandMesh.position.set(
          layout.center.x,
          layout.boardY + (layout.stackH + 0.06) / 2,
          layout.center.z,
        );
        highlightGroup.add(bandMesh);
      }

      if (count === 0) continue;

      const gap = Math.min(0.025, layout.span / Math.max(count * 8, 1));
      const stackW = Math.min(
        0.24,
        Math.max(0.06, (layout.span - gap * (count - 1)) / count),
      );
      const stackH = layout.stackH;
      const stackD = 0.36;
      const totalUsed = count * stackW + (count - 1) * gap;
      const startOffset = -totalUsed / 2 + stackW / 2;

      const stackGeo = new THREE.BoxGeometry(stackW, stackH, stackD);
      createdGeometries.push(stackGeo);

      for (let col = 1; col <= count; col += 1) {
        const offset = startOffset + (col - 1) * (stackW + gap);
        const pos = layout.center
          .clone()
          .addScaledVector(layout.axis, offset);
        pos.y = layout.boardY + stackH / 2 + 0.004;

        const isTargetCell =
          isTargetRow && highlightedStorage?.column === col;

        const tex = getShelfStackTexture(col, row.isTop);
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          color: isTargetCell ? 0xffffff : 0xf4f4f5,
          emissive: isTargetCell ? 0xdc2626 : 0x000000,
          emissiveIntensity: isTargetCell ? 0.38 : 0,
          roughness: 0.85,
          metalness: 0.03,
        });
        createdMaterials.push(mat);

        const stackMesh = new THREE.Mesh(stackGeo, mat);
        stackMesh.position.copy(pos);
        if (row.shelfId === 'A') {
          stackMesh.rotation.y = -Math.PI / 2;
        }
        stackMesh.castShadow = true;
        stackMesh.layers.enable(1);
        const loc: StorageLocation = {
          shelfId: row.shelfId,
          rowKey: row.rowKey,
          column: col,
        };
        stackMesh.userData = {
          kind: 'shelf',
          shelfLocation: loc,
        } satisfies InteractableMeta;

        dynamicGroup.add(stackMesh);
        interactables.push(stackMesh);
        shelfWorldPositions.set(storageKey(loc), pos.clone());

        if (isTargetCell) {
          const collarGeo = new THREE.BoxGeometry(
            stackW + 0.045,
            stackH + 0.045,
            stackD + 0.045,
          );
          createdGeometries.push(collarGeo);
          const edgesGeo = new THREE.EdgesGeometry(collarGeo);
          createdGeometries.push(edgesGeo);
          const edges = new THREE.LineSegments(edgesGeo, MAT_DISPLAY_RING);
          edges.position.copy(pos);
          edges.rotation.copy(stackMesh.rotation);
          highlightGroup.add(edges);

          const pinGeo = new THREE.ConeGeometry(0.065, 0.14, 4);
          createdGeometries.push(pinGeo);
          const pin = new THREE.Mesh(pinGeo, MAT_HIGHLIGHT_ACCENT);
          pin.position.copy(pos).addScaledVector(layout.normal, 0.24);
          pin.position.y += stackH / 2 + 0.14;
          pin.rotation.x = Math.PI;
          highlightGroup.add(pin);
        }
      }
    }
  };

  const dispose = () => {
    clearDynamic();
    floorDispose(root);
  };

  return {
    root,
    dynamicGroup,
    highlightGroup,
    interactables,
    shelfWorldPositions,
    displayWorldPositions,
    updateCutawayVisibility,
    rebuildInventory,
    dispose,
  };
}

function floorDispose(root: THREE.Group): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
    }
  });
}
