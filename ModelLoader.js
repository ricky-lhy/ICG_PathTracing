import * as THREE from 'three'
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { LDrawLoader } from "three/examples/jsm/loaders/LDrawLoader.js";
import { LDrawUtils } from "three/examples/jsm/utils/LDrawUtils.js";

const rad = (deg) => deg * (Math.PI / 180)

const loadModel = async (loader, { url, ior, position, rotation, scale } = {}) => {
    let model;
    loader.setPercentage(0);
    if (model) {
        model.traverse(({ material }) => {
            if (!material)
                return
            for (const key in material)
                if (material[key] && material[key].isTexture)
                    material[key].dispose();
        })
        scene.remove(model)
        model = null
    }

    try {
        model = await importModel(loader, url, v => loader.setPercentage(0.5 * v))
    } catch (err) {
        loader.setCredits("Failed to load model:" + err.message)
        loader.setPercentage(1)
    }

    model.traverse((c) => {
        if (!c.material || c.material.opacity >= 0.65 || c.material.opacity <= 0.2)
            return
        const material = c.material
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
        newMaterial.opacity = 1
        newMaterial.transmission = 1
        newMaterial.ior = ior || 1.5
        newMaterial.color.getHSL(hsl)
        hsl.l = Math.max(hsl.l, 0.35)
        newMaterial.color.setHSL(hsl.h, hsl.s, hsl.l)
        c.material = newMaterial
    })

    model.traverse((c) => {
        if (c.material) c.material.thickness = 1;
    })

    const box = new THREE.Box3();
    box.setFromObject(model);

    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    model.scale.setScalar(1 / sphere.radius);
    model.position.multiplyScalar(1 / sphere.radius);
    box.setFromObject(model);

    if (position) model.position.set(position[0], position[1], position[2])
    if (scale) model.scale.setScalar((1 / sphere.radius) * scale)
    if (rotation) model.rotation.set(rad(rotation[0]), rad(rotation[1]), rad(rotation[2]))

    loader.setPercentage(1);
    return model
}

const importModel = async (loader, url, onProgress) => {
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

export { loadModel }