import {PerspectiveCamera} from "three/src/cameras/PerspectiveCamera";
import {WebGLRenderer} from "three/src/renderers/WebGLRenderer";
import {Scene} from "three/src/scenes/Scene";
import {Mesh, Object3D} from "three";
import * as THREE from 'three';

let renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, circles: Object3D, dataArray: Uint8Array;

let ww = window.innerWidth,
    wh = window.innerHeight,
    speed = 1,
    mouseX = 0,
    colors = [
        "0x442D65", "0x775BA3", "0x91C5A9", "0xF8E1B4",
        "0xF98A5F", "0xF9655F", "0x442D65", "0x775BA3",
        "0x91C5A9", "0xF8E1B4", "0xF98A5F", "0xF9655F"
    ],
    closest: any = {position: {z: 0}},
    farest: any = {position: {z: 0}},
    radius = 5,
    segments = 32;

const audioContext = new window.AudioContext(),
audio = document.getElementById('audio')!! as HTMLAudioElement,
source = audioContext.createMediaElementSource(audio),
analyser = audioContext.createAnalyser();

const init = () => {

    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('scene')!!, antialias: true});
    renderer.setSize(ww, wh);

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 300, 700);

    camera = new THREE.PerspectiveCamera(50, ww / wh, 0.1, 10000);
    camera.position.set(0, 0, 0);
    scene.add(camera);

    window.addEventListener("resize", resize);
    audio.addEventListener("play", () => {
        audioContext.resume().then(() => {
        });
    });

    source.connect(analyser)
    analyser.connect(audioContext.destination);
    analyser.fftSize = 1024;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    createCircles();

}

const adjust = (color: string, amount: number) => {
    return '0x' + color.replace(/^0x/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

const resize = () => {
    ww = window.innerWidth;
    wh = window.innerHeight;
    camera.aspect = ww / wh;
    camera.updateProjectionMatrix();

    renderer.setSize(ww, wh);
}

const createCircles = () => {
    circles = new THREE.Object3D();
    scene.add(circles);

    for (let i = 0; i < 20; i++) {
        addCircle(false);
    }

    render();
}

const removeLine = (isFarest: boolean) => {
    if (isFarest) {
        for (let i = 0, j = circles.children.length; i < j; i++) {
            if (circles.children[i] === farest) {
                circles.remove(circles.children[i]);
            }
        }
    } else {
        for (let i = 0, j = circles.children.length; i < j; i++) {
            if (circles.children[i] === closest) {
                circles.remove(circles.children[i]);
            }
        }
    }
}

const addCircle = (top: boolean) => {
    let row: any = new THREE.Object3D();

    if (top) {
        row.degreesRotation = (closest.degreesRotation - 1) || 0;
    } else {
        row.degreesRotation = (farest.degreesRotation + 1) || 0;
    }

    for (let j = 0; j < 12; j++) {

        let circleGeometry = new THREE.CircleGeometry(radius, segments);
        let circle = new THREE.Mesh(circleGeometry);
        let translate = new THREE.Matrix4().makeTranslation(50, 0, 0);
        let rotation = new THREE.Matrix4().makeRotationZ(Math.PI * 2 / 12 * j + row.degreesRotation * .3);

        circle.applyMatrix4(new THREE.Matrix4().multiplyMatrices(rotation, translate));
        row.add(circle);

    }

    if (top) {
        row.position.z = (closest.position.z / 35 + 1) * 35;
    } else {
        row.position.z = (farest.position.z / 35 - 1) * 35;
    }

    circles.add(row);
    closest = circles.children[0];
    farest = circles.children[0];

    for (let i = 0, j = circles.children.length; i < j; i++) {
        if (circles.children[i].position.z > closest.position.z) {
            closest = circles.children[i];
        }
        if (circles.children[i].position.z < farest.position.z) {
            farest = circles.children[i];
        }
    }

}

const resizeCircles = () => {

    analyser.getByteFrequencyData(dataArray);

    let index = 0;
    for (let i = 0; i < circles.children.length; i++) {
        let object = circles.children[i];
        for (let j = 0; j < object.children.length; j++) {
            let mesh = (object.children[j] as Mesh);
            mesh.material = new THREE.MeshBasicMaterial({
                color: parseInt(adjust(colors[j], (dataArray[index]%50)))
            });
            const oldScale = mesh.position.x;
            const newScale = oldScale + (dataArray[index]/100 - oldScale);
            mesh.scale.set(newScale, newScale, newScale);
            index += 1;
        }
    }

}

const render = () => {
    requestAnimationFrame(render);

    camera.position.z -= speed;
    camera.position.x += (mouseX - camera.position.x) * .08;
    if (camera.position.z < (closest.position.z - 35) && speed > 0) {
        removeLine(false);
        addCircle(false);
    } else if (camera.position.z > (farest.position.z + 665) && speed < 0) {
        removeLine(true);
        addCircle(true);
    }

    resizeCircles();

    renderer.render(scene, camera);
}

init();