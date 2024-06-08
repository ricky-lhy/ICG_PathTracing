import {
    BoxGeometry,
    CylinderGeometry,
    Group,
    Mesh,
    MeshPhongMaterial,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    PlaneGeometry,
    RepeatWrapping,
    SphereGeometry,
    SRGBColorSpace,
    TextureLoader,
    TorusGeometry
} from 'three'

const rad = (deg) => deg * (Math.PI / 180)

const getTexture = (filename, repeat = [1, 1]) => {
    const textureLoader = new TextureLoader()
    return textureLoader.load(`./textures/${filename}`, (texture) => {
        texture.wrapS = RepeatWrapping
        texture.wrapT = RepeatWrapping
        texture.repeat.set(repeat[0], repeat[1])
        texture.colorSpace = SRGBColorSpace
    })
}

class Base {
    constructor() { this.mesh = new Group() }
    move(x, y, z) { this.mesh.position.set(x, y, z); return this }
    rotate(x, y, z) { this.mesh.rotation.set(rad(x), rad(y), rad(z)); return this }
    scale(x, y, z) { this.mesh.scale.set(x, y, z); return this }
}

class Room extends Base {
    constructor(width = 4, height = 3, depth = 8) {
        super()
        this.children = {
            left: (() => {
                const mesh = new Mesh(
                    new PlaneGeometry(depth, height),
                    new MeshPhongMaterial({ color: "#ffcc00", reflectivity: 0.25 })
                )
                mesh.rotation.y = rad(90)
                mesh.position.set(-(width / 2), height / 2, 0)
                mesh.receiveShadow = true
                return mesh
            })(),
            right: (() => {
                const mesh = new Mesh(
                    new PlaneGeometry(depth, height),
                    new MeshPhongMaterial({ color: "#00ccff", reflectivity: 0.25 })
                )
                mesh.rotation.y = rad(-90)
                mesh.position.set(width / 2, height / 2, 0)
                mesh.receiveShadow = true
                return mesh
            })(),
            back: (() => {
                const mesh = new Mesh(
                    new PlaneGeometry(width, height),
                    new MeshPhysicalMaterial({ map: getTexture('bricks.jpg', [2, 1]), metalness: 0, roughness: 1 })
                )
                mesh.position.set(0, height / 2, -(depth / 2))
                mesh.receiveShadow = true
                return mesh
            })(),
            ceiling: (() => {
                const mesh = new Mesh(
                    new PlaneGeometry(width, depth),
                    new MeshPhysicalMaterial({ color: "#ffffff", reflectivity: 0.5 })
                )
                mesh.rotation.x = rad(90)
                mesh.position.set(0, height, 0)
                mesh.receiveShadow = true
                return mesh
            })(),
            floor: (() => {
                const mesh = new Mesh(
                    new PlaneGeometry(width, depth),
                    new MeshPhysicalMaterial({ map: getTexture('floor.jpg', [1, 2]), reflectivity: 0.5 })
                )
                mesh.rotation.x = rad(-90)
                mesh.receiveShadow = true
                return mesh
            })()
        }
        this.mesh.add(...Object.values(this.children))
    }
}

class Light extends Base {
    constructor(intensity = 10, width = 1, depth = 1, border = 0.1) {
        super()
        this.children = {
            boxZm: (() => {
                const mesh = new Mesh(
                    new BoxGeometry(width + 2 * border, 0.125, border),
                    new MeshPhysicalMaterial({ color: "#ffffff", reflectivity: 0.5 })
                )
                mesh.position.set(0, 2.9375, (depth + border) / 2)
                return mesh
            })(),
            boxZp: (() => {
                const mesh = new Mesh(
                    new BoxGeometry(width + 2 * border, 0.125, border),
                    new MeshPhysicalMaterial({ color: "#ffffff", reflectivity: 0.5 })
                )
                mesh.position.set(0, 2.9375, -(depth + border) / 2)
                return mesh
            })(),
            boxXm: (() => {
                const mesh = new Mesh(
                    new BoxGeometry(border, 0.125, depth + 2 * border),
                    new MeshPhysicalMaterial({ color: "#ffffff", reflectivity: 0.5 })
                )
                mesh.position.set((width + border) / 2, 2.9375, 0)
                return mesh
            })(),
            boxXp: (() => {
                const mesh = new Mesh(
                    new BoxGeometry(border, 0.125, depth + 2 * border),
                    new MeshPhysicalMaterial({ color: "#ffffff", reflectivity: 0.5 })
                )
                mesh.position.set(-(width + border) / 2, 2.9375, 0)
                return mesh
            })(),
            light: (() => {
                const mesh = new Mesh(
                    new BoxGeometry(width, 0.1, depth),
                    new MeshPhysicalMaterial({ color: '#ffffff', emissiveIntensity: intensity, emissive: '#ffffff' })
                )
                mesh.position.set(0, 2.9375, 0)
                return mesh
            })(),
        }
        this.mesh.add(...Object.values(this.children))
    }
}

class Table extends Base {
    constructor(width = 1, height = 0.6, depth = 2, thickness = 0.05) {
        super()
        const leg = () => new Mesh(
            new CylinderGeometry(0.03, 0.03, height - thickness, 64),
            new MeshPhysicalMaterial({ color: '#c9c9c9', reflectivity: 1, metalness: 1, roughness: 0.25 })
        )
        this.children = {
            board: (() => {
                const mesh = new Mesh(
                    new BoxGeometry(width, thickness, depth),
                    new MeshPhysicalMaterial({
                        map: getTexture('wood.jpg', [3, 3]),
                        color: '#ffffff',
                        roughness: 0.8,
                        metalness: 0.2,
                        reflectivity: 0.5,
                    })
                )
                mesh.position.y = height - thickness
                return mesh
            })(),
            leg0: (() => {
                const mesh = leg()
                mesh.position.set(width / 2 - 0.1, (height - thickness) / 2, depth / 2 - 0.1)
                return mesh
            })(),
            leg1: (() => {
                const mesh = leg()
                mesh.position.set(0.1 - width / 2, (height - thickness) / 2, 0.1 - depth / 2)
                return mesh
            })(),
            leg2: (() => {
                const mesh = leg()
                mesh.position.set(width / 2 - 0.1, (height - thickness) / 2, 0.1 - depth / 2)
                return mesh
            })(),
            leg3: (() => {
                const mesh = leg()
                mesh.position.set(0.1 - width / 2, (height - thickness) / 2, depth / 2 - 0.1)
                return mesh
            })(),
        }
        this.mesh.add(...Object.values(this.children))
    }
}

class Solar extends Base {
    constructor() {
        super()
        this.children = {
            sun: (() => {
                const mesh = new Mesh(
                    new SphereGeometry(0.4, 64, 64),
                    new MeshPhongMaterial({
                        emissive: '#ffffff',
                        emissiveMap: getTexture('sun.jpg'),
                        emissiveIntensity: 5,
                    }))
                mesh.position.set(0, 0.3, 0)
                mesh.castShadow = true
                return mesh
            })(),
            venus: (() => {
                const mesh = new Mesh(
                    new SphereGeometry(0.15, 64, 64),
                    new MeshStandardMaterial({
                        map: getTexture('venus.png'),
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
                const mesh = new Mesh(
                    new SphereGeometry(0.15, 64, 64),
                    new MeshStandardMaterial({
                        map: getTexture('mars.png'),
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
                const mesh = new Mesh(
                    new SphereGeometry(0.2, 64, 64),
                    new MeshStandardMaterial({
                        map: getTexture('uranus.png'),
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
                const mesh = new Mesh(
                    new SphereGeometry(0.15, 64, 64),
                    new MeshStandardMaterial({
                        map: getTexture('earth.png'),
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
                const mesh = new Mesh(
                    new SphereGeometry(0.15, 64, 64),
                    new MeshStandardMaterial({
                        map: getTexture('mercury.png'),
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
                const mesh = new Mesh(
                    new SphereGeometry(0.25, 64, 64),
                    new MeshStandardMaterial({
                        map: getTexture('jupitar.png'),
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
                const mesh = new Mesh(
                    new SphereGeometry(0.2, 64, 64),
                    new MeshStandardMaterial({
                        map: getTexture('neptune.png'),
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
                const planetMesh = new Mesh(
                    new SphereGeometry(0.25, 64, 64),
                    new MeshStandardMaterial({
                        map: getTexture('saturn.png'),
                        color: '#ffffff',
                        roughness: 1,
                        metalness: 0,
                    }))
                const torusMesh = new Mesh(
                    new TorusGeometry(0.425, 0.075, 4, 64),
                    new MeshStandardMaterial({
                        map: getTexture('saturn-rings.png'),
                        transparent: true,
                        opacity: 0.9,
                        color: '#ddddcc',
                        roughness: 1,
                        metalness: 0,
                    })
                )
                torusMesh.rotation.set(rad(90), 0, 0)
                torusMesh.scale.z = 0.2
                const mesh = new Group()
                mesh.add(planetMesh, torusMesh)
                mesh.position.set(0.05, 0.2, 1.05)
                mesh.rotation.z = rad(-27)
                mesh.castShadow = true
                return mesh
            })(),
        }
        this.mesh.add(...Object.values(this.children))
    }
}

export { Light, Room, Solar, Table }
