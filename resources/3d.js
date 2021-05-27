import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';
import {OBJLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/OBJLoader.js';

const audio = document.querySelector('video');

document.body.addEventListener('click', () => {
	audio.play();
})

audio.addEventListener('play', () => {
	const tracks = audio.textTracks[0];
	const cues = tracks.cues;
	for (const [index, cue] of Object.entries(cues)) {
		if(typeof(cue) === 'object'){			
			cue.onenter = cueEnter;
		}
	}
});

function cueEnter(){
	let image = false;
	let filename = '';
	let subtitleText = this.text;
	if(subtitleText.includes('[[')) {
		const matches = this.text.match(/\[\[(.*)\]\]/);		
		if(matches[1]){
			image = true;
			filename = matches[1];
		}
	}
	drawSubtitle(image, this.text, filename);
}


const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});

const fov = 45;
const aspect = 3;
const near = 0.1;
const far = 100;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 10, 20);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.update();

const scene = new THREE.Scene();
scene.background = new THREE.Color('#222');

{
	const skyColor = 0xB1E1FF;  // light blue
	const groundColor = 0xB97A20;  // brownish orange
	const intensity = 1;
	const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
	scene.add(light);
}

{
	const color = 0xFFFFFF;
	const intensity = 1;
	const light = new THREE.DirectionalLight(color, intensity);
	light.position.set(0, 10, 0);
	light.target.position.set(-5, 0, 0);
	scene.add(light);
	scene.add(light.target);
}

var subtitleCanvas = document.createElement("canvas");
subtitleCanvas.height = 540;
subtitleCanvas.width = 540;
var ctx = subtitleCanvas.getContext("2d");
ctx.textBaseline = 'middle';
drawSubtitle(false, 'Click to start');

const texture = new THREE.CanvasTexture(ctx.canvas);
const material = new THREE.MeshPhongMaterial({
	map: texture,
	side: THREE.DoubleSide
});
material.needsUpdate = true;


function drawSubtitle(image, subtitle, filename) {
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, 540, 540); 
	if(image){			
		const image = new Image();
		image.onload = () => {
			ctx.imageSmoothingEnabled = false;
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.drawImage(image, 50, 50,540,540);
		};
		image.src = 'media/'+filename;
	} else {
		ctx.font = "40pt Helvetica";
		ctx.fillStyle = "#fff";
		const lines = getLines(ctx, subtitle, 500);
		for(var i in lines){
			ctx.fillText(lines[i], 0, 50 + i * 100);			
		}
	}
}


const objs = [];

const filenames = [
	{
		filename: 'blob-test',
		position: {
			x: -5,
			y: 1,
			z: 0
		}
	},
	{
		filename: 'blob2',
		position: {
			x: 0,
			y: 0,
			z: -3
		}
	},
	{
		filename: 'blob1',
		position: {
			x: 8,
			y: 0,
			z: 0
		}
	}
];

filenames.forEach(file=>{
	const objLoader = new OBJLoader();
	objLoader.load('objs/'+file.filename+'.obj', (root) => {
		root.traverse( function ( child ) {
			console.log(child);
			if ( child instanceof THREE.Mesh ) {
				child.material = material;
				child.material.side = THREE.DoubleSide;
			}
		});
		root.position.x = file.position.x;
		root.position.y = file.position.y;
		root.position.z = file.position.z;
		objs.push(root);
		scene.add(root);
		root.scale.multiplyScalar(0.01)
	});
});


function resizeRendererToDisplaySize(renderer) {
	const canvas = renderer.domElement;
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	const needResize = canvas.width !== width || canvas.height !== height;
	if (needResize) {
		renderer.setSize(width, height, false);
	}
	return needResize;
}

function render(time) {
	time *= 0.001;
	if (resizeRendererToDisplaySize(renderer)) {
		const canvas = renderer.domElement;
		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.updateProjectionMatrix();
	}
	texture.needsUpdate = true;

	objs.forEach((obj, ndx) => {
		const speed = .2 + ndx * .1;
		const rot = time * speed;
		obj.rotation.x = rot;
		obj.rotation.y = rot;
	});

	renderer.render(scene, camera);
	requestAnimationFrame(render);
}


requestAnimationFrame(render);

function getLines(ctx, text, maxWidth) {
	var words = text.split(" ");
	var lines = [];
	var currentLine = words[0];

	for (var i = 1; i < words.length; i++) {
		var word = words[i];
		var width = ctx.measureText(currentLine + " " + word).width;
		if (width < maxWidth) {
			currentLine += " " + word;
		} else {
			lines.push(currentLine);
			currentLine = word;
		}
	}
	lines.push(currentLine);
	return lines;
}