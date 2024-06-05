import * as THREE from 'three';
import { WebGLPathTracer, GradientEquirectTexture } from 'three-gpu-pathtracer'
import { RectAreaLightHelper } from 'three/examples/jsm/Addons.js';

import { LoaderElement } from "./LoaderElement.js";
import { loadModel } from './ModelLoader.js'

const rad = (deg) => deg * (Math.PI / 180)

// Settings
const textureConfig = [
    { name: "bricks", repeat: [2, 1], file: "bricks.jpg" },
    { name: "wood", repeat: [3, 3], file: "wood.jpg" },
    { name: "floor", repeat: [1, 1], file: "floor.jpg" },
    { name: "mercury", repeat: [1, 1], file: "mercury-1.png" },
    { name: "venus", repeat: [1, 1], file: "venus.png" },
    { name: "earth", repeat: [1, 1], file: "earth.png" },
    { name: "mars", repeat: [1, 1], file: "mars.png" },
    { name: "jupitar", repeat: [1, 1], file: "jupitar.png" },
    { name: "saturn", repeat: [1, 1], file: "saturn.png" },
    { name: "saturnRing", repeat: [1, 1], file: "saturn-rings.png" },
    { name: "uranus", repeat: [1, 1], file: "uranus.png" },
    { name: "neptune", repeat: [1, 1], file: "neptune.png" },

]

const models = [
    { url: './models/cooker.glb', position: [-1.35, 0.85, 1.1], rotation: [0, -45, 0], scale: 0.625 },
    { url: './models/shield.glb', position: [0, 1.5, -2], rotation: [0, 0, 0], scale: 0.875 },
    { url: './models/iron_man.glb', position: [1.25, 0, -1], rotation: [0, -30, 0], scale: 1.25 },
    { url: './models/knight.glb', position: [-1.25, 1.125, -1], rotation: [0, 30, 0], scale: 1.25 },
]

// Init scene
const scene = new THREE.Scene();
const axesHelper = new THREE.AxesHelper(200)
scene.add(axesHelper)

// Lighting 
const rectLight = new THREE.RectAreaLight("#FFFFFF", 2, 1, 2)
const rectLightHelper = new RectAreaLightHelper(rectLight)
rectLight.castShadow = true
rectLight.power = 50
rectLight.position.set(0, 3, -1)
rectLight.lookAt(0, 0, -1)
rectLight.add(rectLightHelper)
scene.add(rectLight)

// Textures
const textureLoader = new THREE.TextureLoader()
const textures = {}
textureConfig.forEach(({ name, repeat, file }) => {
    textures[name] = textureLoader.load(`./textures/${file}`, (texture) => {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(repeat[0], repeat[1])
        texture.colorSpace = THREE.SRGBColorSpace
    })
})


/* Walls */
const leftWall = (_ => {
    const geo = new THREE.PlaneGeometry(4, 3);
    const mat = new THREE.MeshPhongMaterial({ color: "#ffcc00", reflectivity: 0.25 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.y = rad(90);
    mesh.position.set(-2, 1.5, 0);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
})();
const rightWall = (_ => {
    const geo = new THREE.PlaneGeometry(4, 3);
    const mat = new THREE.MeshPhongMaterial({ color: "#00ccff", w: 0.25 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.y = rad(-90);
    mesh.position.set(2, 1.5, 0);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
})();
const backWall = (_ => {
    const geo = new THREE.PlaneGeometry(4, 3);
    const mat = new THREE.MeshPhysicalMaterial({ map: textures.bricks, metalness: 0, roughness: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 1.5, -2);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
})();
const ceiling = (_ => {
    const geo = new THREE.PlaneGeometry(4, 4);
    const mat = new THREE.MeshPhysicalMaterial({ color: "#fff", reflectivity: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = rad(90);
    mesh.position.set(0, 3, 0);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
})();
const floor = (_ => {
    const geo = new THREE.PlaneGeometry(4, 4);
    const mat = new THREE.MeshPhysicalMaterial({ map: textures.floor, color: "#fff", reflectivity: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI * -.5;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
})();

/* Objects */

const solarGroup = new THREE.Group()
const solar = {
    earth: (() => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 64, 64),
            new THREE.MeshStandardMaterial({
                map: textures.earth,
                color: '#ffffff',
                roughness: 1,
                metalness: 0,
            }))
        mesh.position.set(-0.75, 0.35, 0.65)
        mesh.rotation.z = rad(23)
        mesh.castShadow = true
        return mesh
    })(),
    mars: (() => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 64, 64),
            new THREE.MeshStandardMaterial({
                map: textures.mars,
                color: '#ffffff',
                roughness: 1,
                metalness: 0,
            }))
        mesh.position.set(-0.95, 0.25, 0.05)
        mesh.rotation.z = rad(25)
        mesh.castShadow = true
        return mesh
    })(),
    uranus: (() => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 64, 64),
            new THREE.MeshStandardMaterial({
                map: textures.uranus,
                color: '#ffffff',
                roughness: 1,
                metalness: 0,
            }))
        mesh.position.set(-0.7, 0.3, -0.7)
        mesh.rotation.z = rad(98)
        mesh.castShadow = true
        return mesh
    })(),
    venus: (() => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 64, 64),
            new THREE.MeshStandardMaterial({
                map: textures.venus,
                color: '#ffffff',
                roughness: 1,
                metalness: 0,
            }))
        mesh.position.set(0.05, 0.3, -0.95)
        mesh.castShadow = true
        mesh.rotation.z = rad(177)
        return mesh
    })(),
    mercury: (() => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 64, 64),
            new THREE.MeshStandardMaterial({
                map: textures.mercury,
                color: '#ffffff',
                roughness: 1,
                metalness: 0,
            }))
        mesh.position.set(0.75, 0.25, -0.75)
        mesh.rotation.z = rad(0.1)
        mesh.castShadow = true
        return mesh
    })(),
    jupitar: (() => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 64, 64),
            new THREE.MeshStandardMaterial({
                map: textures.jupitar,
                color: '#ffffff',
                roughness: 1,
                metalness: 0,
            }))
        mesh.position.set(1.15, 0.2, 0)
        mesh.rotation.z = rad(3)
        mesh.castShadow = true
        return mesh
    })(),
    neptune: (() => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 64, 64),
            new THREE.MeshStandardMaterial({
                map: textures.neptune,
                color: '#ffffff',
                roughness: 1,
                metalness: 0,
            }))
        mesh.position.set(0.85, 0.25, 0.8)
        mesh.rotation.z = rad(30)
        mesh.castShadow = true
        return mesh
    })(),
    saturn: (() => {
        const planetMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 64, 64),
            new THREE.MeshStandardMaterial({
                map: textures.saturn,
                color: '#ffffff',
                roughness: 1,
                metalness: 0,
            }))
        const torusMesh = new THREE.Mesh(
            new THREE.TorusGeometry(0.425, 0.075, 4, 64),
            new THREE.MeshStandardMaterial({
                map: textures.saturnRing,
                color: '#ddddcc',
                roughness: 1,
                metalness: 0,
            })
        )
        torusMesh.rotation.set(rad(90), 0, 0)
        torusMesh.scale.z = 0.2
        const mesh = new THREE.Group()
        mesh.add(planetMesh, torusMesh)
        mesh.position.set(0.05, 0.2, 1.05)
        mesh.rotation.z = rad(27)
        mesh.castShadow = true
        return mesh
    })(),
}
solarGroup.add(...Object.values(solar))
scene.add(solarGroup)

const tableGroup = new THREE.Group()
const tableDim = { x: 1.4, y: 0.85, z: 1 }
const table = {
    board: (() => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(tableDim.x, 0.1, tableDim.z),
            new THREE.MeshPhysicalMaterial({
                map: textures.wood,
                color: '#ffffff',
                roughness: 0.8,
                metalness: 0.2,
                reflectivity: 0.5,
            })
        )
        mesh.position.y = tableDim.y - 0.1
        return mesh
    })(),
    leg1: new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, tableDim.y - 0.1, 64),
        new THREE.MeshPhysicalMaterial({ color: '#c9c9c9', reflectivity: 1, metalness: 1, roughness: 0.25 })
    ),
    leg2: new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, tableDim.y - 0.1, 64),
        new THREE.MeshPhysicalMaterial({ color: '#c9c9c9', reflectivity: 1, metalness: 1, roughness: 0.25 })
    ),
    leg3: new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, tableDim.y - 0.1, 64),
        new THREE.MeshPhysicalMaterial({ color: '#c9c9c9', reflectivity: 1, metalness: 1, roughness: 0.25 })
    ),
    leg4: new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, tableDim.y - 0.1, 64),
        new THREE.MeshPhysicalMaterial({ color: '#c9c9c9', reflectivity: 1, metalness: 1, roughness: 0.25 })
    )
}

table.leg1.position.set(tableDim.x / 2 - 0.1, (tableDim.y - 0.1) / 2, tableDim.z / 2 - 0.1)
table.leg2.position.set(0.1 - tableDim.x / 2, (tableDim.y - 0.1) / 2, 0.1 - tableDim.z / 2)
table.leg3.position.set(tableDim.x / 2 - 0.1, (tableDim.y - 0.1) / 2, 0.1 - tableDim.z / 2)
table.leg4.position.set(0.1 - tableDim.x / 2, (tableDim.y - 0.1) / 2, tableDim.z / 2 - 0.1)

tableGroup.add(...Object.values(table))
tableGroup.position.set(-1.25, 0, 1.1)

scene.add(tableGroup)

/* Utils */
const getScaledSettings = () => {
    let tiles = 3;
    let renderScale = Math.max(1 / window.devicePixelRatio, 0.5);
    const aspectRatio = window.innerWidth / window.innerHeight;
    if (aspectRatio < 0.65) {
        tiles = 4;
        renderScale = 0.5 / window.devicePixelRatio;
    }
    return { tiles, renderScale };
}

// set the environment map
const texture = new GradientEquirectTexture();
texture.bottomColor.set(0xffffff);
texture.bottomColor.set(0x666666);
texture.update();
scene.environment = texture;
scene.background = texture;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// Camera & control
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 500);
camera.position.set(0, 1.5, 5.5)
// camera.lookAt(0, 0, 0)

const settings = getScaledSettings()
const pathTracer = new WebGLPathTracer(renderer)
pathTracer.bounces = 3
pathTracer.minSamples = 1
pathTracer.dynamicLowRes = true
pathTracer.lowResScale = 0.75
pathTracer.renderScale = settings.renderScale
pathTracer.tiles.setScalar(settings.tiles)


const animate = () => {
    requestAnimationFrame(animate);
    pathTracer.renderSample();
}

const onResize = async () => {
    const loader = new LoaderElement();
    loader.attach(document.body);

    const w = window.innerWidth;
    const h = window.innerHeight;

    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);

    const aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    for await (const model of models) {
        scene.add(await loadModel(loader, model))
    }

    pathTracer.setScene(scene, camera);
}

window.addEventListener('resize', () => onResize())

document.addEventListener("keyup", (event) => {
    if (event.isComposing || event.key === ' ') {
        onResize()
        return
    }
    switch (event.key) {
        case 'w':
            camera.position.z -= 0.25
            pathTracer.setCamera(camera)
            break
        case 'a':
            camera.position.x -= 0.25
            pathTracer.setCamera(camera)
            break
        case 's':
            camera.position.z += 0.25
            pathTracer.setCamera(camera)
            break
        case 'd':
            camera.position.x += 0.25
            pathTracer.setCamera(camera)
            break
        case 'q':
            camera.position.y += 0.25
            pathTracer.setCamera(camera)
            break
        case 'e':
            camera.position.y -= 0.25
            pathTracer.setCamera(camera)
            break
        case 'ArrowLeft':
            camera.rotation.y += rad(10)
            pathTracer.setCamera(camera)
            break
        case 'ArrowRight':
            camera.rotation.y += rad(-10)
            pathTracer.setCamera(camera)
            break
        case 'ArrowUp':
            camera.rotation.x += rad(10)
            pathTracer.setCamera(camera)
            break
        case 'ArrowDown':
            camera.rotation.x += rad(-10)
            pathTracer.setCamera(camera)
            break

    }
})

pathTracer.setScene(scene, camera);
onResize();
animate();
