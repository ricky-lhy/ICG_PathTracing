import { Box3, LoadingManager, MeshPhysicalMaterial, Sphere } from 'three'
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const rad = (deg) => deg * (Math.PI / 180)

const loadModel = async (loader, { url, ior, position, rotation, scale } = {}) => {
    let model
    loader.setPercentage(0)
    if (model) {
        model.traverse(({ material }) => {
            if (!material)
                return
            for (const key in material)
                if (material[key] && material[key].isTexture)
                    material[key].dispose()
        })
        scene.remove(model)
        model = null
    }

    try {
        if (!/(gltf|glb)$/i.test(url))
            throw new Error("Model format not supported")

        const manager = new LoadingManager()
        const complete = new Promise((resolve) => (manager.onLoad = resolve))
        const gltf = await new GLTFLoader(manager)
            .setMeshoptDecoder(MeshoptDecoder)
            .loadAsync(url, (progress) => {
                if (progress.total !== 0 && progress.total >= progress.loaded)
                    loader.setPercentage(progress.loaded / progress.total / 2)
            })
        await complete
        model = gltf.scene
    } catch (err) {
        loader.setCredits("Failed to load model:" + err.message)
        loader.setPercentage(1)
    }

    model.traverse((c) => {
        if (!c.material || c.material.opacity >= 0.65 || c.material.opacity <= 0.2)
            return
        const material = c.material
        const newMaterial = new MeshPhysicalMaterial()
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
        newMaterial.opacity = 1
        newMaterial.transmission = 1
        newMaterial.ior = ior || 1.5
        newMaterial.color.getHSL(hsl)
        hsl.l = Math.max(hsl.l, 0.35)
        newMaterial.color.setHSL(hsl.h, hsl.s, hsl.l)
        c.material = newMaterial
    })

    model.traverse((c) => {
        if (c.material) c.material.thickness = 1
    })

    const box = new Box3()
    box.setFromObject(model)

    const sphere = new Sphere()
    box.getBoundingSphere(sphere)
    model.scale.setScalar(1 / sphere.radius)
    model.position.multiplyScalar(1 / sphere.radius)
    box.setFromObject(model)

    if (position) model.position.set(position[0], position[1], position[2])
    if (scale) model.scale.setScalar((1 / sphere.radius) * scale)
    if (rotation) model.rotation.set(rad(rotation[0]), rad(rotation[1]), rad(rotation[2]))

    loader.setPercentage(1)
    return model
}

class Loader {
    constructor() {
        const container = document.createElement('div');
        container.classList.add('loader-container');

        const percentageEl = document.createElement('div');
        percentageEl.classList.add('percentage');
        container.appendChild(percentageEl);

        const samplesEl = document.createElement('div');
        samplesEl.classList.add('samples');
        container.appendChild(samplesEl);

        const creditsEl = document.createElement('div');
        creditsEl.classList.add('credits');
        container.appendChild(creditsEl);

        const loaderBarEl = document.createElement('div');
        loaderBarEl.classList.add('bar');
        container.appendChild(loaderBarEl);

        const descriptionEl = document.createElement('div');
        descriptionEl.classList.add('description');
        container.appendChild(descriptionEl);

        this._description = descriptionEl;
        this._loaderBar = loaderBarEl;
        this._percentage = percentageEl;
        this._credits = creditsEl;
        this._samples = samplesEl;
        this._container = container;

        this.setPercentage(0);
    }

    attach(container) {
        container.appendChild(this._container)
        container.appendChild(this._description)
    }

    setPercentage(perc) {
        const classList = this._container.classList
        this._loaderBar.style.width = `${perc * 100}%`
        this._percentage.innerText = (perc === 0) ? 'Loading...' : `${(perc * 100).toFixed(0)}%`
        if (perc >= 1) classList.remove('loading'); else classList.add('loading')
    }

    setSamples(count) {
        this._samples.innerText = `${Math.floor(count)} samples`
    }

    setCredits(credits) {
        this._credits.innerHTML = credits
    }

    setDescription(description) {
        this._description.innerHTML = description
    }

}

export { Loader, loadModel }