import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  LocateFixed,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type {
  CameraViewId,
  DisplaySection,
  DisplaySlot,
  ShopState,
  StorageLocation,
  WallId,
} from '../types/shop';
import {
  CAMERA_PRESETS,
  computeShelfFocusCamera,
  createShopScene,
  type InteractableMeta,
  type ShopSceneHandles,
} from '../three/shopGeometry';
import {
  disposeProceduralTextures,
  setTextureAnisotropy,
} from '../three/proceduralTextures';

interface ShopViewport3DProps {
  shopState: ShopState;
  activeView: CameraViewId;
  focusSequence: number;
  selectedDisplayId: string | null;
  highlightedStorage: StorageLocation | null;
  focusOnStorage: StorageLocation | null;
  onWallClick: (wallId: WallId, cameraView: CameraViewId) => void;
  onDisplayClick: (slot: DisplaySlot, section: DisplaySection) => void;
  onShelfClick: (location: StorageLocation) => void;
  onResetCamera: () => void;
}

const _mouse = new THREE.Vector2();
const _raycaster = new THREE.Raycaster();
_raycaster.layers.set(1);
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _deltaVec = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function ShopViewport3D({
  shopState,
  activeView,
  focusSequence,
  selectedDisplayId,
  highlightedStorage,
  focusOnStorage,
  onWallClick,
  onDisplayClick,
  onShelfClick,
  onResetCamera,
}: ShopViewport3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const callbacksRef = useRef({
    onWallClick,
    onDisplayClick,
    onShelfClick,
  });
  callbacksRef.current = {
    onWallClick,
    onDisplayClick,
    onShelfClick,
  };

  const shopStateRef = useRef(shopState);
  shopStateRef.current = shopState;

  const sceneHandlesRef = useRef<ShopSceneHandles | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRenderRef = useRef<() => void>(() => {});
  const cameraGoalRef = useRef<{
    active: boolean;
    position: THREE.Vector3;
    target: THREE.Vector3;
    fov: number;
  }>({
    active: false,
    position: CAMERA_PRESETS.top.position.clone(),
    target: CAMERA_PRESETS.top.target.clone(),
    fov: CAMERA_PRESETS.top.fov,
  });

  const panCamera = useCallback((dx: number, dy: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    cameraGoalRef.current.active = false;

    camera.getWorldDirection(_forward);
    _right.crossVectors(_forward, camera.up).normalize();
    _up.crossVectors(_right, _forward).normalize();

    const dist = camera.position.distanceTo(controls.target);
    const step = Math.max(0.45, dist * 0.14);

    _deltaVec
      .set(0, 0, 0)
      .addScaledVector(_right, dx * step)
      .addScaledVector(_up, dy * step);

    camera.position.add(_deltaVec);
    controls.target.add(_deltaVec);
    controls.update();
    requestRenderRef.current();
  }, []);

  const zoomCamera = useCallback((factor: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    cameraGoalRef.current.active = false;

    _deltaVec.subVectors(camera.position, controls.target);
    const currentDist = _deltaVec.length();
    const nextDist = THREE.MathUtils.clamp(
      currentDist * factor,
      controls.minDistance,
      controls.maxDistance,
    );
    _deltaVec.setLength(nextDist);
    camera.position.copy(controls.target).add(_deltaVec);
    controls.update();
    requestRenderRef.current();
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 240);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('data-testid', 'shop-3d-canvas');

    container.appendChild(renderer.domElement);
    setTextureAnisotropy(
      isSoftwareGl ? 1 : Math.min(4, renderer.capabilities.getMaxAnisotropy()),
    );

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f2);
    scene.fog = new THREE.Fog(0xf4f4f2, 18, 36);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const initialPreset = CAMERA_PRESETS.top;
    const camera = new THREE.PerspectiveCamera(
      initialPreset.fov,
      width / height,
      0.1,
      80,
    );
    camera.position.copy(initialPreset.position);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(initialPreset.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    controls.rotateSpeed = 0.78;
    controls.zoomSpeed = 1.25;
    controls.panSpeed = 1.15;
    controls.minDistance = 1.2;
    controls.maxDistance = 26;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.update();
    controlsRef.current = controls;

    // Warm/Cool Architectural Lighting Rig (<= 1 shadow caster)
    const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0xd4d4d0, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbf0, 1.35);
    keyLight.position.set(-4.5, 9.5, -3.5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 22;
      keyLight.shadow.camera.left = -5.5;
      keyLight.shadow.camera.right = 5.5;
      keyLight.shadow.camera.top = 5.5;
      keyLight.shadow.camera.bottom = -5.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xe2e8f0, 0.45);
    rimLight.position.set(5, 6, 6);
    scene.add(rimLight);

    const shopHandles = createShopScene();
    sceneHandlesRef.current = shopHandles;
    scene.add(shopHandles.root);

    shopHandles.rebuildInventory(
      shopState,
      selectedDisplayId,
      highlightedStorage,
    );

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = window.requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        const goal = cameraGoalRef.current;
        let animating = false;
        if (goal.active) {
          const lambda = isSoftwareGl ? 10.0 : 6.5;
          camera.position.x = THREE.MathUtils.damp(
            camera.position.x,
            goal.position.x,
            lambda,
            dt,
          );
          camera.position.y = THREE.MathUtils.damp(
            camera.position.y,
            goal.position.y,
            lambda,
            dt,
          );
          camera.position.z = THREE.MathUtils.damp(
            camera.position.z,
            goal.position.z,
            lambda,
            dt,
          );
          controls.target.x = THREE.MathUtils.damp(
            controls.target.x,
            goal.target.x,
            lambda,
            dt,
          );
          controls.target.y = THREE.MathUtils.damp(
            controls.target.y,
            goal.target.y,
            lambda,
            dt,
          );
          controls.target.z = THREE.MathUtils.damp(
            controls.target.z,
            goal.target.z,
            lambda,
            dt,
          );
          const nextFov = THREE.MathUtils.damp(camera.fov, goal.fov, lambda, dt);
          if (Math.abs(nextFov - camera.fov) > 0.01) {
            camera.fov = nextFov;
            camera.updateProjectionMatrix();
          }

          const posDist = camera.position.distanceTo(goal.position);
          const tgtDist = controls.target.distanceTo(goal.target);
          if (
            posDist < 0.012 &&
            tgtDist < 0.012 &&
            Math.abs(camera.fov - goal.fov) < 0.08
          ) {
            camera.position.copy(goal.position);
            controls.target.copy(goal.target);
            camera.fov = goal.fov;
            camera.updateProjectionMatrix();
            goal.active = false;
          } else {
            animating = true;
          }
        }

        const changed = controls.update();
        if (changed && controls.enableDamping) {
          animating = true;
        }

        shopHandles.updateCutawayVisibility(camera);
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty || animating) {
            requestRender();
          }
        };
        if (isSoftwareGl) {
          afterDraw(done);
        } else {
          done();
        }
      });
    };

    requestRenderRef.current = requestRender;

    const onControlStart = () => {
      cameraGoalRef.current.active = false;
    };
    const onControlChange = () => {
      requestRender();
    };
    controls.addEventListener('start', onControlStart);
    controls.addEventListener('change', onControlChange);

    // Click vs Drag handling for accurate 3D raycasting
    let pointerDownPos: { x: number; y: number } | null = null;
    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!pointerDownPos) return;
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      pointerDownPos = null;
      if (Math.hypot(dx, dy) > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_mouse, camera);
      const hits = _raycaster
        .intersectObjects(shopHandles.interactables, false)
        .filter((hit) => {
          // Ignore meshes inside hidden cutaway walls
          let cur: THREE.Object3D | null = hit.object;
          while (cur) {
            if (!cur.visible) return false;
            cur = cur.parent;
          }
          return true;
        });

      if (hits.length === 0) return;

      const prioritized =
        hits.find((h) => {
          const meta = h.object.userData as InteractableMeta;
          return meta.kind === 'display' || meta.kind === 'shelf';
        }) ?? hits[0];

      const meta = prioritized.object.userData as InteractableMeta;
      if (meta.kind === 'display' && meta.slot && meta.section) {
        callbacksRef.current.onDisplayClick(meta.slot, meta.section);
      } else if (meta.kind === 'shelf' && meta.shelfLocation) {
        callbacksRef.current.onShelfClick(meta.shelfLocation);
      } else if (meta.kind === 'wall' && meta.wallId && meta.cameraView) {
        callbacksRef.current.onWallClick(meta.wallId, meta.cameraView);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_mouse, camera);
      const hits = _raycaster.intersectObjects(shopHandles.interactables, false);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    // Keyboard WASD / Arrow / +/- navigation for effortless camera control
    const onKeyDown = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null;
      if (
        tgt &&
        (tgt.tagName === 'INPUT' ||
          tgt.tagName === 'SELECT' ||
          tgt.tagName === 'TEXTAREA')
      ) {
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        panCamera(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        panCamera(1, 0);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        panCamera(0, 1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        panCamera(0, -1);
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        zoomCamera(0.84);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomCamera(1.18);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
      requestRender();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener(
      'webglcontextrestored',
      onContextRestored,
    );

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(entry.contentRect.width, 1);
      const h = Math.max(entry.contentRect.height, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    });
    resizeObserver.observe(container);

    requestRender();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      resizeObserver.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('change', onControlChange);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        onContextRestored,
      );
      shopHandles.dispose();
      disposeProceduralTextures();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneHandlesRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
    // Mount WebGL scene once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild dynamic meshes when inventory counts or highlight change
  useEffect(() => {
    const handles = sceneHandlesRef.current;
    if (!handles) return;
    handles.rebuildInventory(
      shopState,
      selectedDisplayId,
      highlightedStorage,
    );
    requestRenderRef.current();
  }, [shopState, selectedDisplayId, highlightedStorage]);

  // Smoothly animate camera when view preset or storage focus target changes
  useEffect(() => {
    const handles = sceneHandlesRef.current;
    if (!handles) return;

    if (focusOnStorage) {
      const focusPreset = computeShelfFocusCamera(
        handles.shelfWorldPositions,
        shopStateRef.current.shelfRows,
        focusOnStorage,
      );
      cameraGoalRef.current = {
        active: true,
        position: focusPreset.position.clone(),
        target: focusPreset.target.clone(),
        fov: focusPreset.fov,
      };
    } else {
      const preset = CAMERA_PRESETS[activeView];
      cameraGoalRef.current = {
        active: true,
        position: preset.position.clone(),
        target: preset.target.clone(),
        fov: preset.fov,
      };
    }
    requestRenderRef.current();
  }, [activeView, focusOnStorage, focusSequence]);

  return (
    <div className="relative h-full w-full bg-[#F4F4F2]">
      <div ref={mountRef} className="h-full w-full" />

      {/* Compact Camera Navigation & Zoom Pad (bottom-left) */}
      <div
        aria-label="Camera Navigation"
        className="pointer-events-auto absolute bottom-4 left-4 z-10 hidden sm:flex flex-col gap-1 border border-zinc-300 bg-white p-1.5 shadow-xs"
      >
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => zoomCamera(0.8)}
            aria-label="Zoom in"
            title="Zoom in (+)"
            className="flex h-7 w-7 items-center justify-center border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => panCamera(0, 1)}
            aria-label="Move view up"
            title="Move up (W / Up)"
            className="flex h-7 w-7 items-center justify-center border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => zoomCamera(1.25)}
            aria-label="Zoom out"
            title="Zoom out (-)"
            className="flex h-7 w-7 items-center justify-center border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => panCamera(-1, 0)}
            aria-label="Move view left"
            title="Move left (A / Left)"
            className="flex h-7 w-7 items-center justify-center border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetCamera}
            aria-label="Reset camera view"
            title="Reset camera view"
            className="flex h-7 w-7 items-center justify-center border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <LocateFixed className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => panCamera(1, 0)}
            aria-label="Move view right"
            title="Move right (D / Right)"
            className="flex h-7 w-7 items-center justify-center border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => panCamera(0, -1)}
            aria-label="Move view down"
            title="Move down (S / Down)"
            className="flex h-7 w-7 items-center justify-center border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F4F4F2] p-6">
          <div className="border border-zinc-300 bg-white px-6 py-4 text-sm text-zinc-800">
            3D viewport paused. Restoring graphics context...
          </div>
        </div>
      )}
    </div>
  );
}
