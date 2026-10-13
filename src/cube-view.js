import {
  AmbientLight, BoxGeometry, CanvasTexture, DirectionalLight, Group, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry,
  Scene, Shape, ShapeGeometry, Vector3, WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { facelets, turnInfo } from './cube-math.js';

export const faceColors = {
  U: { color: '#ffffff', ink: '#18251f', name: '白色' },
  R: { color: '#d41432', ink: '#ffffff', name: '红色' },
  F: { color: '#008647', ink: '#ffffff', name: '绿色' },
  D: { color: '#ffda00', ink: '#18251f', name: '黄色' },
  L: { color: '#ff8a00', ink: '#18251f', name: '橙色' },
  B: { color: '#1455dc', ink: '#ffffff', name: '蓝色' },
};

export function createCubeView(viewport) {
  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(7, 5.4, 8);
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.5 : 2));
  viewport.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;
  scene.add(new AmbientLight(0xffffff, 2.1));
  const light = new DirectionalLight(0xffffff, 2.5);
  light.position.set(4, 8, 6);
  scene.add(light);
  const cubeGroup = new Group();
  scene.add(cubeGroup);

  const cubieGeometry = new BoxGeometry(0.97, 0.97, 0.97);
  const cubieMaterial = new MeshStandardMaterial({ color: '#17241f', roughness: 0.65 });
  const shape = new Shape();
  const halfSize = 0.425;
  const radius = 0.065;
  shape.moveTo(-halfSize + radius, -halfSize);
  shape.lineTo(halfSize - radius, -halfSize);
  shape.quadraticCurveTo(halfSize, -halfSize, halfSize, -halfSize + radius);
  shape.lineTo(halfSize, halfSize - radius);
  shape.quadraticCurveTo(halfSize, halfSize, halfSize - radius, halfSize);
  shape.lineTo(-halfSize + radius, halfSize);
  shape.quadraticCurveTo(-halfSize, halfSize, -halfSize, halfSize - radius);
  shape.lineTo(-halfSize, -halfSize + radius);
  shape.quadraticCurveTo(-halfSize, -halfSize, -halfSize + radius, -halfSize);
  const stickerGeometry = new ShapeGeometry(shape);
  const stickerMaterials = Object.fromEntries(Object.entries(faceColors).map(
    ([face, { color }]) => [face, new MeshBasicMaterial({ color, toneMapped: false })],
  ));
  const letterGeometry = new PlaneGeometry(0.42, 0.42);
  const letterMaterials = Object.fromEntries(Object.keys(faceColors).map(face => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.fillStyle = faceColors[face].ink;
    context.font = 'bold 96px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(face, 64, 68);
    return [face, new MeshBasicMaterial({ map: new CanvasTexture(canvas), transparent: true, depthWrite: false })];
  }));

  function paint(state) {
    cubeGroup.clear();
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;
          const cubie = new Mesh(cubieGeometry, cubieMaterial);
          cubie.position.set(x, y, z);
          cubeGroup.add(cubie);
        }
      }
    }
    facelets.forEach(({ position, normal }, index) => {
      const sticker = new Mesh(stickerGeometry, stickerMaterials[state[index]]);
      sticker.position.fromArray(position).addScaledVector(new Vector3(...normal), 0.491);
      sticker.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(...normal));
      cubeGroup.add(sticker);
      if (index % 9 === 4) {
        const letter = new Mesh(letterGeometry, letterMaterials[state[index]]);
        letter.position.copy(sticker.position).addScaledVector(new Vector3(...normal), 0.003);
        letter.quaternion.copy(sticker.quaternion);
        cubeGroup.add(letter);
      }
    });
  }

  new ResizeObserver(() => {
    const { width, height } = viewport.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.fov = width / height < 0.8 ? 43 : 34;
    camera.updateProjectionMatrix();
  }).observe(viewport);
  const render = () => {
    controls.update();
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(render);
  document.addEventListener('visibilitychange', () => renderer.setAnimationLoop(document.hidden ? null : render));

  async function animate(move, duration = 260) {
    const { normal, angle } = turnInfo(move);
    const axis = new Vector3(...normal);
    const layer = new Group();
    cubeGroup.add(layer);
    for (const child of [...cubeGroup.children]) {
      if (child !== layer && child.position.dot(axis) > 0.5) layer.attach(child);
    }
    const start = performance.now();
    await new Promise(resolve => {
      function frame(time) {
        const progress = Math.min(1, (time - start) / duration);
        layer.quaternion.setFromAxisAngle(axis, angle * (progress * progress * (3 - 2 * progress)));
        if (progress < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  function reset() {
    camera.position.set(7, 5.4, 8);
    controls.target.set(0, 0, 0);
    controls.update();
  }
  return { paint, animate, reset };
}
