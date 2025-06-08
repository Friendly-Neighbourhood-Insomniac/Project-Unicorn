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
// vibePromptHUD.style.position = 'absolute'; // No longer needed, positioned by flex container
// vibePromptHUD.style.top = '20px';
// vibePromptHUD.style.left = '50%';
// vibePromptHUD.style.transform = 'translateX(-50%)'; // No longer needed
vibePromptHUD.style.padding = '10px 20px';
vibePromptHUD.style.backgroundColor = 'rgba(173, 216, 230, 0.8)'; // Pastel light blue with transparency
vibePromptHUD.style.color = 'white';
vibePromptHUD.style.fontFamily = "'Baloo 2', cursive, sans-serif";
vibePromptHUD.style.fontSize = '18px';
vibePromptHUD.style.borderRadius = '15px'; // Rounded edges
vibePromptHUD.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.5)'; // Subtle text shadow
// vibePromptHUD.style.zIndex = '100'; // zIndex handled by container
vibePromptHUD.innerHTML = 'Press V to Vibe';
vibePromptHUD.style.display = 'none'; // Initially hidden
topPromptsContainer.appendChild(vibePromptHUD); // Append to container
// Create "Press R for Controls" UI element
const controlsPromptHUD = document.createElement('div');
controlsPromptHUD.id = 'controlsPromptHUD';
// controlsPromptHUD.style.position = 'absolute'; // No longer needed
// controlsPromptHUD.style.top = '60px'; 
// controlsPromptHUD.style.left = '50%';
// controlsPromptHUD.style.transform = 'translateX(-50%)'; // No longer needed
controlsPromptHUD.style.padding = '10px 20px';
controlsPromptHUD.style.backgroundColor = 'rgba(173, 216, 230, 0.8)'; // Same style as vibe prompt
controlsPromptHUD.style.color = 'white';
controlsPromptHUD.style.fontFamily = "'Baloo 2', cursive, sans-serif";
controlsPromptHUD.style.fontSize = '18px';
controlsPromptHUD.style.borderRadius = '15px';
controlsPromptHUD.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.5)';
// controlsPromptHUD.style.zIndex = '100'; // zIndex handled by container
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
// The aspectRatio style is removed as explicit width/height are set.
// background-size: contain will handle aspect ratio of the image itself.
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
// Start screen is now shown by default, no need to explicitly show loading screen
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
        // interactPromptHUD will be shown dynamically
        // Game starts, no need to show loading screen again
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
    // HUDs will be shown when startButton is clicked
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
    