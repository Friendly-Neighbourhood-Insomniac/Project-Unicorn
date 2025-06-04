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
// Initialize loading manager
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const gltfLoader = new GLTFLoader(loadingManager);
const dracoLoader = new DRACOLoader(loadingManager);
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
gltfLoader.setDRACOLoader(dracoLoader);
const rgbeLoader = new RGBELoader(loadingManager); // Add RGBELoader instance
// List of UI card image URLs to preload
const uiImageUrls = [
    'https://play.rosebud.ai/assets/Tree UI Card.jpg?9ixH',
    'https://play.rosebud.ai/assets/TeleportPad UI Card.jpg?Ax7P',
    'https://play.rosebud.ai/assets/Slide UI card.jpg?rO7H',
    'https://play.rosebud.ai/assets/Jungle Gym UI Card.jpg?cClv',
    'https://play.rosebud.ai/assets/Info-Panel UI Card.jpg?wGOY',
    'https://play.rosebud.ai/assets/Door UI Card.jpg?FaC4',
    'https://play.rosebud.ai/assets/Bench UI Card.jpg?qmLZ',
    'https://play.rosebud.ai/assets/School Hall UI-1.jpg?ZjdR',
    'https://play.rosebud.ai/assets/School Hall UI-2.jpg?eroy',
    'https://play.rosebud.ai/assets/Controls screen UI.jpg?iyJJ',
    'https://play.rosebud.ai/assets/Start screen.jpg?nD5c' // Also preload the start screen image
];
let assetsLoaded = false;
let typewriterInterval = null; // For managing the typewriter effect
// Optionally, add URL remapping if needed
loadingManager.setURLModifier((url) => {
    if (url.includes('Textures/colormap.png')) {
        return 'https://play.rosebud.ai/assets/3D_playground_character_colormap.png?lWvg';
    }
    return url;
});

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
// Replace with your actual image URL
gameTitleImage.src = 'https://play.rosebud.ai/assets/Start screen.jpg?nD5c';
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
controlsPopup.style.backgroundImage = `url('https://play.rosebud.ai/assets/Controls screen UI.jpg?iyJJ')`;
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
// Create Debug HUD Element
// const debugHUD = document.createElement('div'); // Removed
// debugHUD.id = 'debugHUD'; // Removed
// debugHUD.style.position = 'absolute'; // Removed
// debugHUD.style.top = '10px'; // Position at top-left // Removed
// debugHUD.style.left = '10px'; // Removed
// debugHUD.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Removed
// debugHUD.style.color = 'white'; // Removed
// debugHUD.style.padding = '10px'; // Removed
// debugHUD.style.borderRadius = '5px'; // Removed
// debugHUD.style.fontFamily = "'Baloo 2', cursive, sans-serif"; // Removed
// debugHUD.style.fontSize = '12px'; // Removed
// debugHUD.style.zIndex = '600'; // Higher than speech bubble // Removed
// debugHUD.style.whiteSpace = 'pre-wrap'; // To respect newlines // Removed
// parentDiv.appendChild(debugHUD); // Removed
// The following lines 221-224 were duplicates or redundant and are removed/commented out in the original.
// controlsPopup.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)'; // Redundant
// controlsPopup.style.zIndex = '400'; // Redundant
// controlsPopup.style.display = 'none'; // Redundant
// controlsPopup.style.cursor = 'pointer'; // Redundant
// parentDiv.appendChild(controlsPopup); // Already appended
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
    const totalAssetsToLoad = itemsTotal + uiImageUrls.length; // Adjust total items count
    const progress = (((itemsLoaded + (uiImageUrls.length - (uiImageUrls.filter(u => !textureLoader.load(u)).length))) / totalAssetsToLoad) * 100).toFixed(0);
    if (loadingProgressText) {
        loadingProgressText.innerText = `Loading assets... ${progress}%`;
    }
};
// Preload UI images
uiImageUrls.forEach(url => {
    textureLoader.load(url, () => {
        console.log(`Preloaded UI image: ${url}`);
    }, undefined, (err) => {
        console.error(`Error preloading UI image ${url}:`, err);
    });
});
loadingManager.onLoad = function() {
    assetsLoaded = true;
    if (loadingProgressText) {
        loadingProgressText.style.display = 'none'; // Hide loading progress text
    }
    startButton.disabled = false; // Enable start button
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
const musicURL = 'https://play.rosebud.ai/assets/BackgroundMusic 1.mp3?7pOp'; // You will provide this
audioLoader.load(musicURL, function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5); // Set volume to 50%
    // Do not play immediately, will be started by startButton or if unmuted
    console.log("Ambient music loaded.");
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


const hdriUrl = "https://play.rosebud.ai/assets/skybox1.hdr?9L8X";
rgbeLoader.load(hdriUrl, (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
    console.log("HDRI loaded and applied to scene background and environment.");
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
    const texture = textureLoader.load('https://play.rosebud.ai/assets/grass4.png?c8dJ');
    const normalMap = textureLoader.load('https://play.rosebud.ai/assets/3D_playground_grass_normal.png?wCr9');
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(50, 50); // Increased texture repeat to maintain proper scaling
    texture.encoding = THREE.sRGBEncoding;

    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(20, 20);

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(2, 2),
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
    v: false, // Used to detect 'V' key press event
    e: false, // For interaction
    r: false, // For controls pop-up
    t: false, // For mute toggle
};
let isDancing = false; // State variable to track if dance mode is active
// Character configuration
const characterConfig = {
    // Movement settings
    groundSpeed: 30,
    airSpeed: 25,
    groundDamping: 0.1,
    airDamping: 0.1,
    acceleration: 20,
    turnSpeed: 8,
    jumpForce: 12,
    jumpCooldown: 0.1,
    maxJumps: 1,

    // Physics settings
    radius: 1.5,
    height: 3.5,
    mass: 100,
    friction: 0.1,
    restitution: 0.0,
    linearDamping: 0.02,
    angularDamping: 0.9,
    // Visual and animation settings
    scale: 10.8, // Decreased by 10% from 12 (12 * 0.9 = 10.8)
    startHeight: 2,
};

// Define physics materials for character
const characterPhysMaterial = new CANNON.Material('character');

// Create contact material between character and ground
const characterGroundContact = new CANNON.ContactMaterial(
    characterPhysMaterial,
    groundPhysMaterial, {
        friction: 0.01,
        restitution: 0.0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
    }
);
world.addContactMaterial(characterGroundContact);


// Add keyboard event listeners
window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (event.code === 'Space') {
        keysPressed.space = true;
        isDancing = false; // Stop dancing if jumping
    } else if (key === 'v') {
        isDancing = !isDancing; // Toggle dancing state
        keysPressed.v = true; // Still track key down for immediate animation change
    } else if (key === 'e') {
        keysPressed.e = true;
    } else if (key === 'r') {
        keysPressed.r = true;
        if (controlsPopup) {
            const isVisible = controlsPopup.style.display === 'block';
            controlsPopup.style.display = isVisible ? 'none' : 'block';
            if (controlsPromptHUD) { // Hide prompt when popup is open, show when closed
                controlsPromptHUD.style.display = isVisible ? 'flex' : 'none';
            }
        }
    } else if (key === 't') {
        keysPressed.t = true;
        if (sound) {
            if (sound.isPlaying) {
                sound.pause();
                muteButtonHUD.innerHTML = 'Press T to Unmute';
            } else {
                sound.play();
                muteButtonHUD.innerHTML = 'Press T to Mute';
            }
        }
    } else if (keysPressed.hasOwnProperty(key)) {
        keysPressed[key] = true;
        if (['w', 'a', 's', 'd'].includes(key)) {
            isDancing = false; // Stop dancing if moving
        }
    }
});
window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (event.code === 'Space') {
        keysPressed.space = false;
    } else if (key === 'v') {
        keysPressed.v = false; // Reset key press state, isDancing controls the loop
    } else if (key === 'e') {
        keysPressed.e = false;
    } else if (key === 'r') {
        keysPressed.r = false; // We handle toggle on keydown, just reset state here
    } else if (key === 't') {
        keysPressed.t = false; // Reset key press state
    } else if (keysPressed.hasOwnProperty(key)) {
        keysPressed[key] = false;
    }
});
// Load the character model
const characterUrl = 'https://play.rosebud.ai/assets/idle-v1.glb?P2wb'; // Using idle-v1.glb
gltfLoader.load(characterUrl, (gltf) => { // DRACOLoader is implicitly used by gltfLoader if set for DRACO compressed models
    const model = gltf.scene;
    model.scale.set(
        characterConfig.scale,
        characterConfig.scale,
        characterConfig.scale
    );
    // model.rotation.y = Math.PI / 2; // Previous attempt, now targeting a child mesh.
    model.position.set(0, 0, 0);
    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.envMapIntensity = 1.0;
            // Apply rotation to the first found mesh.
            // This assumes the main visual representation is the first mesh encountered.
            if (!child.userData.rotationApplied) { // Apply only once
                child.rotation.y = 0; // Assuming model's natural front is +X when local rotation is 0
                child.userData.rotationApplied = true;
                console.log("Applied rotation to child mesh:", child.name, "with rotation", child.rotation.y);
            }
        }
    });
    characterBody = new CANNON.Body({
        mass: characterConfig.mass,
        material: characterPhysMaterial,
        linearDamping: characterConfig.linearDamping,
        angularDamping: characterConfig.angularDamping,
        fixedRotation: true,
        type: CANNON.Body.DYNAMIC,
    });
    const characterShape = new CANNON.Cylinder(
        characterConfig.radius,
        characterConfig.radius,
        characterConfig.height,
        8
    );
    const shapeOffset = new CANNON.Vec3(0, characterConfig.height / 2, 0);
    characterBody.addShape(characterShape, shapeOffset);
    characterBody.position.set(126, characterConfig.startHeight, 112);
    world.addBody(characterBody);
    isGrounded = false;
    let groundContactCount = 0;
    characterBody.addEventListener('collide', (event) => {
        const contact = event.contact;
        let otherBody;
        if (event.contact.bi === characterBody) {
            otherBody = event.contact.bj;
            contact.ni.negate(contactNormal);
        } else {
            otherBody = event.contact.bi;
            contactNormal.copy(contact.ni);
        }
        let otherObjectName = "Unknown Object";
        if (world.bodies.find(b => b === otherBody && b.shapes[0] instanceof CANNON.Plane && b.material === groundPhysMaterial)) { // Check if it's the ground plane
            otherObjectName = "Ground Plane";
        } else if (infoPanelObject && otherBody === infoPanelObject.body) {
            otherObjectName = infoPanelObject.name;
        } else if (benchObject && otherBody === benchObject.body) {
            otherObjectName = benchObject.name;
        } else if (treeObject && otherBody === treeObject.body) {
            otherObjectName = treeObject.name;
        } else if (junglegymObject && otherBody === junglegymObject.body) {
            otherObjectName = junglegymObject.name;
        } else if (doorObject && otherBody === doorObject.body) {
            otherObjectName = doorObject.name;
        } else if (slideObject && otherBody === slideObject.body) {
            otherObjectName = slideObject.name;
        } else if (teleportPadObject && otherBody === teleportPadObject.body) {
            otherObjectName = teleportPadObject.name;
        }
        // You could add more else if blocks for other named objects like walls, school hall, etc.
        console.log(`Character collided with body ID: ${otherBody.id}, Name: ${otherObjectName}, Material: ${otherBody.material ? otherBody.material.name : 'N/A'}. ContactNormal.y: ${contactNormal.y.toFixed(2)}`);
        // Extended debugging: Log details of all bodies if collision is with an 'Unknown Object' or specifically Tree (if it ever gets logged)
        if (otherObjectName === "Unknown Object" || (treeObject && otherBody === treeObject.body)) {
            console.log("Extended collision debug - World bodies state:");
            world.bodies.forEach(b => {
                let name = "N/A";
                if (infoPanelObject && b === infoPanelObject.body) name = infoPanelObject.name;
                else if (benchObject && b === benchObject.body) name = benchObject.name;
                else if (treeObject && b === treeObject.body) name = treeObject.name;
                else if (junglegymObject && b === junglegymObject.body) name = junglegymObject.name;
                else if (doorObject && b === doorObject.body) name = doorObject.name;
                else if (slideObject && b === slideObject.body) name = slideObject.name;
                else if (teleportPadObject && b === teleportPadObject.body) name = teleportPadObject.name;
                else if (characterBody && b === characterBody) name = "Character";
                else if (b.shapes[0] instanceof CANNON.Plane) name = "Ground Plane";
                console.log(`  Body ID: ${b.id}, Name: ${name}, Mass: ${b.mass}, Material: ${b.material ? b.material.name : 'None'}, Type: ${b.type === CANNON.Body.STATIC ? 'Static' : b.type === CANNON.Body.DYNAMIC ? 'Dynamic' : 'Kinematic'}, Pos: (${b.position.x.toFixed(1)}, ${b.position.y.toFixed(1)}, ${b.position.z.toFixed(1)})`);
                b.shapes.forEach((s, index) => {
                    console.log(`    Shape ${index}: Type: ${s.constructor.name}, Radius: ${s.radius ? s.radius.toFixed(2) : 'N/A'}, Height: ${s.height ? s.height.toFixed(2) : 'N/A'}`);
                });
            });
        }
        if (contactNormal.dot(upAxis) > 0.5) {
            groundContactCount++;
            isGrounded = true;
            currentJumps = 0;
            // Stop fall/jump animations immediately on ground contact
            if (currentAnimationState === AnimationState.FALLING && fallAction) {
                fallAction.stop();
                fallAction.setEffectiveWeight(0);
            }
            if (currentAnimationState === AnimationState.JUMPING && jumpAction) {
                jumpAction.stop();
                jumpAction.setEffectiveWeight(0);
            }
        }
    });
    characterBody.addEventListener('endContact', (event) => {
        let otherBody;
        if (event.contact.bi === characterBody) {
            otherBody = event.contact.bj;
            event.contact.ni.negate(contactNormal);
        } else {
            otherBody = event.contact.bi;
            contactNormal.copy(event.contact.ni);
        }
        if (contactNormal.dot(upAxis) > 0.5) {
            groundContactCount = Math.max(0, groundContactCount - 1);
            if (groundContactCount === 0) {
                isGrounded = false;
            }
        }
    });
    mixer = new THREE.AnimationMixer(model);
    const animations = gltf.animations;
    // Animation names HUD removed, debug logging will handle this info if needed elsewhere.
    // Load Idle Animation from idle-v1.glb
    if (animations && animations.length > 0) {
        // Assuming the desired idle animation is the first one or named appropriately
        const idleClipNames = ['idle', 'stand', 'default', 'base_idle', 'tpose_action', 'Armature|mixamo.com|Layer0']; // Common idle animation names
        let mainIdleClip = animations.find(clip => idleClipNames.some(name => clip.name.toLowerCase().includes(name.toLowerCase())));
        if (!mainIdleClip && animations.length > 0) mainIdleClip = animations[0]; // Fallback to the first animation
        if (mainIdleClip) {
            idleAction = mixer.clipAction(mainIdleClip);
            idleAction.setLoop(THREE.LoopRepeat);
            idleAction.setEffectiveWeight(1);
            idleAction.play();
            console.log("Playing Idle animation from idle-v1.glb:", mainIdleClip.name);
            currentAnimationState = AnimationState.IDLE;
        } else {
            console.warn("No suitable Idle animation found in idle-v1.glb.");
        }
    } else {
        console.warn("No animations found in idle-v1.glb.");
    }
    // Load Skip Animation from skip2.glb
    const skipUrl = 'https://play.rosebud.ai/assets/skip2.glb?Nbqn';
    gltfLoader.load(skipUrl, (skipGltf) => { // DRACOLoader is implicitly used
        if (skipGltf.animations && skipGltf.animations.length > 0 && mixer) {
            const clip = skipGltf.animations.find(c => c.name.toLowerCase().includes('skip')) || skipGltf.animations[0];
            if (clip) {
                skipAction = mixer.clipAction(clip);
                skipAction.setLoop(THREE.LoopRepeat);
                skipAction.setEffectiveWeight(0); // Initially not playing
                console.log("Loaded Skip animation from skip2.glb:", clip.name);
                // Animation names HUD removed
            } else {
                console.warn("No suitable Skip animation found in skip2.glb.");
            }
        } else {
            console.warn("No animation found in skip2.glb or mixer not initialized.");
        }
    }, undefined, (error) => {
        console.error('Error loading skip2.glb animation:', error);
    });
    // Load Dance Animation from dance2.glb
    const danceUrl = 'https://play.rosebud.ai/assets/dance2.glb?xqGw';
    gltfLoader.load(danceUrl, (danceGltf) => { // DRACOLoader is implicitly used
        if (danceGltf.animations && danceGltf.animations.length > 0 && mixer) {
            const clip = danceGltf.animations.find(c => c.name.toLowerCase().includes('dance')) || danceGltf.animations[0];
            if (clip) {
                danceAction = mixer.clipAction(clip);
                danceAction.setLoop(THREE.LoopRepeat);
                danceAction.setEffectiveWeight(0); // Initially not playing
                console.log("Loaded Dance animation from dance2.glb:", clip.name);
                // Animation names HUD removed
            } else {
                console.warn("No suitable Dance animation found in dance2.glb.");
            }
        } else {
            console.warn("No animation found in dance2.glb or mixer not initialized.");
        }
    }, undefined, (error) => {
        console.error('Error loading dance2.glb animation:', error);
    });
    // Jump and Fall actions are intentionally left null as they are not separate GLBs.
    // If you had jump.glb or fall.glb, you would load them similarly.
    jumpAction = null;
    fallAction = null;
    character = model;
    scene.add(model);
});

// Update character movement
function updateCharacterMovement(deltaTime) {
    if (!character || !characterBody) return;
    const actionsToFadeOut = {
        [AnimationState.IDLE]: idleAction,
        [AnimationState.MOVING]: skipAction,
        [AnimationState.JUMPING]: jumpAction,
        [AnimationState.FALLING]: fallAction,
        [AnimationState.DANCE]: danceAction,
    };
    const actionsToFadeIn = {
        [AnimationState.IDLE]: idleAction,
        [AnimationState.MOVING]: skipAction,
        [AnimationState.JUMPING]: jumpAction,
        [AnimationState.FALLING]: fallAction,
        [AnimationState.DANCE]: danceAction,
    };
    // Get camera's forward and right vectors
    const cameraForward = new THREE.Vector3();
    const cameraRight = new THREE.Vector3();
    camera.getWorldDirection(cameraForward);
    cameraForward.y = 0;
    cameraForward.normalize();
    cameraRight.crossVectors(new THREE.Vector3(0, 1, 0), cameraForward).normalize();
    // Calculate move direction relative to camera
    moveDirection.set(0, 0, 0);
    // Add movement input
    if (keysPressed.w) moveDirection.add(cameraForward);
    if (keysPressed.s) moveDirection.sub(cameraForward);
    if (keysPressed.a) moveDirection.add(cameraRight);
    if (keysPressed.d) moveDirection.sub(cameraRight);
    // Normalize movement direction if it exists
    if (moveDirection.length() > 0) {
        moveDirection.normalize();
    }
    // Get current horizontal velocity
    const currentVelocity = new THREE.Vector2(characterBody.velocity.x, characterBody.velocity.z);
    // Different handling for ground vs air movement
    if (isGrounded) {
        // Ground movement
        if (moveDirection.length() > 0) {
            // Calculate target velocity
            const targetVelocity = new THREE.Vector2(
                moveDirection.x * characterConfig.groundSpeed,
                moveDirection.z * characterConfig.groundSpeed
            );
            // Interpolate current velocity towards target
            currentVelocity.lerp(targetVelocity, characterConfig.acceleration * deltaTime);
            // Update character rotation
            let targetAngle = Math.atan2(moveDirection.x, moveDirection.z);
            targetAngle -= Math.PI / 2; // Adjust for model's front being -X (90 deg clockwise from +Z)
            // character.rotation.y = targetAngle; // This is now handled by copying quaternion in animate()
            characterBody.quaternion.setFromEuler(0, targetAngle, 0); // Update physics body with targetAngle
        } else {
            // Apply ground damping when no input
            currentVelocity.multiplyScalar(1 - characterConfig.groundDamping * deltaTime);
        }
    } else {
        // Air movement
        if (moveDirection.length() > 0) {
            const airVelocity = new THREE.Vector2(
                moveDirection.x * characterConfig.airSpeed * deltaTime,
                moveDirection.z * characterConfig.airSpeed * deltaTime
            );
            currentVelocity.add(airVelocity);
            // Clamp air speed
            const maxAirSpeed = characterConfig.airSpeed;
            if (currentVelocity.length() > maxAirSpeed) {
                currentVelocity.normalize().multiplyScalar(maxAirSpeed);
            }
        } else {
            // Apply air damping when no input
            currentVelocity.multiplyScalar(1 - characterConfig.airDamping * deltaTime);
        }
    }
    // Apply calculated velocity
    characterBody.velocity.x = currentVelocity.x;
    characterBody.velocity.z = currentVelocity.y;
    // Handle jumping
    if (keysPressed.space && isGrounded && currentJumps < characterConfig.maxJumps) {
        const now = performance.now();
        if (now - lastJumpTime > characterConfig.jumpCooldown * 1000) {
            characterBody.velocity.y = characterConfig.jumpForce;
            currentJumps++;
            lastJumpTime = now;
            isGrounded = false;
            if (jumpAction) {
                jumpAction.reset();
                jumpAction.setEffectiveWeight(1);
                jumpAction.play();
            }
        }
    }
    // Update animations using a simplified state manager
    if (mixer && characterBody) {
        const verticalVelocity = characterBody.velocity.y;
        const horizontalSpeed = new THREE.Vector2(characterBody.velocity.x, characterBody.velocity.z).length();
        let desiredAnimationState = AnimationState.IDLE;
        if (isDancing && danceAction) {
            desiredAnimationState = AnimationState.DANCE;
        } else if (!isGrounded) {
            // Prioritize jump/fall animations if they exist and are relevant
            if (verticalVelocity > 0.5 && jumpAction) {
                desiredAnimationState = AnimationState.JUMPING;
            } else if (verticalVelocity < -0.5 && fallAction) {
                desiredAnimationState = AnimationState.FALLING;
            } else if (idleAction) { // Fallback to idle if in air but no specific jump/fall action
                desiredAnimationState = AnimationState.IDLE;
            }
        } else if (keysPressed.w || keysPressed.a || keysPressed.s || keysPressed.d) {
            if (horizontalSpeed > 0.1 && skipAction) {
                desiredAnimationState = AnimationState.MOVING;
            } else if (idleAction) { // Moving keys pressed but speed is low
                desiredAnimationState = AnimationState.IDLE;
            }
        } else { // No movement keys, not dancing, and grounded
            if (idleAction) {
                desiredAnimationState = AnimationState.IDLE;
            }
        }

        // Specific override for jump if space is pressed, character is grounded, and jumpAction exists
        // This ensures jump animation plays immediately on jump input.
        if (keysPressed.space && isGrounded && jumpAction) {
            desiredAnimationState = AnimationState.JUMPING;
        }
        if (desiredAnimationState !== currentAnimationState ||
            (desiredAnimationState === AnimationState.JUMPING && jumpAction && !jumpAction.isRunning())) {

            const previousAction = actionsToFadeOut[currentAnimationState];
            const newAction = actionsToFadeIn[desiredAnimationState];
            if (previousAction && previousAction !== newAction) {
                previousAction.fadeOut(0.2);
            }
            if (newAction) {
                let loopMode = THREE.LoopRepeat;
                if (desiredAnimationState === AnimationState.JUMPING) {
                    loopMode = THREE.LoopOnce;
                }
                newAction.reset();
                newAction.setLoop(loopMode);
                if (loopMode === THREE.LoopOnce) {
                    newAction.clampWhenFinished = true;
                }
                newAction.setEffectiveWeight(1);
                newAction.fadeIn(0.2);
                newAction.play();
            }
            currentAnimationState = desiredAnimationState;
        }
    }
    // Update animation mixer
    if (mixer) {
        mixer.update(deltaTime);
    }
    // Interaction prompt and logic
    const generalInteractionDistance = 40; // Default for most objects
    const slideInteractionDistance = 50; // Specific for Slide
    const treeInteractionDistance = 30;
    const fixedTreePosition = new THREE.Vector3(195, 0, -195);
    let showTreePrompt = false;
    let showOtherPromptFor = null;
    if (characterBody && treeObject) { // Ensure character and Tree object exist for Tree checks
        const distanceToFixedTreePos = characterBody.position.distanceTo(fixedTreePosition);
        if (distanceToFixedTreePos < treeInteractionDistance) {
            showTreePrompt = true;
        }
        // Close Tree popup if player moves away
        if (interactionPopupVisible &&
            interactionPopup.innerHTML.includes(treeObject.name) &&
            distanceToFixedTreePos >= treeInteractionDistance) {
            interactionPopup.style.display = 'none';
            interactionPopupVisible = false;
        }
    }
    if (characterBody && !showTreePrompt) { // Only check other interactables if not in range of Tree for prompt
        const otherInteractables = [infoPanelObject, benchObject, junglegymObject, doorObject, slideObject, teleportPadObject, schoolHallObject].filter(obj => obj && obj.mesh && obj.body);
        let closestOtherInteractable = null;
        let minDistanceToOther = Infinity;
        otherInteractables.forEach(obj => {
            let interactionDistance = generalInteractionDistance;
            if (obj.name === 'Slide') interactionDistance = slideInteractionDistance;
            else if (obj.name === 'School Hall') interactionDistance = 76;
            else if (obj.name === 'Jungle Gym') interactionDistance = 68;
            const distance = characterBody.position.distanceTo(obj.body.position);
            if (distance < interactionDistance && distance < minDistanceToOther) {
                minDistanceToOther = distance;
                closestOtherInteractable = obj;
            }
        });
        if (closestOtherInteractable) {
            showOtherPromptFor = closestOtherInteractable;
        }
        // Close other object's popup if player moves away
        if (interactionPopupVisible && showOtherPromptFor &&
            interactionPopup.innerHTML.includes(showOtherPromptFor.name)) {
            let interactionRangeForCurrentPopup = generalInteractionDistance;
            if (showOtherPromptFor.name === 'Slide') interactionRangeForCurrentPopup = slideInteractionDistance;
            else if (showOtherPromptFor.name === 'School Hall') interactionRangeForCurrentPopup = 76;
            else if (showOtherPromptFor.name === 'Jungle Gym') interactionRangeForCurrentPopup = 68;
            const distanceToCurrentPopupObject = characterBody.position.distanceTo(showOtherPromptFor.body.position);
            if (distanceToCurrentPopupObject >= interactionRangeForCurrentPopup) {
                interactionPopup.style.display = 'none';
                interactionPopupVisible = false;
            }
        } else if (interactionPopupVisible && infoPanelObject && interactionPopup.innerHTML.includes(infoPanelObject.name) && (!showOtherPromptFor || showOtherPromptFor.name !== infoPanelObject.name)) {
            const distanceToInfoPanel = infoPanelObject.body ? characterBody.position.distanceTo(infoPanelObject.body.position) : Infinity;
            if (distanceToInfoPanel >= generalInteractionDistance) {
                interactionPopup.style.display = 'none';
                interactionPopupVisible = false;
            }
        } else if (interactionPopupVisible && benchObject && interactionPopup.innerHTML.includes(benchObject.name) && (!showOtherPromptFor || showOtherPromptFor.name !== benchObject.name)) {
            const distanceToBench = benchObject.body ? characterBody.position.distanceTo(benchObject.body.position) : Infinity;
            if (distanceToBench >= generalInteractionDistance) {
                interactionPopup.style.display = 'none';
                interactionPopupVisible = false;
            }
        } else if (interactionPopupVisible && junglegymObject && interactionPopup.innerHTML.includes(junglegymObject.name) && (!showOtherPromptFor || showOtherPromptFor.name !== junglegymObject.name)) {
            const distanceToJungleGym = junglegymObject.body ? characterBody.position.distanceTo(junglegymObject.body.position) : Infinity;
            if (distanceToJungleGym >= 68) {
                interactionPopup.style.display = 'none';
                interactionPopupVisible = false;
            }
        } else if (interactionPopupVisible && doorObject && interactionPopup.innerHTML.includes(doorObject.name) && (!showOtherPromptFor || showOtherPromptFor.name !== doorObject.name)) {
            const distanceToDoor = doorObject.body ? characterBody.position.distanceTo(doorObject.body.position) : Infinity;
            if (distanceToDoor >= generalInteractionDistance) {
                interactionPopup.style.display = 'none';
                interactionPopupVisible = false;
            }
        } else if (interactionPopupVisible && slideObject && interactionPopup.innerHTML.includes(slideObject.name) && (!showOtherPromptFor || showOtherPromptFor.name !== slideObject.name)) {
            const distanceToSlide = slideObject.body ? characterBody.position.distanceTo(slideObject.body.position) : Infinity;
            if (distanceToSlide >= slideInteractionDistance) { // Use specific slide interaction distance here
                interactionPopup.style.display = 'none';
                interactionPopupVisible = false;
            }
        } else if (interactionPopupVisible && teleportPadObject && interactionPopup.innerHTML.includes(teleportPadObject.name) && (!showOtherPromptFor || showOtherPromptFor.name !== teleportPadObject.name)) {
            const distanceToTeleportPad = teleportPadObject.body ? characterBody.position.distanceTo(teleportPadObject.body.position) : Infinity;
            if (distanceToTeleportPad >= generalInteractionDistance) {
                interactionPopup.style.display = 'none';
                interactionPopupVisible = false;
            }
        } else if (interactionPopupVisible && schoolHallObject && interactionPopup.innerHTML.includes(schoolHallObject.name) && (!showOtherPromptFor || showOtherPromptFor.name !== schoolHallObject.name)) {
            const distanceToSchoolHall = schoolHallObject.body ? characterBody.position.distanceTo(schoolHallObject.body.position) : Infinity;
            if (distanceToSchoolHall >= 76) {
                interactionPopup.style.display = 'none';
                interactionPopupVisible = false;
            }
        }
    }
    // --- "Press E" Prompt Display Logic ---
    if (showTreePrompt && !interactionPopupVisible && treeObject) {
        interactPromptHUD.innerHTML = `Press E to Interact with ${treeObject.name}`;
        interactPromptHUD.style.display = 'block';
    } else if (showOtherPromptFor && !interactionPopupVisible) {
        interactPromptHUD.innerHTML = `Press E to Interact with ${showOtherPromptFor.name}`;
        interactPromptHUD.style.display = 'block';
    } else { // No prompt to show, or popup is visible
        interactPromptHUD.style.display = 'none';
    }
    // --- "E" Key Press Handling ---
    if (keysPressed.e && characterBody) {
        if (interactionPopupVisible) {
            interactionPopup.style.display = 'none';
            interactionPopupVisible = false;
            // Re-evaluate prompt display after closing popup
            if (showTreePrompt && treeObject) {
                interactPromptHUD.innerHTML = `Press E to Interact with ${treeObject.name}`;
                interactPromptHUD.style.display = 'block';
            } else if (showOtherPromptFor) {
                interactPromptHUD.innerHTML = `Press E to Interact with ${showOtherPromptFor.name}`;
                interactPromptHUD.style.display = 'block';
            }
        } else if (showTreePrompt && treeObject) {
            let popupMessage = `Interacting with: ${treeObject.name}`; // Default for Tree
            if (treeObject && treeObject.name && treeObject.name.includes('Tree')) {
                popupMessage = `<img src='https://play.rosebud.ai/assets/Tree UI Card.jpg?9ixH' alt='Tree Info' style='width: 100%; height: auto; display: block; border-radius: 8px;'>`;
                interactionPopup.style.padding = '0px';
                interactionPopup.style.width = 'clamp(300px, 50vw, 400px)';
                interactionPopup.style.height = 'auto';
            }
            interactionPopup.innerHTML = popupMessage;
            interactionPopup.style.display = 'block';
            interactionPopupVisible = true;
            interactPromptHUD.style.display = 'none';
        } else if (showOtherPromptFor) {
            let popupMessage = `Interacting with: ${showOtherPromptFor.name}`; // Default message
            if (showOtherPromptFor.name.includes('Teleport Pad')) {
                popupMessage = `<img src='https://play.rosebud.ai/assets/TeleportPad UI Card.jpg?Ax7P' alt='Teleport Pad Info' style='width: 100%; height: auto; display: block; border-radius: 8px;'>`;
                interactionPopup.style.padding = '0px'; // Reset padding for image
                interactionPopup.style.width = 'clamp(300px, 50vw, 600px)'; // Responsive width for the image popup
                interactionPopup.style.height = 'auto'; // Height adjusts to image
            } else if (showOtherPromptFor.name.includes('Slide')) {
                popupMessage = `<img src='https://play.rosebud.ai/assets/Slide UI card.jpg?rO7H' alt='Slide Info' style='width: 100%; height: auto; display: block; border-radius: 8px;'>`;
                interactionPopup.style.padding = '0px'; // Reset padding for image
                interactionPopup.style.width = 'clamp(300px, 50vw, 600px)'; // Responsive width
                interactionPopup.style.height = 'auto'; // Height adjusts
            } else if (showOtherPromptFor.name.includes('Jungle Gym')) {
                popupMessage = `<img src='https://play.rosebud.ai/assets/Jungle Gym UI Card.jpg?cClv' alt='Jungle Gym Info' style='width: 100%; height: auto; display: block; border-radius: 8px;'>`;
                interactionPopup.style.padding = '0px';
                interactionPopup.style.width = 'clamp(300px, 50vw, 600px)';
                interactionPopup.style.height = 'auto';
            } else if (showOtherPromptFor.name.includes('Door')) {
                popupMessage = `<img src='https://play.rosebud.ai/assets/Door UI Card.jpg?FaC4' alt='Door Info' style='width: 100%; height: auto; display: block; border-radius: 8px;'>`;
                interactionPopup.style.padding = '0px';
                interactionPopup.style.width = 'clamp(300px, 50vw, 600px)';
                interactionPopup.style.height = 'auto';
            } else if (showOtherPromptFor.name.includes('Info-Panel')) {
                popupMessage = `<img src='https://play.rosebud.ai/assets/Info-Panel UI Card.jpg?wGOY' alt='Info Panel Info' style='width: 100%; height: auto; display: block; border-radius: 8px;'>`;
                interactionPopup.style.padding = '0px';
                interactionPopup.style.width = 'clamp(300px, 50vw, 600px)';
                interactionPopup.style.height = 'auto';
            } else if (showOtherPromptFor.name.includes('Bench')) {
                popupMessage = `<img src='https://play.rosebud.ai/assets/Bench UI Card.jpg?qmLZ' alt='Bench Info' style='width: 100%; height: auto; display: block; border-radius: 8px;'>`;
                interactionPopup.style.padding = '0px';
                interactionPopup.style.width = 'clamp(300px, 50vw, 400px)';
                interactionPopup.style.height = 'auto';
            } else if (showOtherPromptFor.name.includes('School Hall')) {
                // Setup for School Hall multi-page popup
                setupSchoolHallPopup(); // Call a new function to handle this
                // The rest of the display logic will be in setupSchoolHallPopup
                // interactionPopup.style.display = 'block'; // This will be handled by setupSchoolHallPopup
                // interactionPopupVisible = true; // This will be handled by setupSchoolHallPopup
                // interactPromptHUD.style.display = 'none'; // This will be handled by setupSchoolHallPopup
                // The popupMessage variable is not directly used here anymore for School Hall
            } else {
                // Default handling for other objects if any new one is added without specific UI card
                interactionPopup.innerHTML = popupMessage;
                interactionPopup.style.padding = '20px';
                interactionPopup.style.width = 'clamp(300px, 50vw, 400px)';
                interactionPopup.style.height = 'auto';
            }

            // Common display logic for all popups (except School Hall which now has its own setup)
            if (!showOtherPromptFor.name.includes('School Hall')) {
                interactionPopup.innerHTML = popupMessage;
                interactionPopup.style.display = 'block';
                interactionPopupVisible = true;
                interactPromptHUD.style.display = 'none';
            }
        }
        keysPressed.e = false;
    }
    if (!characterBody) { // No characterBody, hide all prompts/popups
        if (interactPromptHUD.style.display === 'block') interactPromptHUD.style.display = 'none';
        if (interactionPopup.style.display === 'block') {
            interactionPopup.style.display = 'none';
            interactionPopupVisible = false;
        }
    }
}
// School Hall Popup State
let schoolHallCurrentPage = 0;
const schoolHallPages = [{
    title: "Page 1",
    content: "<img src='https://play.rosebud.ai/assets/School Hall UI-1.jpg?ZjdR' alt='School Hall Info Page 1' style='width: 100%; height: auto; display: block; border-radius: 8px;'>"
}, {
    title: "Page 2",
    content: "<img src='https://play.rosebud.ai/assets/School Hall UI-2.jpg?eroy' alt='School Hall Info Page 2' style='width: 100%; height: auto; display: block; border-radius: 8px;'>"
}];

function updateSchoolHallPopupContent() {
    const pageData = schoolHallPages[schoolHallCurrentPage];
    const contentDiv = document.getElementById('schoolHallPopupContent');
    if (contentDiv) {
        contentDiv.innerHTML = pageData.content;
    }
    const prevButton = document.getElementById('schoolHallPrevButton');
    const nextButton = document.getElementById('schoolHallNextButton');
    if (prevButton) prevButton.disabled = schoolHallCurrentPage === 0;
    if (nextButton) nextButton.disabled = schoolHallCurrentPage === schoolHallPages.length - 1;
}

function setupSchoolHallPopup() {
    schoolHallCurrentPage = 0; // Reset to first page
    interactionPopup.innerHTML = `
        <div id="schoolHallPopupContent" style="margin-bottom: 10px; min-height: 150px; display: block; /* Changed to block for image display */ align-items: center; justify-content: center;">
            <!-- Content will be injected here by updateSchoolHallPopupContent -->
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px; border-top: 1px solid #c40277;">
            <button id="schoolHallPrevButton" style="padding: 8px 15px; font-size: 16px; background-color: #555; color: white; border: none; border-radius: 5px; cursor: pointer;">Previous</button>
            <button id="schoolHallNextButton" style="padding: 8px 15px; font-size: 16px; background-color: #555; color: white; border: none; border-radius: 5px; cursor: pointer;">Next</button>
        </div>
    `;
    updateSchoolHallPopupContent(); // Initial content load
    document.getElementById('schoolHallPrevButton').addEventListener('click', () => {
        if (schoolHallCurrentPage > 0) {
            schoolHallCurrentPage--;
            updateSchoolHallPopupContent();
        }
    });
    document.getElementById('schoolHallNextButton').addEventListener('click', () => {
        if (schoolHallCurrentPage < schoolHallPages.length - 1) {
            schoolHallCurrentPage++;
            updateSchoolHallPopupContent();
        }
    });
    interactionPopup.style.padding = '0px'; // Override general padding for this specific popup
    interactionPopup.style.width = 'clamp(300px, 50vw, 400px)';
    interactionPopup.style.height = 'auto';
    interactionPopup.style.display = 'block';
    interactionPopupVisible = true;
    interactPromptHUD.style.display = 'none';
}
// Update camera to follow the character
function updateCamera(deltaTime) {
    if (!character) return;
    const characterPos = character.position.clone();
    const characterTargetY = characterPos.y + characterConfig.height / 1.5; // Look slightly above feet
    controls.enabled = true;
    // Standard follow camera logic
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    let targetPosition = characterPos.clone().add(new THREE.Vector3(0, characterConfig.height / 2, 0));
    const cameraToCharacter = new THREE.Vector3();
    cameraToCharacter.subVectors(camera.position, characterPos);
    cameraToCharacter.y = 0;
    const currentDistance = cameraToCharacter.length();
    const movementTowardCamera = moveDirection.dot(cameraToCharacter.normalize()) < 0;
    if (movementTowardCamera && currentDistance < cameraSettings.minFollowDistance) {
        const idealOffset = cameraToCharacter.normalize().multiplyScalar(cameraSettings.minFollowDistance);
        idealOffset.y = camera.position.y - characterPos.y;
        const newCameraPos = characterPos.clone().add(idealOffset);
        camera.position.lerp(newCameraPos, cameraSettings.smoothSpeed * 2);
    }
    controls.target.lerp(targetPosition, cameraSettings.smoothSpeed);
    controls.update();
    // If controls are enabled, update them. Otherwise, they are handled by transitions.
    if (controls.enabled) {
        controls.update(deltaTime);
    }
}
// =========================
// End of Character Integration
// =========================

// Animal creation function
function createBunny(x, z) {
    // Create bunny body (scaled up by 100%)
    const scaleFactor = 2; // Double the size
    const bodyGeometry = new THREE.SphereGeometry(1 * scaleFactor, 16, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.8,
        metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    // Create bunny head
    const headGeometry = new THREE.SphereGeometry(0.6 * scaleFactor, 16, 16);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.8 * scaleFactor, 0.4 * scaleFactor);
    head.castShadow = true;
    // Create ears
    const earGeometry = new THREE.ConeGeometry(0.2 * scaleFactor, 1 * scaleFactor, 8);
    const ear1 = new THREE.Mesh(earGeometry, bodyMaterial);
    const ear2 = new THREE.Mesh(earGeometry, bodyMaterial);
    ear1.position.set(0.25 * scaleFactor, 1.5 * scaleFactor, 0.4 * scaleFactor);
    ear2.position.set(-0.25 * scaleFactor, 1.5 * scaleFactor, 0.4 * scaleFactor);
    ear1.castShadow = true;
    ear2.castShadow = true;
    // Create bunny group
    const bunnyGroup = new THREE.Group();
    bunnyGroup.add(body);
    bunnyGroup.add(head);
    bunnyGroup.add(ear1);
    bunnyGroup.add(ear2);
    bunnyGroup.position.set(x, 1 * scaleFactor, z); // Adjusted initial Y position
    // Add physics body
    const bunnyShape = new CANNON.Sphere(1 * scaleFactor); // Scaled radius
    const bunnyBody = new CANNON.Body({
        mass: 5 * Math.pow(scaleFactor, 3), // Mass scales with volume
        material: groundPhysMaterial,
        fixedRotation: true,
        linearDamping: 0.5
    });
    bunnyBody.addShape(bunnyShape);
    bunnyBody.position.set(x, 1 * scaleFactor, z); // Adjusted initial Y position
    // Add custom properties for hopping behavior
    bunnyBody.userData = {
        hopCooldown: 0,
        hopForce: 10,
        hopInterval: 2 + Math.random(),
        moveDirection: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize()
    };
    world.addBody(bunnyBody);
    return {
        mesh: bunnyGroup,
        body: bunnyBody
    };
}
// Function to distribute bunnies
function createBunnies() {
    const bunnies = [];
    const numBunnies = 50; // Increased number of bunnies
    const mapSize = 450;
    for (let i = 0; i < numBunnies; i++) {
        const x = Math.random() * mapSize - mapSize / 2;
        const z = Math.random() * mapSize - mapSize / 2;
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        if (distanceFromCenter > 30) {
            const bunny = createBunny(x, z);
            bunnies.push(bunny);
            scene.add(bunny.mesh);
        }
    }
    return bunnies;
}


// Function to create a sheep
function createSheep(x, z) {
    // Create sheep body (scaled up by 100%)
    const scaleFactor = 2; // Double the size
    const bodyGeometry = new THREE.SphereGeometry(1.2 * scaleFactor, 16, 16);
    const woolMaterial = new THREE.MeshStandardMaterial({
        color: 0xF0F0F0,
        roughness: 1,
        metalness: 0,
    });
    const body = new THREE.Mesh(bodyGeometry, woolMaterial);
    body.castShadow = true;
    // Create sheep head
    const headGeometry = new THREE.SphereGeometry(0.6 * scaleFactor, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
        color: 0x303030,
        roughness: 0.8,
        metalness: 0.1,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.8 * scaleFactor, 0.8 * scaleFactor);
    head.castShadow = true;
    // Create legs
    const legGeometry = new THREE.CylinderGeometry(0.15 * scaleFactor, 0.15 * scaleFactor, 1 * scaleFactor, 8);
    const legMaterial = new THREE.MeshStandardMaterial({
        color: 0x303030,
        roughness: 0.8,
        metalness: 0.1,
    });
    const legs = [];
    const legPositions = [
        [-0.6 * scaleFactor, -0.5 * scaleFactor, -0.6 * scaleFactor], // back left
        [0.6 * scaleFactor, -0.5 * scaleFactor, -0.6 * scaleFactor], // back right
        [-0.6 * scaleFactor, -0.5 * scaleFactor, 0.6 * scaleFactor], // front left
        [0.6 * scaleFactor, -0.5 * scaleFactor, 0.6 * scaleFactor], // front right
    ];
    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        legs.push(leg);
    });
    // Create sheep group
    const sheepGroup = new THREE.Group();
    sheepGroup.add(body);
    sheepGroup.add(head);
    legs.forEach(leg => sheepGroup.add(leg));
    sheepGroup.position.set(x, 1 * scaleFactor, z); // Adjusted initial Y position
    // Add physics body
    const sheepShape = new CANNON.Box(new CANNON.Vec3(1 * scaleFactor, 1 * scaleFactor, 1.2 * scaleFactor)); // Scaled half-extents
    const sheepBody = new CANNON.Body({
        mass: 8 * Math.pow(scaleFactor, 3), // Mass scales with volume
        material: groundPhysMaterial,
        fixedRotation: true,
        linearDamping: 0.8
    });
    sheepBody.addShape(sheepShape);
    sheepBody.position.set(x, 1 * scaleFactor, z); // Adjusted initial Y position
    // Add custom properties for movement behavior
    sheepBody.userData = {
        moveCooldown: 0,
        moveForce: 5,
        moveInterval: 4 + Math.random() * 2,
        moveDirection: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize()
    };
    world.addBody(sheepBody);
    return {
        mesh: sheepGroup,
        body: sheepBody
    };
}
// Function to distribute sheep
function spawnSheep() {
    const sheepArray = [];
    const numSheep = 30;
    const mapSize = 450;
    for (let i = 0; i < numSheep; i++) {
        const x = Math.random() * mapSize - mapSize / 2;
        const z = Math.random() * mapSize - mapSize / 2;
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        if (distanceFromCenter > 30) {
            const newSheep = createSheep(x, z);
            sheepArray.push(newSheep);
            scene.add(newSheep.mesh);
        }
    }
    return sheepArray;
}
// Create initial scene
const terrain = createTerrain();
const bunnies = createBunnies();
const sheep = spawnSheep();
// Function to load and place the school hall
function loadSchoolHall() {
    const schoolHallUrl = "https://play.rosebud.ai/assets/School Hall.glb?hM2Z";
    gltfLoader.load(schoolHallUrl, (gltf) => {
        const model = gltf.scene;
        const initialScale = 150; // Upscaled to 150
        model.scale.set(initialScale, initialScale, initialScale);
        // Calculate bounding box *after* scaling to get correct dimensions
        const hallBox = new THREE.Box3().setFromObject(model);
        const hallSize = new THREE.Vector3();
        hallBox.getSize(hallSize);
        const mapSize = 500;
        const wallThickness = 2; // As defined in createBoundaryWalls
        // Position: Centered on X, back against North (+Z) wall
        const newXPosition = 0;
        const newZPosition = (mapSize / 2) - (hallSize.z / 2) - (wallThickness / 2);
        model.position.set(newXPosition, hallSize.y / 2, newZPosition);
        // Rotation: Back to North wall means it faces South. Assuming model's front is along its local -Z.
        // If model's front is +Z, this should be Math.PI. If front is +X, it's -Math.PI/2.
        model.rotation.y = Math.PI; // Rotated 180 degrees to face North
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.envMapIntensity = 1.0; // Ensure it reacts to HDRI
            }
        });
        scene.add(model);
        console.log(`School Hall model loaded and added to scene at X:${model.position.x.toFixed(2)}, Z:${model.position.z.toFixed(2)}. Scaled height: ${hallSize.y.toFixed(2)}`);
        // Physics body setup
        // The hallSize is now based on the scaled model
        const hallShape = new CANNON.Box(new CANNON.Vec3(hallSize.x / 2, hallSize.y / 2, hallSize.z / 2));
        const hallBody = new CANNON.Body({
            mass: 0, // Static
            material: groundPhysMaterial,
            // The physics body's position should match the visual model's center.
            // If model.position sets the base, then physics body's Y is hallSize.y / 2.
            // If model.position sets the center (like we just did), then physics body's Y is the same.
            position: new CANNON.Vec3(model.position.x, model.position.y, model.position.z)
        });
        // For a Box shape, rotation of 180 degrees doesn't change its collision boundaries,
        // but if you want to keep it aligned with the visual model:
        // Update physics body rotation to match visual model
        const q = new CANNON.Quaternion();
        q.setFromEuler(0, model.rotation.y, 0, 'XYZ'); // Use the model's Y rotation
        hallBody.quaternion.copy(q);
        hallBody.addShape(hallShape);
        world.addBody(hallBody);
        console.log("School Hall physics body created with size:", hallSize.x, hallSize.y, hallSize.z);
        schoolHallObject = {
            mesh: model,
            body: hallBody,
            name: "School Hall"
        }; // Store the school hall object
        console.log("School Hall object stored for interaction.");
    }, undefined, (error) => {
        console.error('Error loading School Hall model (ensure DRACO decoders are available if compressed):', error);
    });
}
// Placeholder for arrangeScenery function to prevent runtime errors
function arrangeScenery() {
    console.log("arrangeScenery called - currently a placeholder.");
    // Future: Add logic to arrange or create additional scenery elements.
    // For now, it can return an empty array or an object indicating no specific scenery was arranged.
    return {
        trees: [],
        houses: []
    };
}
const arrangedScenery = arrangeScenery();
loadSchoolHall(); // Call the function to load the school hall
// Asset URLs
const treeUrl = "https://play.rosebud.ai/assets/Tree.glb?rYhh";
const teleportPadUrl = "https://play.rosebud.ai/assets/Teleport Pad.glb?xJXC";
const slideUrl = "https://play.rosebud.ai/assets/Slide.glb?XOP2";
const junglegymUrl = "https://play.rosebud.ai/assets/Jungle Gym.glb?wlm3";
const infoPanelUrl = "https://play.rosebud.ai/assets/Info-Panel.glb?MCZk";
const doorUrl = "https://play.rosebud.ai/assets/Door.glb?FeFX";
const benchUrl = "https://play.rosebud.ai/assets/Bench.glb?0SGA";
// Function to load a generic GLB asset and add physics
function loadAsset(url, position, scale, rotationY = 0, physicsOptions = {
    type: 'box',
    size: new THREE.Vector3(1, 1, 1)
}, rotationX = 0, assetName = "Generic Asset") { // Added assetName parameter
    gltfLoader.load(url, (gltf) => {
        const model = gltf.scene;
        model.scale.set(scale.x, scale.y, scale.z);
        // model.position.copy(position); // Old position setting
        model.rotation.y = rotationY;
        model.rotation.x = rotationX; // Apply X rotation
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.envMapIntensity = 1.0;
            }
        });
        // Temporarily add to scene to calculate bounding box correctly with world matrix
        // Set initial position for bounding box calculation
        model.position.copy(position);
        scene.add(model); // Add to scene BEFORE calculating bounding box
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const modelMinY = box.min.y;
        // Adjust model position so its base (minY) is at the target position.y
        model.position.y += (position.y - modelMinY);
        // Now that the visual model is correctly positioned, its center can be used for physics if needed.
        // Or, we can continue to use the input `position` as the base for the physics body.
        const finalModelBox = new THREE.Box3().setFromObject(model); // Recalculate box for final position
        const finalModelCenter = new THREE.Vector3();
        finalModelBox.getCenter(finalModelCenter);
        const finalModelSize = new THREE.Vector3();
        finalModelBox.getSize(finalModelSize);
        let physicsBody;
        // Physics body position should be its center.
        // If `position.y` is ground (0), and model's base is now at `position.y`,
        // then physics body center Y is `position.y + finalModelSize.y / 2`.
        const physicsBodyPositionY = position.y + (physicsOptions.size ? physicsOptions.size.y / 2 : finalModelSize.y / 2);
        if (physicsOptions.type === 'box') {
            const boxSize = physicsOptions.size || finalModelSize; // Use provided size or fallback to visual model size
            const shape = new CANNON.Box(new CANNON.Vec3(boxSize.x / 2, boxSize.y / 2, boxSize.z / 2));
            physicsBody = new CANNON.Body({
                mass: 0, // Static
                material: groundPhysMaterial,
                // Position the physics body based on the center of the provided or derived size
                position: new CANNON.Vec3(model.position.x, position.y + boxSize.y / 2, model.position.z)
            });
            physicsBody.addShape(shape);
        } else if (physicsOptions.type === 'cylinder') {
            let radius, height;
            if (assetName === "Tree2-v1") {
                // For Tree2-v1, let's try deriving from visual bounds as a test
                radius = Math.max(finalModelSize.x, finalModelSize.z) / 2;
                height = finalModelSize.y;
                console.log(`Tree2-v1: Using visual bounds for physics cylinder. Radius: ${radius.toFixed(2)}, Height: ${height.toFixed(2)}`);
            } else {
                radius = physicsOptions.radius !== undefined ? physicsOptions.radius : Math.max(finalModelSize.x, finalModelSize.z) / 2;
                height = physicsOptions.height !== undefined ? physicsOptions.height : finalModelSize.y;
            }
            const shape = new CANNON.Cylinder(radius, radius, height, physicsOptions.segments || 8);
            physicsBody = new CANNON.Body({
                mass: 0, // Explicitly set mass to 0 for static objects
                material: groundPhysMaterial,
                position: new CANNON.Vec3(model.position.x, position.y + height / 2, model.position.z) // Centered based on its height
            });
            physicsBody.addShape(shape);
            if (assetName === "Tree2-v1") {
                console.log(`Tree2-v1 CYLINDER physics body CREATED. Mass: ${physicsBody.mass}. Position: Y=${physicsBody.position.y.toFixed(2)} (Center). Shape height: ${height.toFixed(2)}, Shape Radius: ${radius.toFixed(2)}`);
            }
        }
        if (physicsBody) {
            const q = new CANNON.Quaternion();
            q.setFromEuler(rotationX, rotationY, 0, 'XYZ');
            physicsBody.quaternion.copy(q);
            if (assetName === "Tree2-v1") {
                console.log(`BEFORE ADDING Tree2-v1 to world. Body ID: ${physicsBody.id}, Position: ${physicsBody.position.toString()}, Num Shapes: ${physicsBody.shapes.length}`);
            }
            world.addBody(physicsBody);
            console.log(`${assetName} added to world. Visuals at Y: ${model.position.y.toFixed(2)}, Physics body center Y: ${physicsBody.position.y.toFixed(2)}. Model Height: ${finalModelSize.y.toFixed(2)}`);
            if (assetName === "Info-Panel") {
                infoPanelObject = {
                    mesh: model,
                    body: physicsBody,
                    name: assetName
                };
            } else if (assetName === "Bench") {
                benchObject = {
                    mesh: model,
                    body: physicsBody,
                    name: assetName
                };
            } else if (assetName === "Tree2-v1") {} else if (assetName === "Tree") {
                treeObject = {
                    mesh: model,
                    body: physicsBody,
                    name: assetName
                };
                console.log("Tree object successfully stored for interaction. Body ID:", physicsBody.id);
                if (!world.bodies.includes(physicsBody)) {
                    console.error(`CRITICAL: Tree physics body (ID: ${physicsBody.id}) WAS NOT found in world.bodies immediately after addBody!`);
                } else {
                    console.log(`CONFIRMED: Tree physics body (ID: ${physicsBody.id}) IS in world.bodies. Mass: ${physicsBody.mass}, Material: ${physicsBody.material ? physicsBody.material.name : 'N/A'}`);
                }
            } else if (assetName === "Jungle Gym") {
                junglegymObject = {
                    mesh: model,
                    body: physicsBody,
                    name: assetName
                };
            } else if (assetName === "Door") {
                doorObject = {
                    mesh: model,
                    body: physicsBody,
                    name: assetName
                };
            } else if (assetName === "Slide") {
                slideObject = {
                    mesh: model,
                    body: physicsBody,
                    name: assetName
                };
            } else if (assetName === "Teleport Pad") {
                teleportPadObject = {
                    mesh: model,
                    body: physicsBody,
                    name: assetName
                };
            }
        } else {
            console.error(`Physics body for ${assetName} was not created.`);
        }
    }, undefined, (error) => {
        console.error(`Error loading ${url} (${assetName}):`, error);
    });
}
// Function to place various assets
function placeEnvironmentAssets() {
    const mapSize = 500;
    const cornerOffset = 40; // Offset from walls for corner placements, adjusted for larger items
    const wallOffset = 25; // Offset from wall for items placed along a wall edge
    // Tree: Equidistant from South (-Z) and East (+X) walls, near their corner. Scale: 90.
    const treeOffset = cornerOffset + 15; // Slightly different offset for Tree if needed, or use cornerOffset directly
    loadAsset(treeUrl, new THREE.Vector3(mapSize / 2 - treeOffset, 0, -mapSize / 2 + treeOffset), new THREE.Vector3(90, 90, 90), 0, {
        type: 'box', // CHANGED TO BOX FOR TESTING
        size: new THREE.Vector3(25, 75, 25) // Increased width and depth
    }, 0, "Tree");
    // Teleport Pad: Near corner of North (+Z) and East (+X) walls. Upscaled by 50%.
    loadAsset(teleportPadUrl, new THREE.Vector3(mapSize / 2 - cornerOffset, 0.1, mapSize / 2 - cornerOffset), new THREE.Vector3(39.375, 39.375, 39.375), 0, { // 22.5 * 1.75 = 39.375
        type: 'box'
    }, 0, "Teleport Pad"); // y=0.1 to prevent z-fighting
    // Slide: Adjusted position and physics body. Rotated 90 deg anticlockwise (now facing North). Scale: 78.75.
    loadAsset(slideUrl, new THREE.Vector3(-165, 0, 4.1), new THREE.Vector3(78.75, 78.75, 78.75), Math.PI / 2, {
        type: 'box',
        size: new THREE.Vector3(30, 30, 70) // Smaller physics box size
    }, 0, "Slide");
    // Jungle Gym: Near corner of South (-Z) and West (-X) walls, moved slightly towards center. Scale: 60.
    const junglegymOffset = cornerOffset + 40; // Moved an additional 20 units (total 40) closer to center
    loadAsset(junglegymUrl, new THREE.Vector3(-mapSize / 2 + junglegymOffset, 0, -mapSize / 2 + junglegymOffset), new THREE.Vector3(105, 105, 105), 0, {
        type: 'box'
    }, 0, "Jungle Gym");
    // Info-Panel: Middle of the map, facing towards the North wall (+Z). Scale: 16.
    loadAsset(infoPanelUrl, new THREE.Vector3(0, 0, 0), new THREE.Vector3(28, 28, 28), 0, { // 16 * 1.75 = 28
        type: 'box'
    }, 0, "Info-Panel");
    // Door: Near corner of West (-X) and North (+Z) walls. Rotated another 90 deg clockwise from previous, Upscaled by 50%.
    loadAsset(doorUrl, new THREE.Vector3(-mapSize / 2 + (cornerOffset + 20), 0, mapSize / 2 - (cornerOffset + 20)), new THREE.Vector3(63, 63, 63), -Math.PI / 4, { // Moved 20 units towards center
        type: 'box'
    }, 0, "Door");
    // Bench: Near center middle of the East wall (+X), facing West. Upscaled by 150%.
    loadAsset(benchUrl, new THREE.Vector3(mapSize / 2 - wallOffset, 0, 0), new THREE.Vector3(40, 40, 40), -Math.PI / 2, { // Scale 16 * 2.5 = 40
        type: 'box'
    }, 0, "Bench");
}
placeEnvironmentAssets();
const playerSpawnPosition = new THREE.Vector3(126, characterConfig.startHeight, 112);
// Function to create boundary walls
function createBoundaryWalls() {
    const mapSize = 500; // Must match terrain size
    const wallHeight = 50; // Make walls tall enough
    const wallThickness = 2;
    const wallTexture = textureLoader.load('https://play.rosebud.ai/assets/Wall.png?bGkd');
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(mapSize / 50, wallHeight / 50); // Adjust repeat based on wall dimensions
    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.9,
        metalness: 0.1,
        transparent: false,
        opacity: 1.0
    });
    const wallPositions = [{
            x: 0,
            y: wallHeight / 2,
            z: mapSize / 2 + wallThickness / 2,
            w: mapSize + wallThickness * 2,
            h: wallHeight,
            d: wallThickness,
            uvHorizontal: true // For texture orientation
        }, // North
        {
            x: 0,
            y: wallHeight / 2,
            z: -mapSize / 2 - wallThickness / 2,
            w: mapSize + wallThickness * 2,
            h: wallHeight,
            d: wallThickness,
            uvHorizontal: true // For texture orientation
        }, // South
        {
            x: mapSize / 2 + wallThickness / 2,
            y: wallHeight / 2,
            z: 0,
            w: wallThickness,
            h: wallHeight,
            d: mapSize,
            uvHorizontal: false // For texture orientation
        }, // East
        {
            x: -mapSize / 2 - wallThickness / 2,
            y: wallHeight / 2,
            z: 0,
            w: wallThickness,
            h: wallHeight,
            d: mapSize,
            uvHorizontal: false // For texture orientation
        } // West
    ];
    wallPositions.forEach(pos => {
        const wallGeometry = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
        // Clone material for each wall to allow individual texture repeat settings if needed in future
        const currentWallMaterial = wallMaterial.clone();
        if (pos.uvHorizontal) { // North and South walls
            currentWallMaterial.map.repeat.set(pos.w / 30, pos.h / 30); // Adjust divisor for desired texture scale
        } else { // East and West walls
            currentWallMaterial.map.repeat.set(pos.d / 30, pos.h / 30); // Adjust divisor for desired texture scale
        }
        currentWallMaterial.map.needsUpdate = true; // Ensure repeat settings apply
        const wallMesh = new THREE.Mesh(wallGeometry, currentWallMaterial);
        wallMesh.position.set(pos.x, pos.y, pos.z);
        wallMesh.receiveShadow = true; // Walls should receive shadows
        // wallMesh.castShadow = true; // Walls could cast shadows, but often not needed for boundary walls
        scene.add(wallMesh);
        // Physics body
        const wallShape = new CANNON.Box(new CANNON.Vec3(pos.w / 2, pos.h / 2, pos.d / 2));
        const wallBody = new CANNON.Body({
            mass: 0, // Static
            material: groundPhysMaterial, // Use the same material as the ground for interaction properties
            shape: wallShape,
            position: new CANNON.Vec3(pos.x, pos.y, pos.z)
        });
        world.addBody(wallBody);
    });
}
createBoundaryWalls(); // Call the function to create walls
// Function to create labels for walls
function createWallLabels() {
    const mapSize = 500;
    const wallHeight = 50; // Same as in createBoundaryWalls
    const labelOffset = 10; // Offset from the wall to make labels visible
    const makeTextSprite = (message, parameters) => {
        const fontface = parameters.fontface || 'Arial';
        const fontsize = parameters.fontsize || 18;
        const borderThickness = parameters.borderThickness || 4;
        const borderColor = parameters.borderColor || {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0
        };
        const backgroundColor = parameters.backgroundColor || {
            r: 255,
            g: 255,
            b: 255,
            a: 1.0
        };
        const textColor = parameters.textColor || {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0
        };
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `Bold ${fontsize}px ${fontface}`;
        // get size data (height depends only on font size)
        const metrics = context.measureText(message);
        const textWidth = metrics.width;
        // background color
        context.fillStyle = `rgba(${backgroundColor.r},${backgroundColor.g},${backgroundColor.b},${backgroundColor.a})`;
        // border color
        context.strokeStyle = `rgba(${borderColor.r},${borderColor.g},${borderColor.b},${borderColor.a})`;
        context.lineWidth = borderThickness;
        // 1.4 is extra height factor for text below baseline: g,j,p,q.
        roundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
        // text color
        context.fillStyle = `rgba(${textColor.r},${textColor.g},${textColor.b},${textColor.a})`;
        context.fillText(message, borderThickness, fontsize + borderThickness);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize); // Adjust sprite scale
        return sprite;
    }
    // Helper function for rounded rectangles
    const roundRect = (ctx, x, y, w, h, r) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    const labelParameters = {
        fontsize: 72, // Increased font size for visibility
        borderColor: {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0
        },
        backgroundColor: {
            r: 255,
            g: 220,
            b: 180,
            a: 0.8
        }, // Light peach background
        textColor: {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0
        }
    };

}
createWallLabels(); // Call the function to create wall labels
const dynamicObjects = []; // Array to hold objects that need their mesh updated from physics
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.1);

    if (assetsLoaded) {
        world.step(deltaTime);

        updateCharacterMovement(deltaTime); // Update character movement
        updateCamera(deltaTime); // Update camera to follow character
        updateSpeechBubblePosition(); // Call function to update speech bubble position
        if (character && characterBody) {
            // Adjust the character model's position based on the physics body
            character.position.copy(characterBody.position);
            character.quaternion.copy(characterBody.quaternion); // Synchronize visual rotation with physics body
            // Update "Press V to Vibe" HUD visibility
            if (vibePromptHUD) {
                vibePromptHUD.style.display = isDancing ? 'none' : 'flex';
            }
            if (controlsPromptHUD && controlsPopup.style.display === 'none') { // Only show if popup is closed
                controlsPromptHUD.style.display = 'flex';
            } else if (controlsPromptHUD) {
                controlsPromptHUD.style.display = 'none';
            }
            // Ensure mute button is visible if game has started
            if (muteButtonHUD && startScreen.style.display === 'none') {
                muteButtonHUD.style.display = 'block';
            }
        }
        // Update Debug HUD
        // if (debugHUD && character && characterBody) { // Removed
        //     const physicsHeight = characterConfig.height.toFixed(2); // Removed
        //     const visualModelBox = new THREE.Box3().setFromObject(character); // Removed
        //     const visualModelHeight = (visualModelBox.max.y - visualModelBox.min.y).toFixed(2); // Removed
        //     const fixedSpeechBubbleOffsetY = 18.6; // Removed
        //     const speechBubbleStartY = (character.position.y + fixedSpeechBubbleOffsetY).toFixed(2); // Removed
        //     debugHUD.innerHTML = `Character Physics Height: ${physicsHeight}\nVisual Model BBox Height: ${visualModelHeight}\nSpeech Bubble Start Y (abs): ${speechBubbleStartY}\nSpeech Bubble Offset Y (rel): ${fixedSpeechBubbleOffsetY.toFixed(2)}`; // Removed
        // } else if (debugHUD) { // Removed
        //     debugHUD.innerHTML = "Character or characterBody not loaded."; // Removed
        // } // Removed
        // Update dynamic schoolyard objects
        dynamicObjects.forEach(obj => {
            if (obj.mesh && obj.body) {
                obj.mesh.position.copy(obj.body.position);
                obj.mesh.quaternion.copy(obj.body.quaternion);
            }
        });

        // Update animals
        const animals = [...bunnies, ...sheep];
        animals.forEach(animal => {
            // Update mesh position
            animal.mesh.position.copy(animal.body.position);
            if (animal.body.userData.hopCooldown !== undefined) {
                // Bunny behavior
                animal.body.userData.hopCooldown -= deltaTime;
                if (animal.body.userData.hopCooldown <= 0) {
                    animal.body.userData.hopCooldown = animal.body.userData.hopInterval;
                    animal.body.velocity.y = animal.body.userData.hopForce;
                    animal.body.userData.moveDirection = new THREE.Vector3(
                        Math.random() - 0.5,
                        0,
                        Math.random() - 0.5
                    ).normalize();
                    animal.body.velocity.x = animal.body.userData.moveDirection.x * 5;
                    animal.body.velocity.z = animal.body.userData.moveDirection.z * 5;
                }
            } else if (animal.body.userData.moveCooldown !== undefined) {
                // Sheep behavior
                animal.body.userData.moveCooldown -= deltaTime;
                if (animal.body.userData.moveCooldown <= 0) {
                    animal.body.userData.moveCooldown = animal.body.userData.moveInterval;
                    animal.body.userData.moveDirection = new THREE.Vector3(
                        Math.random() - 0.5,
                        0,
                        Math.random() - 0.5
                    ).normalize();
                }
                // Apply gentle force for sheep movement
                animal.body.velocity.x += animal.body.userData.moveDirection.x * animal.body.userData.moveForce * deltaTime;
                animal.body.velocity.z += animal.body.userData.moveDirection.z * animal.body.userData.moveForce * deltaTime;
            }
            // Rotate animal in movement direction
            if (animal.body.velocity.x !== 0 || animal.body.velocity.z !== 0) {
                const angle = Math.atan2(animal.body.velocity.x, animal.body.velocity.z);
                animal.mesh.rotation.y = angle;
            }
        });
    }

    composer.render();
}

// Handle window resize
function onWindowResize() {
    const width = parentDiv.clientWidth;
    const height = parentDiv.clientHeight;

    // Update camera
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Update renderer and composer
    renderer.setSize(width, height);
    composer.setSize(width, height);

    // Update post-processing passes
    bloomPass.resolution.set(width, height);
    smaaPass.setSize(width, height);
}

// Add event listeners
window.addEventListener('resize', onWindowResize);
const resizeObserver = new ResizeObserver(onWindowResize);
resizeObserver.observe(parentDiv);
// Function for typewriter effect
function typewriterEffect(element, text, delay = 50) { // Default delay 50ms
    if (typewriterInterval) {
        clearInterval(typewriterInterval); // Clear any existing interval
    }
    element.innerHTML = ''; // Clear existing content
    let i = 0;
    typewriterInterval = setInterval(() => {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
        } else {
            clearInterval(typewriterInterval);
            typewriterInterval = null; // Reset interval ID
        }
    }, delay);
}
// Function to update speech bubble position
function updateSpeechBubblePosition() {
    if (!speechBubble || !character || !camera) { // Simplified condition, display handled separately
        return;
    }
    const characterPosition = character.position.clone();
    // Adjust this offset to position the bubble correctly above the character's head
    const fixedOffsetY = 18.6; // Set the desired Y offset
    const bubbleOffset = new THREE.Vector3(0, fixedOffsetY, 0);
    const bubbleWorldPosition = characterPosition.add(bubbleOffset);
    // Project 3D world position to 2D screen position
    const screenPosition = bubbleWorldPosition.project(camera);
    const halfWidth = parentDiv.clientWidth / 2;
    const halfHeight = parentDiv.clientHeight / 2;
    let x = (screenPosition.x * halfWidth) + halfWidth;
    let y = -(screenPosition.y * halfHeight) + halfHeight;
    // Apply transform to center the bubble and position its tail correctly
    speechBubble.style.left = `${x}px`;
    speechBubble.style.top = `${y}px`;
    speechBubble.style.transform = `translate(-50%, -100%)`; // Translates -50% of its width and -100% of its height
    // Basic check to hide bubble if character is behind camera (optional, needs refinement)
    if (screenPosition.z > 1) {
        if (speechBubble.style.display !== 'none') {
            speechBubble.style.display = 'none';
            if (typewriterInterval) { // If bubble is hidden, stop typing
                clearInterval(typewriterInterval);
                typewriterInterval = null;
            }
        }
    } else if (speechBubble.innerHTML !== "" && speechBubble.style.display === 'none' && typewriterInterval === null) {
        // Only show if there's content, it was hidden, and no active typewriter (to prevent re-triggering type on visibility toggle)
        // This part might need refinement if you want to re-trigger typing when it becomes visible again
        // For now, it assumes if it was hidden due to z-depth, it stays hidden or needs explicit show command
    } else if (speechBubble.innerHTML !== "" && speechBubble.style.display === 'none' && typewriterInterval !== null) {
        // If it's hidden but an interval is running, let it continue until done, then it might be set to 'block' by the interval end
    } else if (speechBubble.innerHTML !== "" && speechBubble.style.display !== 'block' && typewriterInterval === null) {
        // If it has content, is not block, and no interval, ensure it's block (e.g., after typing finishes)
        speechBubble.style.display = 'block';
    }
}
// Start animation
animate();
