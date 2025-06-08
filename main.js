// Import necessary modules
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {
    Audio,
    AudioListener
} from 'three';
import {
    OrbitControls
} from 'three/addons/controls/OrbitControls.js';
import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';
import {
    DRACOLoader
} from 'three/addons/loaders/DRACOLoader.js';
import {
    EffectComposer
} from 'three/addons/postprocessing/EffectComposer.js';
import {
    RenderPass
} from 'three/addons/postprocessing/RenderPass.js';
import {
    UnrealBloomPass
} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {
    SMAAPass
} from 'three/addons/postprocessing/SMAAPass.js';
import {
    RGBELoader
} from 'three/addons/loaders/RGBELoader.js';

// Debug flag and helper
const DEBUG = false;
const debugLog = (...args) => {
    if (DEBUG) console.log(...args);
};

// Initialize loading manager
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const gltfLoader = new GLTFLoader(loadingManager);
const dracoLoader = new DRACOLoader(loadingManager);
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
gltfLoader.setDRACOLoader(dracoLoader);
// Preload the decoder to ensure DRACO compressed assets load correctly
dracoLoader.preload();
const rgbeLoader = new RGBELoader(loadingManager); // Add RGBELoader instance

// List of UI card image URLs to preload
const uiImageUrls = [
    '/UI elements/Tree UI Card.jpg',
    '/UI elements/TeleportPad UI Card.jpg',
    '/UI elements/Slide UI card.jpg',
    '/UI elements/Jungle Gym UI Card.jpg',
    '/UI elements/Info-Panel UI Card.jpg',
    '/UI elements/Door UI Card.jpg',
    '/UI elements/Bench UI Card.jpg',
    '/UI elements/School Hall UI-1.jpg',
    '/UI elements/School Hall UI-2.jpg',
    '/UI elements/Controls screen UI.jpg',
    '/UI elements/Start_Screen.jpg'
];

let assetsLoaded = false;
let uiImagesLoaded = 0;
let typewriterInterval = null; // For managing the typewriter effect

const parentDiv = document.getElementById('renderDiv');
let canvas = document.getElementById('threeRenderCanvas');
if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'threeRenderCanvas';
    parentDiv.appendChild(canvas);
}

// Create Start Screen
const startScreen = document.createElement('div');
startScreen.id = 'startScreen';
startScreen.style.position = 'absolute';
startScreen.style.top = '0';
startScreen.style.left = '0';
startScreen.style.width = '100%';
startScreen.style.height = '100%';
startScreen.style.backgroundColor = 'rgba(25, 25, 112, 0.9)'; // Midnight Blue background
startScreen.style.color = 'white';
startScreen.style.display = 'flex'; // Initially visible
startScreen.style.flexDirection = 'column';
startScreen.style.justifyContent = 'center';
startScreen.style.alignItems = 'center';
startScreen.style.fontFamily = "'Baloo 2', cursive, sans-serif";
startScreen.style.zIndex = '200';

const gameTitleImage = document.createElement('img');
gameTitleImage.src = '/UI elements/Start_Screen.jpg';
gameTitleImage.alt = 'Game Title';
gameTitleImage.style.width = '100vw';
gameTitleImage.style.height = 'auto';
gameTitleImage.style.maxHeight = 'calc(100vh - 100px)'; // Ensure it fits neatly
gameTitleImage.style.objectFit = 'contain'; // Ensure aspect ratio is maintained without cropping
gameTitleImage.style.marginBottom = '20px';
startScreen.appendChild(gameTitleImage);

const startButton = document.createElement('button');
startButton.id = 'startButton';
startButton.innerText = 'Start Game';
startButton.style.padding = '12px 25px';
startButton.style.fontSize = '22px';
startButton.style.fontFamily = "'Baloo 2', cursive, sans-serif";
startButton.style.backgroundColor = '#c40277';
startButton.style.color = '#FFFFFF';
startButton.style.border = '2px solid #c40277';
startButton.style.borderRadius = '25px';
startButton.style.cursor = 'pointer';
startButton.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
startButton.disabled = true; // Initially disabled
startScreen.appendChild(startButton);

// Create loading progress text for Start Screen
const loadingProgressText = document.createElement('p');
loadingProgressText.id = 'loadingProgressText';
loadingProgressText.innerText = 'Loading assets... 0%';
loadingProgressText.style.marginTop = '20px';
loadingProgressText.style.fontSize = '18px';
loadingProgressText.style.fontFamily = "'Baloo 2', cursive, sans-serif";
loadingProgressText.style.color = '#FFFFFF';
startScreen.appendChild(loadingProgressText);
parentDiv.appendChild(startScreen);

function enableStartIfReady() {
    if (assetsLoaded && uiImagesLoaded === uiImageUrls.length) {
        if (loadingProgressText) {
            loadingProgressText.style.display = 'none';
        }
        startButton.disabled = false;
    }
}

// Create a container for top center HUD prompts
const topPromptsContainer = document.createElement('div');
topPromptsContainer.id = 'topPromptsContainer';
topPromptsContainer.style.position = 'absolute';
topPromptsContainer.style.top = '20px';
topPromptsContainer.style.left = '50%';
topPromptsContainer.style.transform = 'translateX(-50%)';
topPromptsContainer.style.display = 'flex'; // Use flexbox to align items side-by-side
topPromptsContainer.style.gap = '10px'; // Space between the prompts
topPromptsContainer.style.zIndex = '100';
topPromptsContainer.style.pointerEvents = 'none'; // So it doesn't block interactions
parentDiv.appendChild(topPromptsContainer);

// Create "Press V to Vibe" UI element
const vibePromptHUD = document.createElement('div');
vibePromptHUD.id = 'vibePromptHUD';
vibePromptHUD.style.padding = '10px 20px';
vibePromptHUD.style.backgroundColor = 'rgba(173, 216, 230, 0.8)'; // Pastel light blue with transparency
vibePromptHUD.style.color = 'white';
vibePromptHUD.style.fontFamily = "'Baloo 2', cursive, sans-serif";
vibePromptHUD.style.fontSize = '18px';
vibePromptHUD.style.borderRadius = '15px'; // Rounded edges
vibePromptHUD.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.5)'; // Subtle text shadow
vibePromptHUD.innerHTML = 'Press V to Vibe';
vibePromptHUD.style.display = 'none'; // Initially hidden
topPromptsContainer.appendChild(vibePromptHUD); // Append to container

// Create "Press R for Controls" UI element
const controlsPromptHUD = document.createElement('div');
controlsPromptHUD.id = 'controlsPromptHUD';
controlsPromptHUD.style.padding = '10px 20px';
controlsPromptHUD.style.backgroundColor = 'rgba(173, 216, 230, 0.8)'; // Same style as vibe prompt
controlsPromptHUD.style.color = 'white';
controlsPromptHUD.style.fontFamily = "'Baloo 2', cursive, sans-serif";
controlsPromptHUD.style.fontSize = '18px';
controlsPromptHUD.style.borderRadius = '15px';
controlsPromptHUD.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.5)';
controlsPromptHUD.innerHTML = 'Press R for Controls';
controlsPromptHUD.style.display = 'none'; // Initially hidden
topPromptsContainer.appendChild(controlsPromptHUD); // Append to container

// Create Mute Button HUD element
const muteButtonHUD = document.createElement('button');
muteButtonHUD.id = 'muteButtonHUD';
muteButtonHUD.style.padding = '10px 15px'; // Slightly less padding than text prompts
muteButtonHUD.style.backgroundColor = 'rgba(173, 216, 230, 0.8)';
muteButtonHUD.style.color = 'white';
muteButtonHUD.style.fontFamily = "'Baloo 2', cursive, sans-serif";
muteButtonHUD.style.fontSize = '16px'; // Smaller font size for button
muteButtonHUD.style.borderRadius = '10px'; // Rounded edges for button
muteButtonHUD.style.border = 'none';
muteButtonHUD.style.cursor = 'pointer';
muteButtonHUD.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.5)';
muteButtonHUD.innerHTML = 'Press T to Mute'; // Initial text
muteButtonHUD.style.display = 'none'; // Initially hidden
topPromptsContainer.appendChild(muteButtonHUD); // Append to container

// Create "Press E to Interact" Prompt
const interactPromptHUD = document.createElement('div');
interactPromptHUD.id = 'interactPromptHUD';
interactPromptHUD.style.position = 'absolute';
interactPromptHUD.style.bottom = '80px'; // Position above animation HUD
interactPromptHUD.style.left = '50%';
interactPromptHUD.style.transform = 'translateX(-50%)';
interactPromptHUD.style.padding = '10px 20px';
interactPromptHUD.style.backgroundColor = 'rgba(100, 149, 237, 0.8)'; // Cornflower blue
interactPromptHUD.style.color = 'white';
interactPromptHUD.style.fontFamily = "'Baloo 2', cursive, sans-serif";
interactPromptHUD.style.fontSize = '18px';
interactPromptHUD.style.borderRadius = '15px';
interactPromptHUD.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.5)';
interactPromptHUD.style.zIndex = '100';
interactPromptHUD.innerHTML = 'Press E to Interact';
interactPromptHUD.style.display = 'none'; // Initially hidden
parentDiv.appendChild(interactPromptHUD);

// Create Interaction Pop-up
const interactionPopup = document.createElement('div');
interactionPopup.id = 'interactionPopup';
interactionPopup.style.position = 'absolute';
interactionPopup.style.top = '50%';
interactionPopup.style.left = '50%';
interactionPopup.style.transform = 'translate(-50%, -50%)';
interactionPopup.style.padding = '0px'; // Adjusted padding
interactionPopup.style.backgroundColor = 'rgba(50, 50, 50, 0.9)';
interactionPopup.style.color = 'white';
interactionPopup.style.fontFamily = "'Baloo 2', cursive, sans-serif";
interactionPopup.style.fontSize = '20px';
interactionPopup.style.border = '2px solid #c40277';
interactionPopup.style.borderRadius = '10px';
interactionPopup.style.zIndex = '300'; // Higher than other HUDs
interactionPopup.style.display = 'none'; // Initially hidden
interactionPopup.innerHTML = 'Object Name'; // Placeholder
interactionPopup.style.maxWidth = '90vw'; // Max width relative to viewport
interactionPopup.style.maxHeight = '90vh'; // Max height relative to viewport
interactionPopup.style.overflow = 'auto'; // Add scroll if content is too large
interactionPopup.style.boxSizing = 'border-box';
parentDiv.appendChild(interactionPopup);

// Create Controls Pop-up Screen
const controlsPopup = document.createElement('div');
controlsPopup.id = 'controlsPopup';
controlsPopup.style.position = 'absolute';
controlsPopup.style.top = '50%';
controlsPopup.style.left = '50%';
controlsPopup.style.transform = 'translate(-50%, -50%)';
controlsPopup.style.width = '1024px'; // Target width for the image display area
controlsPopup.style.height = '1536px'; // Target height for the image display area
controlsPopup.style.maxWidth = 'min(1024px, 90vw)'; // Don't exceed 1024px or 90vw
controlsPopup.style.maxHeight = 'min(1536px, 90vh)'; // Don't exceed 1536px or 90vh
controlsPopup.style.padding = '15px'; // Padding for the frame
controlsPopup.style.boxSizing = 'border-box'; // Width/Height includes padding and border
controlsPopup.style.backgroundImage = `url('/UI elements/Controls screen UI.jpg')`;
controlsPopup.style.backgroundSize = 'contain'; // Scale image to fit within padding box
controlsPopup.style.backgroundRepeat = 'no-repeat';
controlsPopup.style.backgroundPosition = 'center';
controlsPopup.style.border = 'none';
controlsPopup.style.borderRadius = '15px';
controlsPopup.style.boxShadow = 'none';
controlsPopup.style.zIndex = '400'; // Higher than interactionPopup
controlsPopup.style.display = 'none'; // Initially hidden
controlsPopup.style.cursor = 'pointer'; // Indicate it can be clicked to close
controlsPopup.style.overflow = 'auto'; // Add scrollbars if content overflows due to fixed size
controlsPopup.style.backgroundColor = 'transparent';
parentDiv.appendChild(controlsPopup);

// Create Speech Bubble Element
const speechBubble = document.createElement('div');
speechBubble.id = 'speechBubble';
speechBubble.style.position = 'absolute';
speechBubble.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
speechBubble.style.color = '#333';
speechBubble.style.padding = '15px';
speechBubble.style.borderRadius = '15px';
speechBubble.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
speechBubble.style.maxWidth = '300px';
speechBubble.style.textAlign = 'center';
speechBubble.style.fontFamily = "'Baloo 2', cursive, sans-serif";
speechBubble.style.fontSize = '16px';
speechBubble.style.zIndex = '500'; // Higher than other popups
speechBubble.style.display = 'none'; // Initially hidden
speechBubble.style.pointerEvents = 'auto'; // Allow interaction with bubble content

// Add a little triangle/tail to the speech bubble
speechBubble.style.setProperty('--speech-bubble-tail-color', 'rgba(255, 255, 255, 0.95)');
speechBubble.style.setProperty('--speech-bubble-tail-position', '50%');
const speechBubbleTailStyle = document.createElement('style');
speechBubbleTailStyle.innerHTML = `
  #speechBubble::after {
    content: "";
    position: absolute;
    bottom: -10px; /* Position the tail at the bottom */
    left: var(--speech-bubble-tail-position); /* Center the tail horizontally */
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid var(--speech-bubble-tail-color); /* Tail color matches bubble */
  }
`;
document.head.appendChild(speechBubbleTailStyle);
parentDiv.appendChild(speechBubble);

// Event listener to close controls popup when clicked
controlsPopup.addEventListener('click', () => {
    controlsPopup.style.display = 'none';
    if (controlsPromptHUD) controlsPromptHUD.style.display = 'flex'; // Show prompt again
});

// Start button event listener
startButton.addEventListener('click', () => {
    if (assetsLoaded) {
        startScreen.style.display = 'none'; // Hide start screen
        vibePromptHUD.style.display = 'flex'; // Show vibe prompt
        controlsPromptHUD.style.display = 'flex'; // Show controls prompt
        muteButtonHUD.style.display = 'block'; // Show mute button
        if (sound && !sound.isPlaying && muteButtonHUD.innerHTML === 'Press T to Mute') {
            sound.play();
        }
        // Show speech bubble after 5 seconds
        setTimeout(() => {
            if (speechBubble && character) { // Ensure bubble and character exist
                const welcomeMessage = "Welcome to the gamified introduction to A-Level Math!";
                typewriterEffect(speechBubble, welcomeMessage);
                speechBubble.style.display = 'block';
                // Initial positioning, will be updated in animate loop
                speechBubble.style.left = '50%'; // Placeholder, will be updated by animate loop
                speechBubble.style.top = '30%'; // Placeholder
                speechBubble.style.transform = 'translate(-50%, -100%)';
                // After 5 seconds of the first message being displayed, show the second message
                setTimeout(() => {
                    if (speechBubble && speechBubble.style.display === 'block') { // Check if still visible
                        const secondMessage = "Let's go to the School hall, to learn more about this world!";
                        typewriterEffect(speechBubble, secondMessage);
                        // After 5 seconds of the second message, hide the bubble
                        setTimeout(() => {
                            if (speechBubble) {
                                speechBubble.style.display = 'none';
                                if (typewriterInterval) { // Clear any ongoing typewriter for the second message
                                    clearInterval(typewriterInterval);
                                    typewriterInterval = null;
                                }
                            }
                        }, 5000); // 5 seconds for the second message
                    }
                }, 5000); // 5 seconds for the first message
            }
        }, 5000); // Initial 5-second delay before the first message
    }
});

// Loading manager events
loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    const totalAssetsToLoad = itemsTotal + uiImageUrls.length;
    const progress = (((itemsLoaded + uiImagesLoaded) / totalAssetsToLoad) * 100).toFixed(0);
    if (loadingProgressText) {
        loadingProgressText.innerText = `Loading assets... ${progress}%`;
    }
};

// Preload UI images
uiImageUrls.forEach(url => {
    textureLoader.load(url, () => {
        uiImagesLoaded++;
        debugLog(`Preloaded UI image: ${url}`);
        enableStartIfReady();
    }, undefined, (err) => {
        console.error(`Error preloading UI image ${url}:`, err);
    });
});

loadingManager.onLoad = function() {
    assetsLoaded = true;
    enableStartIfReady();
};

loadingManager.onError = function(url) {
    console.error('Error loading:', url);
};

// Audio Listener and Sound
let audioListener;
let sound;
const audioLoader = new THREE.AudioLoader(loadingManager);

// Mute button event listener
muteButtonHUD.addEventListener('click', () => {
    if (sound) {
        if (sound.isPlaying) {
            sound.pause();
            muteButtonHUD.innerHTML = 'Press T to Unmute';
        } else {
            sound.play();
            muteButtonHUD.innerHTML = 'Press T to Mute';
        }
    }
});

// Initialize the scene
const scene = new THREE.Scene();
const world = new CANNON.World();
world.gravity.set(0, -20, 0);
world.defaultContactMaterial.friction = 0.01; // Reduced global friction
world.defaultContactMaterial.restitution = 0; // No bounce by default
world.solver.iterations = 10;
world.solver.tolerance = 0.001;

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

// Define physics materials
const groundPhysMaterial = new CANNON.Material('ground');

// Define physics material for the ball
const ballPhysMaterial = new CANNON.Material('ballMaterial');

// Create contact material between ball and ground
const ballGroundContactMaterial = new CANNON.ContactMaterial(
    ballPhysMaterial,
    groundPhysMaterial, {
        friction: 0.05, // Lower friction for smoother rolling
        restitution: 0.95, // High restitution for bouncy balls
    }
);
world.addContactMaterial(ballGroundContactMaterial);

const clock = new THREE.Clock();

// Initialize the camera
const camera = new THREE.PerspectiveCamera(
    75,
    canvas.offsetWidth / canvas.offsetHeight,
    0.1,
    1000
);
// Adjusted camera position
camera.position.set(0, 20, 30); // Increased initial Y position
camera.lookAt(0, 0, 0);

// Initialize Audio
audioListener = new THREE.AudioListener();
camera.add(audioListener); // Add listener to the camera
sound = new THREE.Audio(audioListener);

// Placeholder for music URL - replace with actual URL
const musicURL = '/Textures/BackgroundMusic 1.mp3';
audioLoader.load(musicURL, function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5); // Set volume to 50%
    // Do not play immediately, will be started by startButton or if unmuted
    debugLog("Ambient music loaded.");
}, undefined, function(error) {
    console.error('Error loading ambient music:', error);
});

// Camera settings for character following
const cameraSettings = {
    offset: new THREE.Vector3(0, 15, 30), // Further Increased camera offset Y
    smoothSpeed: 0.1,
    rotationSpeed: 0.5,
    minPolarAngle: 0.1,
    maxPolarAngle: Math.PI / 2,
    minDistance: 16, // Increased minimum distance
    maxDistance: 60, // Increased maximum distance
    minFollowDistance: 24, // Increased minimum follow distance
};

// Initialize the renderer with HDR
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas,
    powerPreference: 'high-performance',
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Initialize post-processing
const composer = new EffectComposer(renderer);

// Regular scene render pass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add subtle bloom effect
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.2, // bloom strength
    0.4, // radius
    0.9 // threshold
);
composer.addPass(bloomPass);

// Add anti-aliasing
const smaaPass = new SMAAPass(
    window.innerWidth * renderer.getPixelRatio(),
    window.innerHeight * renderer.getPixelRatio()
);
composer.addPass(smaaPass);

// Initialize composer size
composer.setSize(parentDiv.clientWidth, parentDiv.clientHeight);

// Define sky colors for environmental lighting
const skyColor = new THREE.Color(0x87ceeb); // Bright sky blue
const groundColor = new THREE.Color(0xffffff); // White ground reflection

const hdriUrl = "/Textures/table_mountain_1_puresky_2k.hdr";
rgbeLoader.load(hdriUrl, (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
    debugLog("HDRI loaded and applied to scene background and environment.");
}, undefined, (error) => {
    console.error('Error loading HDRI:', error);
    // Fallback to a simple color background if HDRI fails
    scene.background = new THREE.Color(0xcccccc);
});

// Modify OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minPolarAngle = cameraSettings.minPolarAngle;
controls.maxPolarAngle = cameraSettings.maxPolarAngle;
controls.minDistance = cameraSettings.minDistance;
controls.maxDistance = cameraSettings.maxDistance;
controls.target = new THREE.Vector3(0, 0, 0); // Lower the target to make the camera look down a bit more

// Create flat terrain
function createTerrain() {
    const size = 500; // Increased map size
    // Create simple flat plane for visuals
    const geometry = new THREE.PlaneGeometry(size, size);
    const texture = textureLoader.load('/Textures/Grass-texture.jpg');
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(50, 50); // Increased texture repeat to maintain proper scaling
    texture.encoding = THREE.sRGBEncoding;

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.1,
        envMapIntensity: 1.0,
    });

    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);

    const groundShape = new CANNON.Box(new CANNON.Vec3(size / 2, 0.1, size / 2));
    const groundBody = new CANNON.Body({
        mass: 0,
        material: groundPhysMaterial,
    });
    groundBody.addShape(groundShape);
    groundBody.position.set(0, -0.1, 0);
    world.addBody(groundBody);

    return terrain;
}

// Setup improved lighting system
const sunLight = new THREE.DirectionalLight(new THREE.Color(0xfff0dd), 0.5); // Reduced intensity by 50%
sunLight.position.set(-50, 100, -50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 400;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
sunLight.shadow.bias = -0.001;
scene.add(sunLight);

// Add hemisphere light to simulate sky and ground bounce light
const hemiLight = new THREE.HemisphereLight(skyColor, new THREE.Color(0xebd1b3), 1.8); // Brighter Hemi, warmer ground
scene.add(hemiLight);

// =========================
// Character Integration
// =========================

// Variables for character
let character = null;
let characterBody = null;
let mixer = null;
let isGrounded = false;
let currentJumps = 0;
let lastJumpTime = 0;
let moveDirection = new THREE.Vector3();
let skipAction = null; // Renamed from walkAction, will use skip animation
let idleAction = null;
let jumpAction = null; // Will remain null if not loaded
let fallAction = null; // Will remain null if not loaded
let danceAction = null; // Added for dance animation
let contactNormal = new CANNON.Vec3();
let upAxis = new CANNON.Vec3(0, 1, 0);
let infoPanelObject = null; // To store the info panel mesh and body
let benchObject = null; // To store the bench mesh and body
let treeObject = null; // To store the new Tree mesh and body
let junglegymObject = null;
let doorObject = null;
let slideObject = null;
let teleportPadObject = null;
let schoolHallObject = null; // Added for school hall
let interactionPopupVisible = false;

// Animation states
const AnimationState = {
    IDLE: 'idle',
    MOVING: 'moving', // This will use skipAction
    JUMPING: 'jumping',
    FALLING: 'falling',
    DANCE: 'dance', // Added for dance state
};
let currentAnimationState = AnimationState.IDLE;

const keysPressed = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    v: false, // For dance
    e: false, // For interaction
    r: false, // For controls
    t: false, // For mute
};

// Character physics settings
const characterSettings = {
    mass: 1,
    radius: 0.5,
    height: 1.8,
    jumpForce: 8,
    maxJumps: 2,
    jumpCooldown: 200,
    moveSpeed: 8,
    airMoveSpeed: 4,
    groundDamping: 0.9,
    airDamping: 0.98,
};

// Load character model and animations
function loadCharacter() {
    // Load idle animation
    gltfLoader.load('./Models/idle.glb', (gltf) => {
        character = gltf.scene;
        character.scale.set(1, 1, 1);
        character.position.set(0, 0, 0);
        character.castShadow = true;
        character.receiveShadow = true;
        
        // Traverse and set shadow properties
        character.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(character);
        
        // Setup animation mixer
        mixer = new THREE.AnimationMixer(character);
        
        // Setup idle animation
        if (gltf.animations.length > 0) {
            idleAction = mixer.clipAction(gltf.animations[0]);
            idleAction.play();
        }
        
        // Load skip animation
        gltfLoader.load('./Models/skip.glb', (skipGltf) => {
            if (skipGltf.animations.length > 0) {
                skipAction = mixer.clipAction(skipGltf.animations[0]);
            }
        });
        
        // Load dance animation
        gltfLoader.load('./Models/dance.glb', (danceGltf) => {
            if (danceGltf.animations.length > 0) {
                danceAction = mixer.clipAction(danceGltf.animations[0]);
            }
        });
        
        // Create physics body for character
        const characterShape = new CANNON.Cylinder(
            characterSettings.radius,
            characterSettings.radius,
            characterSettings.height,
            8
        );
        characterBody = new CANNON.Body({
            mass: characterSettings.mass,
            shape: characterShape,
            material: new CANNON.Material('character'),
        });
        characterBody.position.set(0, 1, 0);
        characterBody.fixedRotation = true;
        characterBody.updateMassProperties();
        world.addBody(characterBody);
        
        debugLog("Character loaded successfully");
    }, undefined, (error) => {
        console.error('Error loading character:', error);
    });
}

// Animation transition function
function transitionToAnimation(newState) {
    if (currentAnimationState === newState) return;
    
    const previousState = currentAnimationState;
    currentAnimationState = newState;
    
    // Fade out previous animation
    let previousAction = null;
    switch (previousState) {
        case AnimationState.IDLE:
            previousAction = idleAction;
            break;
        case AnimationState.MOVING:
            previousAction = skipAction;
            break;
        case AnimationState.DANCE:
            previousAction = danceAction;
            break;
    }
    
    // Fade in new animation
    let newAction = null;
    switch (newState) {
        case AnimationState.IDLE:
            newAction = idleAction;
            break;
        case AnimationState.MOVING:
            newAction = skipAction;
            break;
        case AnimationState.DANCE:
            newAction = danceAction;
            break;
    }
    
    if (previousAction && newAction && previousAction !== newAction) {
        previousAction.fadeOut(0.3);
        newAction.reset().fadeIn(0.3).play();
    } else if (newAction && !previousAction) {
        newAction.reset().fadeIn(0.3).play();
    }
}

// Ground detection
function checkGrounded() {
    if (!characterBody) return false;
    
    const raycastResult = new CANNON.RaycastResult();
    const rayDirection = new CANNON.Vec3(0, -1, 0);
    const rayStart = characterBody.position.clone();
    rayStart.y += 0.1;
    
    world.raycastClosest(rayStart, rayStart.vadd(rayDirection.scale(characterSettings.height / 2 + 0.2)), {}, raycastResult);
    
    if (raycastResult.hasHit) {
        contactNormal.copy(raycastResult.hitNormalWorld);
        const dot = contactNormal.dot(upAxis);
        return dot > 0.7; // Surface is walkable if normal is close to up
    }
    
    return false;
}

// Character movement
function updateCharacterMovement(deltaTime) {
    if (!character || !characterBody) return;
    
    // Check if grounded
    isGrounded = checkGrounded();
    
    // Reset jump count when grounded
    if (isGrounded) {
        currentJumps = 0;
    }
    
    // Calculate movement direction
    moveDirection.set(0, 0, 0);
    
    if (keysPressed.w) moveDirection.z -= 1;
    if (keysPressed.s) moveDirection.z += 1;
    if (keysPressed.a) moveDirection.x -= 1;
    if (keysPressed.d) moveDirection.x += 1;
    
    // Normalize movement direction
    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        
        // Apply camera rotation to movement
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();
        
        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
        
        const worldMoveDirection = new THREE.Vector3();
        worldMoveDirection.addScaledVector(cameraRight, moveDirection.x);
        worldMoveDirection.addScaledVector(cameraDirection, -moveDirection.z);
        
        // Apply movement force
        const moveSpeed = isGrounded ? characterSettings.moveSpeed : characterSettings.airMoveSpeed;
        const force = new CANNON.Vec3(
            worldMoveDirection.x * moveSpeed,
            0,
            worldMoveDirection.z * moveSpeed
        );
        characterBody.applyForce(force);
        
        // Rotate character to face movement direction
        if (worldMoveDirection.length() > 0) {
            const targetRotation = Math.atan2(worldMoveDirection.x, worldMoveDirection.z);
            character.rotation.y = THREE.MathUtils.lerp(character.rotation.y, targetRotation, 0.1);
        }
    }
    
    // Jumping
    if (keysPressed.space && currentJumps < characterSettings.maxJumps) {
        const currentTime = Date.now();
        if (currentTime - lastJumpTime > characterSettings.jumpCooldown) {
            const jumpForce = new CANNON.Vec3(0, characterSettings.jumpForce, 0);
            characterBody.applyImpulse(jumpForce);
            currentJumps++;
            lastJumpTime = currentTime;
        }
    }
    
    // Apply damping
    const damping = isGrounded ? characterSettings.groundDamping : characterSettings.airDamping;
    characterBody.velocity.x *= damping;
    characterBody.velocity.z *= damping;
    
    // Update character visual position
    character.position.copy(characterBody.position);
    character.position.y -= characterSettings.height / 2; // Adjust for cylinder center
    
    // Update animation state
    const isMoving = moveDirection.length() > 0;
    const isDancing = keysPressed.v;
    
    if (isDancing && danceAction) {
        transitionToAnimation(AnimationState.DANCE);
    } else if (isMoving) {
        transitionToAnimation(AnimationState.MOVING);
    } else {
        transitionToAnimation(AnimationState.IDLE);
    }
}

// Camera following
function updateCameraFollow() {
    if (!character) return;
    
    const targetPosition = character.position.clone().add(cameraSettings.offset);
    camera.position.lerp(targetPosition, cameraSettings.smoothSpeed);
    
    // Make camera look at character
    const lookAtTarget = character.position.clone();
    lookAtTarget.y += 2; // Look at character's upper body
    camera.lookAt(lookAtTarget);
    
    // Update controls target
    controls.target.copy(lookAtTarget);
}

// Speech bubble positioning
function updateSpeechBubblePosition() {
    if (!character || !speechBubble || speechBubble.style.display === 'none') return;
    
    // Get character's screen position
    const characterScreenPosition = character.position.clone();
    characterScreenPosition.y += 3; // Position above character's head
    characterScreenPosition.project(camera);
    
    // Convert to screen coordinates
    const x = (characterScreenPosition.x * 0.5 + 0.5) * window.innerWidth;
    const y = (characterScreenPosition.y * -0.5 + 0.5) * window.innerHeight;
    
    // Position speech bubble
    speechBubble.style.left = `${x}px`;
    speechBubble.style.top = `${y - 60}px`; // Offset above character
    speechBubble.style.transform = 'translate(-50%, -100%)';
}

// Typewriter effect function
function typewriterEffect(element, text, speed = 50) {
    if (typewriterInterval) {
        clearInterval(typewriterInterval);
    }
    
    element.innerHTML = '';
    let i = 0;
    
    typewriterInterval = setInterval(() => {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
        } else {
            clearInterval(typewriterInterval);
            typewriterInterval = null;
        }
    }, speed);
}

// Load interactive objects
function loadInteractiveObjects() {
    // Load Info Panel
    gltfLoader.load('./Models/Info-Panel-v1.glb', (gltf) => {
        const infoPanelMesh = gltf.scene;
        infoPanelMesh.position.set(10, 0, 10);
        infoPanelMesh.scale.set(1, 1, 1);
        infoPanelMesh.castShadow = true;
        infoPanelMesh.receiveShadow = true;
        
        infoPanelMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(infoPanelMesh);
        
        // Create physics body
        const infoPanelShape = new CANNON.Box(new CANNON.Vec3(2, 2, 0.5));
        const infoPanelBody = new CANNON.Body({ mass: 0 });
        infoPanelBody.addShape(infoPanelShape);
        infoPanelBody.position.set(10, 2, 10);
        world.addBody(infoPanelBody);
        
        infoPanelObject = { mesh: infoPanelMesh, body: infoPanelBody };
        debugLog("Info Panel loaded");
    });
    
    // Load Bench
    gltfLoader.load('./Models/Bench-v1.glb', (gltf) => {
        const benchMesh = gltf.scene;
        benchMesh.position.set(-10, 0, 10);
        benchMesh.scale.set(1, 1, 1);
        benchMesh.castShadow = true;
        benchMesh.receiveShadow = true;
        
        benchMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(benchMesh);
        
        // Create physics body
        const benchShape = new CANNON.Box(new CANNON.Vec3(2, 1, 0.5));
        const benchBody = new CANNON.Body({ mass: 0 });
        benchBody.addShape(benchShape);
        benchBody.position.set(-10, 1, 10);
        world.addBody(benchBody);
        
        benchObject = { mesh: benchMesh, body: benchBody };
        debugLog("Bench loaded");
    });
    
    // Load Tree
    gltfLoader.load('./Models/Tree2-v1.glb', (gltf) => {
        const treeMesh = gltf.scene;
        treeMesh.position.set(20, 0, -10);
        treeMesh.scale.set(1, 1, 1);
        treeMesh.castShadow = true;
        treeMesh.receiveShadow = true;
        
        treeMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(treeMesh);
        
        // Create physics body
        const treeShape = new CANNON.Cylinder(1, 1, 8, 8);
        const treeBody = new CANNON.Body({ mass: 0 });
        treeBody.addShape(treeShape);
        treeBody.position.set(20, 4, -10);
        world.addBody(treeBody);
        
        treeObject = { mesh: treeMesh, body: treeBody };
        debugLog("Tree loaded");
    });
    
    // Load Jungle Gym
    gltfLoader.load('./Models/Junglegym-v1.glb', (gltf) => {
        const junglegymMesh = gltf.scene;
        junglegymMesh.position.set(-20, 0, -10);
        junglegymMesh.scale.set(1, 1, 1);
        junglegymMesh.castShadow = true;
        junglegymMesh.receiveShadow = true;
        
        junglegymMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(junglegymMesh);
        
        // Create physics body
        const junglegymShape = new CANNON.Box(new CANNON.Vec3(3, 3, 3));
        const junglegymBody = new CANNON.Body({ mass: 0 });
        junglegymBody.addShape(junglegymShape);
        junglegymBody.position.set(-20, 3, -10);
        world.addBody(junglegymBody);
        
        junglegymObject = { mesh: junglegymMesh, body: junglegymBody };
        debugLog("Jungle Gym loaded");
    });
    
    // Load Door
    gltfLoader.load('./Models/Door-v1.glb', (gltf) => {
        const doorMesh = gltf.scene;
        doorMesh.position.set(0, 0, -20);
        doorMesh.scale.set(1, 1, 1);
        doorMesh.castShadow = true;
        doorMesh.receiveShadow = true;
        
        doorMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(doorMesh);
        
        // Create physics body
        const doorShape = new CANNON.Box(new CANNON.Vec3(1, 2, 0.2));
        const doorBody = new CANNON.Body({ mass: 0 });
        doorBody.addShape(doorShape);
        doorBody.position.set(0, 2, -20);
        world.addBody(doorBody);
        
        doorObject = { mesh: doorMesh, body: doorBody };
        debugLog("Door loaded");
    });
    
    // Load Slide
    gltfLoader.load('./Models/Slide-v1.glb', (gltf) => {
        const slideMesh = gltf.scene;
        slideMesh.position.set(15, 0, 20);
        slideMesh.scale.set(1, 1, 1);
        slideMesh.castShadow = true;
        slideMesh.receiveShadow = true;
        
        slideMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(slideMesh);
        
        // Create physics body
        const slideShape = new CANNON.Box(new CANNON.Vec3(2, 3, 4));
        const slideBody = new CANNON.Body({ mass: 0 });
        slideBody.addShape(slideShape);
        slideBody.position.set(15, 3, 20);
        world.addBody(slideBody);
        
        slideObject = { mesh: slideMesh, body: slideBody };
        debugLog("Slide loaded");
    });
    
    // Load Teleport Pad
    gltfLoader.load('./Models/TeleportPad-v1.glb', (gltf) => {
        const teleportPadMesh = gltf.scene;
        teleportPadMesh.position.set(-15, 0, 20);
        teleportPadMesh.scale.set(1, 1, 1);
        teleportPadMesh.castShadow = true;
        teleportPadMesh.receiveShadow = true;
        
        teleportPadMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(teleportPadMesh);
        
        // Create physics body
        const teleportPadShape = new CANNON.Cylinder(2, 2, 0.5, 8);
        const teleportPadBody = new CANNON.Body({ mass: 0 });
        teleportPadBody.addShape(teleportPadShape);
        teleportPadBody.position.set(-15, 0.25, 20);
        world.addBody(teleportPadBody);
        
        teleportPadObject = { mesh: teleportPadMesh, body: teleportPadBody };
        debugLog("Teleport Pad loaded");
    });
    
    // Load School Hall
    gltfLoader.load('./Models/School_Hall.glb', (gltf) => {
        const schoolHallMesh = gltf.scene;
        schoolHallMesh.position.set(0, 0, 40);
        schoolHallMesh.scale.set(1, 1, 1);
        schoolHallMesh.castShadow = true;
        schoolHallMesh.receiveShadow = true;
        
        schoolHallMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(schoolHallMesh);
        
        // Create physics body
        const schoolHallShape = new CANNON.Box(new CANNON.Vec3(8, 4, 6));
        const schoolHallBody = new CANNON.Body({ mass: 0 });
        schoolHallBody.addShape(schoolHallShape);
        schoolHallBody.position.set(0, 4, 40);
        world.addBody(schoolHallBody);
        
        schoolHallObject = { mesh: schoolHallMesh, body: schoolHallBody };
        debugLog("School Hall loaded");
    });
}

// Interaction system
function checkInteractions() {
    if (!character) return;
    
    const characterPosition = character.position;
    const interactionDistance = 5;
    let nearestObject = null;
    let nearestDistance = Infinity;
    
    // Check all interactive objects
    const objects = [
        { obj: infoPanelObject, name: 'Info Panel', image: '/UI elements/Info-Panel UI Card.jpg' },
        { obj: benchObject, name: 'Bench', image: '/UI elements/Bench UI Card.jpg' },
        { obj: treeObject, name: 'Tree', image: '/UI elements/Tree UI Card.jpg' },
        { obj: junglegymObject, name: 'Jungle Gym', image: '/UI elements/Jungle Gym UI Card.jpg' },
        { obj: doorObject, name: 'Door', image: '/UI elements/Door UI Card.jpg' },
        { obj: slideObject, name: 'Slide', image: '/UI elements/Slide UI card.jpg' },
        { obj: teleportPadObject, name: 'Teleport Pad', image: '/UI elements/TeleportPad UI Card.jpg' },
        { obj: schoolHallObject, name: 'School Hall', image: '/UI elements/School Hall UI-1.jpg' }
    ];
    
    objects.forEach(({ obj, name, image }) => {
        if (obj && obj.mesh) {
            const distance = characterPosition.distanceTo(obj.mesh.position);
            if (distance < interactionDistance && distance < nearestDistance) {
                nearestDistance = distance;
                nearestObject = { obj, name, image };
            }
        }
    });
    
    // Show/hide interaction prompt
    if (nearestObject) {
        interactPromptHUD.style.display = 'block';
        
        // Handle interaction
        if (keysPressed.e && !interactionPopupVisible) {
            showInteractionPopup(nearestObject.name, nearestObject.image);
        }
    } else {
        interactPromptHUD.style.display = 'none';
    }
}

function showInteractionPopup(objectName, imagePath) {
    interactionPopupVisible = true;
    interactionPopup.innerHTML = `<img src="${imagePath}" style="width: 100%; height: auto; border-radius: 8px;" alt="${objectName}">`;
    interactionPopup.style.display = 'block';
    
    // Hide interaction prompt while popup is visible
    interactPromptHUD.style.display = 'none';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideInteractionPopup();
    }, 5000);
}

function hideInteractionPopup() {
    interactionPopupVisible = false;
    interactionPopup.style.display = 'none';
}

// Event listeners
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    
    if (key in keysPressed) {
        keysPressed[key] = true;
    }
    
    // Handle special keys
    if (key === ' ') {
        keysPressed.space = true;
        event.preventDefault();
    }
    
    // Controls popup
    if (key === 'r') {
        if (controlsPopup.style.display === 'none') {
            controlsPopup.style.display = 'block';
            controlsPromptHUD.style.display = 'none';
        }
    }
    
    // Mute toggle
    if (key === 't') {
        if (sound) {
            if (sound.isPlaying) {
                sound.pause();
                muteButtonHUD.innerHTML = 'Press T to Unmute';
            } else {
                sound.play();
                muteButtonHUD.innerHTML = 'Press T to Mute';
            }
        }
    }
    
    // Close interaction popup
    if (key === 'escape' && interactionPopupVisible) {
        hideInteractionPopup();
    }
});

document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    
    if (key in keysPressed) {
        keysPressed[key] = false;
    }
    
    if (key === ' ') {
        keysPressed.space = false;
    }
});

// Click to close interaction popup
interactionPopup.addEventListener('click', hideInteractionPopup);

// Window resize handler
function onWindowResize() {
    camera.aspect = parentDiv.clientWidth / parentDiv.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(parentDiv.clientWidth, parentDiv.clientHeight);
    composer.setSize(parentDiv.clientWidth, parentDiv.clientHeight);
}

window.addEventListener('resize', onWindowResize);

// Initialize everything
function init() {
    createTerrain();
    loadCharacter();
    loadInteractiveObjects();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // Update physics
    world.step(1/60, deltaTime, 3);
    
    // Update character
    updateCharacterMovement(deltaTime);
    
    // Update camera
    updateCameraFollow();
    
    // Update speech bubble position
    updateSpeechBubblePosition();
    
    // Check interactions
    checkInteractions();
    
    // Update animations
    if (mixer) {
        mixer.update(deltaTime);
    }
    
    // Update controls
    controls.update();
    
    // Render
    composer.render();
}

// Start the application
init();
animate();