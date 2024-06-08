import { ACESFilmicToneMapping, AmbientLight, Color, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer, Vector3, Group } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { WebGLPathTracer } from 'three-gpu-pathtracer'

import { Loader, loadModel } from './Loader.js'
import { Light, Room, Solar, Table } from './geometries.js'

let isTracing = false

const config = {
    bounces: 3,
    tiles: 3,
    renderScale: 0.25,
}

const models = [
    { url: './models/cooker.glb', position: [-1.1, 0.6, 1.3], rotation: [0, -45, 0], scale: 0.5 },
    { url: './models/teapot.glb', position: [-1.35, 0.6, 2], rotation: [0, -45, 0], scale: 0.5 },
    { url: './models/shield.glb', position: [0, 1.5, -2], rotation: [0, 0, 0], scale: 0.875 },
    { url: './models/iron_man.glb', position: [1.25, 0, -0.5], rotation: [0, -30, 0], scale: 1.25 },
    { url: './models/knight.glb', position: [-1.25, 1.125, -0.5], rotation: [0, 30, 0], scale: 1.25 },
]

const scene = new Scene()
scene.background = new Color('#000000')

scene.add(new Room().move(0, 0, 2).mesh)
scene.add(new Light(20, 0.25, 1.5, 0.1).move(-1, 0, -0.5).mesh)
scene.add(new Light(20, 0.25, 1.5, 0.1).move(-1, 0, 2).mesh)
scene.add(new Light(20, 0.25, 1.5, 0.1).move(1, 0, -0.5).mesh)
scene.add(new Light(20, 0.25, 1.5, 0.1).move(1, 0, 2).mesh)
scene.add(new Table().move(-1.25, 0, 1.5).mesh)
scene.add(new Solar().scale(0.625, 0.625, 0.625).move(1, 2, 2.75).rotate(30, 0, 15).mesh)

const renderer = new WebGLRenderer({ antialias: true })
renderer.toneMapping = ACESFilmicToneMapping
document.body.appendChild(renderer.domElement)

// Camera & control
const camera = new PerspectiveCamera(45, innerWidth / innerHeight, 1, 500)
camera.position.set(0, 1.5, 5.5)
camera.lookAt(0, 1.5, 0)
const controls = new OrbitControls(camera, renderer.domElement)
controls.object.position.set(0, 1.5, 5.5)
controls.target = new Vector3(0, 1.5, 0)
controls.update()

// Path tracer
const pathTracer = new WebGLPathTracer(renderer)
pathTracer.bounces = config.bounces
pathTracer.minSamples = 3
pathTracer.dynamicLowRes = true
pathTracer.lowResScale = 0.75
pathTracer.renderDelay = 0
pathTracer.renderScale = config.renderScale
pathTracer.tiles.setScalar(config.tiles)

// Normal mode ambient
const ambient = new AmbientLight('#ffffff', 1)
const dirLeft = new DirectionalLight('#ffffff', 2)
const dirRight = new DirectionalLight('#ffffff', 2)
dirLeft.position.set(2, 2.5, 4)
dirRight.position.set(2, 2.5, 4)
scene.add(ambient, dirLeft, dirRight)

const animate = () => {
    requestAnimationFrame(animate)
    isTracing
        ? pathTracer.renderSample()
        : renderer.render(scene, camera)
}

const onResize = async () => {
    const loader = new Loader()
    loader.attach(document.body)
    renderer.setSize(innerWidth, innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    for await (const model of models)
        scene.add(await loadModel(loader, model))
    if (isTracing)
        pathTracer.setScene(scene, camera)
}

window.addEventListener('resize', () => onResize())

document.getElementById("switch").addEventListener("click", () => {
    isTracing = !isTracing
    controls.enabled = !isTracing
    ambient.intensity = isTracing ? 0 : 1
    dirLeft.intensity = isTracing ? 0 : 2
    dirRight.intensity = isTracing ? 0 : 2
    onResize()
})

onResize()
animate()
