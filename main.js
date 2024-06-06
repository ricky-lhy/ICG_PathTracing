import * as THREE from 'three';
import { WebGLPathTracer } from 'three-gpu-pathtracer'

import { LoaderElement } from "./LoaderElement.js";
import { loadModel } from './ModelLoader.js'

const rad = (deg) => deg * (Math.PI / 180)

const config = {
    bounces: 5,
    renderScale: .5,
}

// Settings
const textureConfig = [
    { name: "bricks", repeat: [2, 1], file: "bricks.jpg" },
    { name: "wood", repeat: [3, 3], file: "wood.jpg" },
    { name: "floor", repeat: [1, 2], file: "floor.jpg" },
    { name: "sun", repeat: [1, 1], file: "sun.jpg" },
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
    { url: './models/cooker.glb', position: [-1.1, 0.6, 1.3], rotation: [0, -45, 0], scale: 0.5 },
    { url: './models/teapot.glb', position: [-1.35, 0.6, 2], rotation: [0, -45, 0], scale: 0.5 },
    { url: './models/shield.glb', position: [0, 1.5, -2], rotation: [0, 0, 0], scale: 0.875 },
    { url: './models/iron_man.glb', position: [1.25, 0, -0.5], rotation: [0, -30, 0], scale: 1.25 },
    { url: './models/knight.glb', position: [-1.25, 1.125, -0.5], rotation: [0, 30, 0], scale: 1.25 },
]

// Init scene
const scene = new THREE.Scene();

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

// Lighting 
const lightGroup = new THREE.Group()
const light = {
    boxZm: (() => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.7, 0.125, 0.1),
            new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", reflectivity: 0.5 })
        )
        mesh.position.set(0, 2.9375, 0.8)
        return mesh
    })(),
    boxZp: (() => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.7, 0.125, 0.1),
            new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", reflectivity: 0.5 })
        )
        mesh.position.set(0, 2.9375, -0.8)
        return mesh
    })(),
    boxXm: (() => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.125, 1.7),
            new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", reflectivity: 0.5 })
        )
        mesh.position.set(0.8, 2.9375, 0)
        return mesh
    })(),
    boxXp: (() => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.125, 1.7),
            new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", reflectivity: 0.5 })
        )
        mesh.position.set(-0.8, 2.9375, 0)
        return mesh
    })(),
    boxLight: (() => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.1, 1.5),
            new THREE.MeshPhysicalMaterial({ emissiveIntensity: 10, emissive: '#FFFFFF' })
        )
        mesh.position.set(0, 2.9375, 0)
        return mesh
    })(),
}
lightGroup.add(...Object.values(light))
scene.add(lightGroup)


/* Walls */
const leftWall = (_ => {
    const geo = new THREE.PlaneGeometry(8, 3);
    const mat = new THREE.MeshPhongMaterial({ color: "#ffcc00", reflectivity: 0.25 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.y = rad(90);
    mesh.position.set(-2, 1.5, 0);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
})();
const rightWall = (_ => {
    const geo = new THREE.PlaneGeometry(8, 3);
    const mat = new THREE.MeshPhongMaterial({ color: "#00ccff", reflectivity: 0.25 });
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
    const geo = new THREE.PlaneGeometry(4, 8);
    const mat = new THREE.MeshPhysicalMaterial({ color: "#fff", reflectivity: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = rad(90);
    mesh.position.set(0, 3, 0);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
})();
const floor = (_ => {
    const geo = new THREE.PlaneGeometry(4, 8);
    const mat = new THREE.MeshPhysicalMaterial({ map: textures.floor, color: "#fff", reflectivity: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = rad(-90);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
})();

/* Solar system */
const solarGroup = new THREE.Group()
const solar = {
    sun: (() => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 64, 64),
            new THREE.MeshPhongMaterial({
                emissive: '#ffffff',
                emissiveMap: textures.sun,
                emissiveIntensity: 5,
            }))
        mesh.position.set(0, 0.3, 0)
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
        mesh.position.set(-0.75, 0.35, 0.65)
        mesh.rotation.z = rad(177)
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
    earth: (() => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 64, 64),
            new THREE.MeshStandardMaterial({
                map: textures.earth,
                color: '#ffffff',
                roughness: 1,
                metalness: 0,
            }))
        mesh.position.set(0.05, 0.5, -0.95)
        mesh.castShadow = true
        mesh.rotation.z = rad(23)
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
        mesh.position.set(1.05, 0.2, 0)
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
        mesh.position.set(0.75, 0.25, 0.8)
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
                transparent: true,
                opacity: 0.9,
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
        mesh.rotation.z = rad(-27)
        mesh.castShadow = true
        return mesh
    })(),
}
solarGroup.add(...Object.values(solar))
solarGroup.scale.set(0.625, 0.625, 0.625)
solarGroup.position.set(1, 2, 2.5)
solarGroup.rotation.set(rad(30), 0, rad(15))
scene.add(solarGroup)

// Table
const tableGroup = new THREE.Group()
const tableDim = { x: 1, y: 0.6, z: 2, t: 0.05 }
const tableLegMesh = () => new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, tableDim.y - tableDim.t, 64),
    new THREE.MeshPhysicalMaterial({ color: '#c9c9c9', reflectivity: 1, metalness: 1, roughness: 0.25 })
)
const table = {
    board: (() => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(tableDim.x, tableDim.t, tableDim.z),
            new THREE.MeshPhysicalMaterial({
                map: textures.wood,
                color: '#ffffff',
                roughness: 0.8,
                metalness: 0.2,
                reflectivity: 0.5,
            })
        )
        mesh.position.y = tableDim.y - tableDim.t
        return mesh
    })(),
    leg0: (() => {
        const mesh = tableLegMesh()
        mesh.position.set(tableDim.x / 2 - 0.1, (tableDim.y - tableDim.t) / 2, tableDim.z / 2 - 0.1)
        return mesh
    })(),
    leg1: (() => {
        const mesh = tableLegMesh()
        mesh.position.set(0.1 - tableDim.x / 2, (tableDim.y - tableDim.t) / 2, 0.1 - tableDim.z / 2)
        return mesh
    })(),
    leg2: (() => {
        const mesh = tableLegMesh()
        mesh.position.set(tableDim.x / 2 - 0.1, (tableDim.y - tableDim.t) / 2, 0.1 - tableDim.z / 2)
        return mesh
    })(),
    leg3: (() => {
        const mesh = tableLegMesh()
        mesh.position.set(0.1 - tableDim.x / 2, (tableDim.y - tableDim.t) / 2, tableDim.z / 2 - 0.1)
        return mesh
    })(),
}
tableGroup.add(...Object.values(table))
tableGroup.position.set(-1.25, 0, 1.5)
scene.add(tableGroup)

/* Utils */
const getScaledSettings = () => {
    let tiles = 3;
    let renderScale = Math.max(1 / window.devicePixelRatio, config.renderScale);
    const aspectRatio = window.innerWidth / window.innerHeight;
    if (aspectRatio < 0.65) {
        tiles = 4;
        renderScale = 0.5 / window.devicePixelRatio;
    }
    return { tiles, renderScale };
}


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
pathTracer.bounces = config.bounces
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
