import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CameraViewId,
  DisplaySection,
  DisplaySlot,
  DisplaySubZone,
  ShelfId,
  ShopState,
  StorageLocation,
  WallId,
} from './types/shop';
import {
  addDisplayCapulana,
  addDisplayRow,
  addShelfCapulana,
  addShelfRow,
  createDefaultShopState,
  findDisplaySlotById,
  findDisplaysAtStorage,
  loadShopState,
  moveDisplayCapulana,
  reassignDisplayStorage,
  removeDisplayRow,
  removeShelfRow,
  saveShopState,
  setDisplayRowCount,
  setShelfRowCount,
  shuffleWallPositions,
} from './store/shopLayout';
import { TopBar } from './components/TopBar';
import { ShopViewport3D } from './components/ShopViewport3D';
import { ShelfLocationCard } from './components/ShelfLocationCard';
import { BottomDock } from './components/BottomDock';
import { LayoutEditorDrawer } from './components/LayoutEditorDrawer';
import { OfflineIndicator } from './components/PWAInstallButton';

export default function App() {
  const [shopState, setShopState] = useState<ShopState>(() => loadShopState());
  const [activeView, setActiveView] = useState<CameraViewId>('top');
  const [focusSequence, setFocusSequence] = useState(0);
  const [selectedDisplayId, setSelectedDisplayId] = useState<string | null>(
    null,
  );
  const [highlightedStorage, setHighlightedStorage] =
    useState<StorageLocation | null>(null);
  const [focusOnStorage, setFocusOnStorage] = useState<StorageLocation | null>(
    null,
  );
  const [inspectedShelfLoc, setInspectedShelfLoc] =
    useState<StorageLocation | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    saveShopState(shopState);
  }, [shopState]);

  const selectedDisplay = useMemo(
    () => findDisplaySlotById(shopState, selectedDisplayId),
    [shopState, selectedDisplayId],
  );

  const inspectedShelf = useMemo(() => {
    if (!inspectedShelfLoc || selectedDisplay) return null;
    return {
      location: inspectedShelfLoc,
      mappedDisplays: findDisplaysAtStorage(shopState, inspectedShelfLoc),
    };
  }, [shopState, inspectedShelfLoc, selectedDisplay]);

  const handleSelectView = useCallback((view: CameraViewId) => {
    setFocusOnStorage(null);
    setActiveView(view);
    setFocusSequence((n) => n + 1);
  }, []);

  const handleResetCamera = useCallback(() => {
    setFocusSequence((n) => n + 1);
  }, []);

  const handleWallClick = useCallback(
    (_wallId: WallId, cameraView: CameraViewId) => {
      setFocusOnStorage(null);
      setActiveView(cameraView);
      setFocusSequence((n) => n + 1);
    },
    [],
  );

  const handleDisplayClick = useCallback(
    (slot: DisplaySlot, _section: DisplaySection) => {
      setSelectedDisplayId(slot.id);
      setInspectedShelfLoc(null);
      setHighlightedStorage(slot.storage);
      setFocusOnStorage(slot.storage);
      setActiveView('shelves');
      setFocusSequence((n) => n + 1);
    },
    [],
  );

  const handleShelfClick = useCallback((location: StorageLocation) => {
    setSelectedDisplayId(null);
    setInspectedShelfLoc(location);
    setHighlightedStorage(location);
    setFocusOnStorage(location);
    setActiveView('shelves');
    setFocusSequence((n) => n + 1);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedDisplayId(null);
    setInspectedShelfLoc(null);
    setHighlightedStorage(null);
    setFocusOnStorage(null);
  }, []);

  const handleReturnToWall = useCallback((wallId: WallId) => {
    setFocusOnStorage(null);
    setActiveView(wallId);
    setFocusSequence((n) => n + 1);
  }, []);

  const handleSetDisplayRowCount = useCallback(
    (sectionId: string, count: number) => {
      setShopState((prev) => setDisplayRowCount(prev, sectionId, count));
    },
    [],
  );

  const handleAddDisplayRow = useCallback(
    (wallId: WallId, subZone?: DisplaySubZone) => {
      setShopState((prev) => addDisplayRow(prev, wallId, subZone, 10).state);
    },
    [],
  );

  const handleSetShelfRowCount = useCallback(
    (shelfRowId: string, count: number) => {
      setShopState((prev) => setShelfRowCount(prev, shelfRowId, count));
    },
    [],
  );

  const handleAddShelfRow = useCallback((shelfId: ShelfId) => {
    setShopState((prev) => addShelfRow(prev, shelfId, 12).state);
  }, []);

  const handleShuffleWall = useCallback((wallId: WallId) => {
    setShopState((prev) => shuffleWallPositions(prev, wallId));
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA')
      ) {
        return;
      }
      if (e.key === 'Escape') {
        if (editorOpen) setEditorOpen(false);
        else handleClearSelection();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editorOpen, handleClearSelection]);

  return (
    <div
      data-active-view={activeView}
      className="flex h-screen w-screen flex-col overflow-hidden bg-[#F4F4F2]"
    >
      <TopBar
        activeView={activeView}
        onSelectView={handleSelectView}
        onOpenEditor={() => setEditorOpen((prev) => !prev)}
      />

      <OfflineIndicator />

      <main className="relative flex-1 overflow-hidden">
        <ShopViewport3D
          shopState={shopState}
          activeView={activeView}
          focusSequence={focusSequence}
          selectedDisplayId={selectedDisplayId}
          highlightedStorage={highlightedStorage}
          focusOnStorage={focusOnStorage}
          onWallClick={handleWallClick}
          onDisplayClick={handleDisplayClick}
          onShelfClick={handleShelfClick}
          onResetCamera={handleResetCamera}
        />

        <ShelfLocationCard
          selectedDisplay={selectedDisplay}
          inspectedShelf={inspectedShelf}
          onReturnToWall={handleReturnToWall}
          onSelectDisplayFromShelf={handleDisplayClick}
          onClose={handleClearSelection}
        />

        <BottomDock
          activeView={activeView}
          shopState={shopState}
          selectedDisplayId={selectedDisplayId}
          editorOpen={editorOpen}
          onSelectView={handleSelectView}
          onSelectDisplay={handleDisplayClick}
          onSetDisplayRowCount={handleSetDisplayRowCount}
          onAddDisplayRow={handleAddDisplayRow}
          onSetShelfRowCount={handleSetShelfRowCount}
          onAddShelfRow={handleAddShelfRow}
          onShuffleWall={handleShuffleWall}
        />

        <LayoutEditorDrawer
          open={editorOpen}
          shopState={shopState}
          selectedDisplayId={selectedDisplayId}
          onClose={() => setEditorOpen(false)}
          onSetDisplayRowCount={handleSetDisplayRowCount}
          onAddDisplayCapulana={(sectionId) =>
            setShopState((prev) => addDisplayCapulana(prev, sectionId).state)
          }
          onAddDisplayRow={handleAddDisplayRow}
          onRemoveDisplayRow={(sectionId) =>
            setShopState((prev) => removeDisplayRow(prev, sectionId))
          }
          onSetShelfRowCount={handleSetShelfRowCount}
          onAddShelfCapulana={(shelfRowId) =>
            setShopState((prev) => addShelfCapulana(prev, shelfRowId, 1))
          }
          onAddShelfRow={handleAddShelfRow}
          onRemoveShelfRow={(shelfRowId) =>
            setShopState((prev) => removeShelfRow(prev, shelfRowId))
          }
          onReassignStorage={(slotId, storage) => {
            setShopState((prev) =>
              reassignDisplayStorage(prev, slotId, storage),
            );
            setHighlightedStorage(storage);
            setFocusOnStorage(storage);
            setFocusSequence((n) => n + 1);
          }}
          onMoveDisplay={(slotId, targetSectionId, targetPos) =>
            setShopState((prev) =>
              moveDisplayCapulana(prev, slotId, targetSectionId, targetPos),
            )
          }
          onShuffleWall={handleShuffleWall}
          onResetDefault={() => {
            setShopState(createDefaultShopState());
            handleClearSelection();
            handleSelectView('top');
          }}
        />
      </main>
    </div>
  );
}
