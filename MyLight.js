import { BoxGeometry, Group, Mesh, MeshPhysicalMaterial } from 'three';

const getLight = (intensity = 10, width = 1.5, depth = 1.5, border = 0.1) => {
    const lightGroup = new Group()
    const light = {
        boxZm: (() => {
            const mesh = new Mesh(
                new BoxGeometry(width + 2 * border, 0.125, border),
                new MeshPhysicalMaterial({ color: "#FFFFFF", reflectivity: 0.5 })
            )
            mesh.position.set(0, 2.9375, (depth + border) / 2)
            return mesh
        })(),
        boxZp: (() => {
            const mesh = new Mesh(
                new BoxGeometry(width + 2 * border, 0.125, border),
                new MeshPhysicalMaterial({ color: "#FFFFFF", reflectivity: 0.5 })
            )
            mesh.position.set(0, 2.9375, -(depth + border) / 2)
            return mesh
        })(),
        boxXm: (() => {
            const mesh = new Mesh(
                new BoxGeometry(border, 0.125, depth + 2 * border),
                new MeshPhysicalMaterial({ color: "#FFFFFF", reflectivity: 0.5 })
            )
            mesh.position.set((width + border) / 2, 2.9375, 0)
            return mesh
        })(),
        boxXp: (() => {
            const mesh = new Mesh(
                new BoxGeometry(border, 0.125, depth + 2 * border),
                new MeshPhysicalMaterial({ color: "#FFFFFF", reflectivity: 0.5 })
            )
            mesh.position.set(-(width + border) / 2, 2.9375, 0)
            return mesh
        })(),
        boxLight: (() => {
            const mesh = new Mesh(
                new BoxGeometry(width, 0.1, depth),
                new MeshPhysicalMaterial({ emissiveIntensity: intensity, emissive: '#FFFFFF' })
            )
            mesh.position.set(0, 2.9375, 0)
            return mesh
        })(),
    }
    lightGroup.add(...Object.values(light))
    return lightGroup
}

export default getLight