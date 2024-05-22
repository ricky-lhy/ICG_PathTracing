import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { shininess } from 'three/examples/jsm/nodes/Nodes.js';

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
let renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

camera.position.y = 2.5;
camera.position.z = 6;

let controls = new OrbitControls( camera, renderer.domElement );


let roomGeometry = new THREE.BoxGeometry(10, 10, 10);
let roomMaterial = new THREE.MeshPhongMaterial({ color: 0x808080, side: THREE.BackSide });
let room = new THREE.Mesh(roomGeometry, roomMaterial);
scene.add(room);

// Light
let lights = [];
let lightColors = [0xffffff, 0xff0000, 0x00ff00, 0x0000ff];

for (let i = 0; i < lightColors.length; i++) {
    let light = new THREE.PointLight(lightColors[i], 40, 100);
    light.position.set((i - 1.5) * 2, 5, 2);
    lights.push(light);
    scene.add(light);
}

let ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const loader = new THREE.CubeTextureLoader();
const teapot_texture_1 = loader.load([
    '/texture/whiteMarble.jpg',
    '/texture/whiteMarble.jpg',
    '/texture/whiteMarble.jpg',
    '/texture/whiteMarble.jpg',
    '/texture/whiteMarble.jpg',
    '/texture/whiteMarble.jpg'
]);

const teapot_texture_2 = loader.load([
    '/texture/uvGrid.jpg',
    '/texture/uvGrid.jpg',
    '/texture/uvGrid.jpg',
    '/texture/uvGrid.jpg',
    '/texture/uvGrid.jpg',
    '/texture/uvGrid.jpg'
]);

function loadTeapots() {
    const gltfLoader = new GLTFLoader();
    const positions = [
        { x: -3, y: 0, z: 0 },
        { x: 3.2, y: 0, z: 0 },
        { x: -2, y: -1.3, z: 1 },
        { x: 0, y: 0, z: 0 },
        { x: 1.6, y: 2, z: 0 }
    ];

    for (let i = 0; i < positions.length; i++) {
        gltfLoader.load('/model/UtahTeapot.gltf', function (gltf) {
            let teapot = gltf.scene;
            if (i % 2 == 1) {
                teapot.traverse(function (child) {
                    if (child.isMesh) {
                        child.material = new THREE.MeshPhongMaterial({
                            color: 0xcccccc,
                            shininess: 100,
                            specular: 0xffffff,
                            envMap: teapot_texture_1,
                            transparent: i == 4,
                            opacity: 0.5,
                            refractionRatio: 0.85
                        });
                    }
                });
            }
            else {
                teapot.traverse(function (child) {
                    if (child.isMesh) {
                        child.material = new THREE.MeshPhongMaterial({
                            color: 0xcccccc,
                            shininess: 100,
                            specular: 0xffffff,
                            envMap: teapot_texture_2
                        });
                    }
                });
            }
            teapot.scale.set(2, 2, 2);
            teapot.position.set(positions[i].x, positions[i].y, positions[i].z);
            scene.add(teapot);
        });
    }
}

loadTeapots();

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();