import * as THREE from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { WebGLPathTracer, GradientEquirectTexture, DenoiseMaterial } from 'three-gpu-pathtracer'
import { RectAreaLightHelper } from 'three/examples/jsm/Addons.js';
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { LDrawLoader } from "three/examples/jsm/loaders/LDrawLoader.js";
import { LDrawUtils } from "three/examples/jsm/utils/LDrawUtils.js";
import { LoaderElement } from "./LoaderElement.js";

let loader, model;

const updateModel = async () => {
    const modelInfo = { opacityToTransmission: true, ior: 1.4, url: './models/UtahTeapot.glb' }
    loader.setPercentage(0);
    if (model) {
        model.traverse((c) => {
            if (c.material) {
                const material = c.material;
                for (const key in material)
                    if (material[key] && material[key].isTexture)
                        material[key].dispose();
            }
        })
        scene.remove(model)
        model = null
    }

    try {
        model = await loadModel(modelInfo.url, v => loader.setPercentage(0.5 * v))
    } catch (err) {
        loader.setCredits("Failed to load model:" + err.message)
        loader.setPercentage(1)
    }

    if (modelInfo.removeEmission) {
        model.traverse((c) => {
            if (c.material) {
                c.material.emissiveMap = null
                c.material.emissiveIntensity = 0
            }
        })
    }

    if (modelInfo.opacityToTransmission) {
        model.traverse((c) => {
            if (c.material) {
                const material = c.material
                if (material.opacity < 0.65 && material.opacity > 0.2) {
                    const newMaterial = new THREE.MeshPhysicalMaterial()
                    for (const key in material) {
                        if (key in material) {
                            if (material[key] === null)
                                continue
                            if (material[key].isTexture)
                                newMaterial[key] = material[key]
                            else if (material[key].copy && material[key].constructor === newMaterial[key].constructor)
                                newMaterial[key].copy(material[key])
                            else if (typeof material[key] === "number")
                                newMaterial[key] = material[key]
                        }
                    }
                    const hsl = {}
                    newMaterial.opacity = 1.0
                    newMaterial.transmission = 1.0
                    newMaterial.ior = modelInfo.ior || 1.5
                    newMaterial.color.getHSL(hsl)
                    hsl.l = Math.max(hsl.l, 0.35)
                    newMaterial.color.setHSL(hsl.h, hsl.s, hsl.l)
                    c.material = newMaterial
                }
            }
        })
    }

    model.traverse((c) => {
        if (c.material) c.material.thickness = 1.0;
    })

    if (modelInfo.postProcess) modelInfo.postProcess(model)
    if (modelInfo.rotation) model.rotation.set(...modelInfo.rotation)

    const box = new THREE.Box3();
    box.setFromObject(model);

    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    model.scale.setScalar(1 / sphere.radius);
    model.position.multiplyScalar(1 / sphere.radius);
    box.setFromObject(model);

    // Adjust position, size and rotation here
    model.position.y = 1
    model.scale.setScalar((1 / sphere.radius) * 0.5);
    model.rotation.y = Math.PI / 4
    scene.add(model);

    loader.setPercentage(1);
    loader.setCredits(modelInfo.credit || "");
}

const loadModel = async (url, onProgress) => {
    const manager = new THREE.LoadingManager()

    if (/dae$/i.test(url)) {
        const complete = new Promise((resolve) => (manager.onLoad = resolve))
        const res = await new ColladaLoader(manager).loadAsync(url, (progress) => {
            if (progress.total !== 0 && progress.total >= progress.loaded)
                onProgress(progress.loaded / progress.total)
        })
        await complete
        res.scene.scale.setScalar(1)
        res.scene.traverse((c) => {
            const { material } = c
            if (material && material.isMeshPhongMaterial) {
                c.material = new MeshStandardMaterial({
                    color: material.color,
                    roughness: material.roughness || 0,
                    metalness: material.metalness || 0,
                    map: material.map || null
                })
            }
        })
        return res.scene
    }

    if (/(gltf|glb)$/i.test(url)) {
        const complete = new Promise((resolve) => (manager.onLoad = resolve))
        const gltf = await new GLTFLoader(manager)
            .setMeshoptDecoder(MeshoptDecoder)
            .loadAsync(url, (progress) => {
                if (progress.total !== 0 && progress.total >= progress.loaded)
                    onProgress(progress.loaded / progress.total)
            })
        await complete
        return gltf.scene
    }

    if (/mpd$/i.test(url)) {
        manager.onProgress = (url, loaded, total) => loader.setPercentage(loaded / total)
        const complete = new Promise((resolve) => (manager.onLoad = resolve))
        const ldrawLoader = new LDrawLoader(manager)
        await ldrawLoader.preloadMaterials("https://raw.githubusercontent.com/gkjohnson/ldraw-parts-library/master/colors/ldcfgalt.ldr")
        const result = await ldrawLoader
            .setPartsLibraryPath("https://raw.githubusercontent.com/gkjohnson/ldraw-parts-library/master/complete/ldraw/")
            .loadAsync(url)
        await complete
        const model = LDrawUtils.mergeObject(result)
        model.rotation.set(Math.PI, 0, 0)
        const toRemove = []
        model.traverse((c) => {
            if (c.isLineSegments) toRemove.push(c)
            if (c.isMesh) c.material.roughness *= 0.25
        })
        toRemove.forEach((c) => c.parent.remove(c))
        return model
    }
}

// Init scene
const scene = new THREE.Scene();
const axesHelper = new THREE.AxesHelper(200)
scene.add(axesHelper)

// Lighting 
const rectLight = new THREE.RectAreaLight("#FFFFFF", 1, 1, 1)
const rectLightHelper = new RectAreaLightHelper(rectLight)
rectLight.castShadow = true
rectLight.power = 20
rectLight.position.set(0, 3, 0)
rectLight.lookAt(0, 0, 0)
rectLight.add(rectLightHelper)
scene.add(rectLight)

// Textures
const textureLoader = new THREE.TextureLoader()
const textures = {
    "marble": textureLoader.load('./textures/whiteMarbleThinVein.jpg', (texture) => {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(2, 2)
        texture.colorSpace = THREE.SRGBColorSpace
    }),
    "world": textureLoader.load('./textures/world.jpg', (texture) => {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(1, 1)
        texture.colorSpace = THREE.SRGBColorSpace
    }),
}

/* Walls */

const leftWall = (_ => {
    const geo = new THREE.PlaneGeometry(4, 3);
    const mat = new THREE.MeshPhongMaterial({ color: "#ffcc00", reflectivity: 0.25 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.y = Math.PI * 0.5;
    mesh.position.set(-2, 1.5, 0);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
})();
const rightWall = (_ => {
    const geo = new THREE.PlaneGeometry(4, 3);
    const mat = new THREE.MeshPhongMaterial({ color: "#00ccff", reflectivity: 0.25 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.y = Math.PI * -0.5;
    mesh.position.set(2, 1.5, 0);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
})();
const backWall = (_ => {
    const geo = new THREE.PlaneGeometry(3, 4);
    const mat = new THREE.MeshStandardMaterial({ map: textures.marble, metalness: 0.1, roughness: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = Math.PI * -0.5;
    mesh.position.set(0, 1.5, -2);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
})();
const ceiling = (_ => {
    const geo = new THREE.PlaneGeometry(4, 4);
    const mat = new THREE.MeshPhysicalMaterial({ shininess: 50, color: "#fff", reflectivity: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI * 0.5;
    mesh.position.set(0, 3, 0);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
})();
const floor = (_ => {
    const geo = new THREE.PlaneGeometry(4, 4);
    const mat = new THREE.MeshPhysicalMaterial({ shininess: 50, color: "#fff", reflectivity: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI * -.5;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
})();

/* Objects */

const boxes = [];
// for (let h = -1.75; h <= 1.75; h += 0.25)
//     for (let i = -1.75; i <= 1.75; i += 0.25)
//         for (let j = 0.25; j <= 1.5; j += 0.25) {
//             boxes.push(new THREE.Mesh(
//                 new THREE.BoxGeometry(0.75, 0.75, 0.75),
//                 new THREE.MeshStandardMaterial({ color: '#2196f3', roughness: 0.2, metalness: 1, })
//             ))
//             boxes[boxes.length - 1].position.z = -1.25
//             boxes[boxes.length - 1].position.y = 2.25
//             boxes[boxes.length - 1].position.x = 0
//             boxes[boxes.length - 1].rotation.z = Math.PI / 4
//             boxes[boxes.length - 1].rotation.y = Math.PI / 4
//         }
boxes.forEach(box => scene.add(box))

const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 64, 64),
    new THREE.MeshStandardMaterial({
        map: textures.world,
        color: '#ffffff',
        roughness: 1,
        metalness: 0,
    })
    // new THREE.MeshPhysicalMaterial({
    //     color: '#ffdc00',
    //     metalness: 0,
    //     roughness: 0,
    //     ior: 1.7,
    //     thickness: 0.5,
    //     // transparent: true,
    //     transmission: 1,
    //     specularIntensity: 1.0,
    //     clearcoat: 1.0
    // })
)
ball.rotation.y = Math.PI * 1.25
ball.position.y = 2
ball.position.z = 0
scene.add(ball)

/* Utils */

const getScaledSettings = () => {
    let tiles = 3;
    let renderScale = Math.max(1 / window.devicePixelRatio, 2);
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

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 500);
camera.position.set(0, 1.5, 5);
// camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const settings = getScaledSettings();
const pathTracer = new WebGLPathTracer(renderer);
pathTracer.bounces = 5
pathTracer.renderScale = settings.renderScale;
pathTracer.tiles.setScalar(settings.tiles);

// let denoiseQuad
// pathTracer.renderToCanvasCallback = (target, renderer, quad) => {
//     denoiseQuad.material.sigma = 2;
//     denoiseQuad.material.threshold = 0.1;
//     denoiseQuad.material.kSigma = 1;
//     denoiseQuad.material.opacity = quad.material.opacity;
//     const autoClear = renderer.autoClear;
//     const finalQuad = denoiseQuad;
//     renderer.autoClear = false;
//     finalQuad.material.map = target.texture;
//     finalQuad.render(renderer);
//     renderer.autoClear = autoClear;
// };
// // denoiser
// denoiseQuad = new FullScreenQuad(new DenoiseMaterial({
//     map: null,
//     blending: THREE.CustomBlending,
//     premultipliedAlpha: renderer.getContextAttributes().premultipliedAlpha,
// }));


const animate = () => {
    requestAnimationFrame(animate);
    pathTracer.renderSample();
}

const onResize = async () => {
    loader = new LoaderElement();
    loader.attach(document.body);

    const w = window.innerWidth;
    const h = window.innerHeight;

    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);

    const aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    await updateModel()
    pathTracer.setScene(scene, camera);
}

window.addEventListener('resize', () => onResize());

document.addEventListener("keyup", (event) => {
    if (event.isComposing || event.key === ' ')
        onResize()
});


pathTracer.setScene(scene, camera);
onResize();
animate();
