import { useEffect, useRef, useState } from "react";
import { Orbit, Pause, Play, RotateCcw } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function Manifold() {
  const host = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const reset = useRef<() => void>(() => {});
  const [isPaused, setIsPaused] = useState(false);
  const [variant, setVariant] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: false,
      });
    } catch {
      setFailed(true);
      return;
    }
    setFailed(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Вращающаяся трёхмерная математическая структура",
    );
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 12.5);
    const geometry =
      variant === 0
        ? new THREE.TorusKnotGeometry(1.83, 0.53, 300, 34, 2, 3)
        : new THREE.TorusKnotGeometry(1.83, 0.48, 300, 34, 3, 4);
    const material = new THREE.PointsMaterial({
      color: 0xededed,
      size: 0.014,
      transparent: true,
      opacity: 0.87,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geometry, material);
    const group = new THREE.Group();
    group.add(points);
    group.rotation.set(0.65, 0.3, -0.35);
    scene.add(group);
    const wireSurface = new THREE.TorusKnotGeometry(
      1.83,
      variant === 0 ? 0.53 : 0.48,
      110,
      12,
      variant === 0 ? 2 : 3,
      variant === 0 ? 3 : 4,
    );
    const linesGeometry = new THREE.WireframeGeometry(wireSurface);
    wireSurface.dispose();
    const linesMaterial = new THREE.LineBasicMaterial({
      color: 0x999999,
      transparent: true,
      opacity: 0.115,
    });
    group.add(new THREE.LineSegments(linesGeometry, linesMaterial));
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.rotateSpeed = 0.4;
    controls.autoRotateSpeed = 0.5;
    controls.minPolarAngle = 0.3;
    controls.maxPolarAngle = Math.PI - 0.3;
    let firstRender = true;
    const invalidate = () => {
      firstRender = true;
    };
    controls.addEventListener("change", invalidate);
    reset.current = () => controls.reset();
    let visible = true;
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) invalidate();
    });
    visibility.observe(container);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      invalidate();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    let frame = 0;
    let lastRender = 0;
    const render = (time: number) => {
      frame = requestAnimationFrame(render);
      if (!visible || document.hidden || time - lastRender < 40) return;
      lastRender = time;
      controls.autoRotate = !paused.current && !reduced.matches;
      if (controls.update() || firstRender) {
        renderer.render(scene, camera);
        firstRender = false;
      }
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      controls.removeEventListener("change", invalidate);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      linesGeometry.dispose();
      linesMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [variant]);

  return (
    <div className="manifold">
      <div ref={host} className="manifold-canvas" />
      {failed && (
        <div
          className="manifold-fallback"
          aria-label="Математическая структура"
        >
          ∫<span>∞</span>
        </div>
      )}
      <span className="scene-note scene-note-top mono">
        FIG. 001 / LATENT SPACE
      </span>
      <span className="scene-note scene-note-bottom mono">ℝⁿ → ℝᵐ</span>
      <div className="scene-controls">
        <button
          className="icon-button"
          title="Изменить структуру"
          aria-label="Изменить структуру"
          onClick={() => setVariant((v) => 1 - v)}
        >
          <Orbit size={16} />
        </button>
        <button
          className="icon-button"
          title={isPaused ? "Продолжить вращение" : "Остановить вращение"}
          aria-label={isPaused ? "Продолжить вращение" : "Остановить вращение"}
          onClick={() => {
            paused.current = !paused.current;
            setIsPaused(paused.current);
          }}
        >
          {isPaused ? <Play size={14} /> : <Pause size={14} />}
        </button>
        <button
          className="icon-button"
          title="Вернуть ракурс"
          aria-label="Вернуть ракурс"
          onClick={() => reset.current()}
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
