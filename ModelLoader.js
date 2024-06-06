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
        if (!/(gltf|glb)$/i.test(url))
            throw new Error("Model format not supported")

        const manager = new THREE.LoadingManager()
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

export { loadModel }