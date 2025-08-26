// DISCLAIMER: Some commentaries, variables and stuff here are in french as its at first just for me, sometimes I code in english, sometimes in french, it doesn't really matter for me, but for you maybe so be aware that both languages exist in this file.




const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WORLD_WIDTH = 1920;
const WORLD_HEIGHT = 1080;

function stringToNumberIfDigitsOnly(str) {
  if (/^\d+$/.test(str)) {
    return Number(str);
  }
  return str;
}


function drawText(texte, x, y, couleur, police = "20px Arial", alpha = 1) {

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = couleur;
  ctx.font = police;
  ctx.fillText(texte, x, y);

  ctx.restore();
}


function blendColorsHealth(healthRatio) {
  // Interpolation entre rouge et vert
  const r = Math.floor(255 * (1 - healthRatio));
  const g = Math.floor(255 * healthRatio);
  return `rgb(${r}, ${g}, 0)`;
}

/**
 * Dessine une barre de vie sur un canvas existant.
 * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
 * @param {number} health - Vie actuelle
 * @param {number} maxHealth - Vie maximale
 * @param {number} x - Position x de la barre
 * @param {number} y - Position y de la barre
 * @param {number} width - Largeur de la barre
 * @param {number} height - Hauteur de la barre
 */
function drawHealthBar(health, maxHealth, ctx, x, y, width, height) {
  const ratio = Math.max(0, Math.min(1, health / maxHealth));
  const color = blendColorsHealth(ratio);

  // Fond de la barre
  ctx.fillStyle = '#444';
  ctx.fillRect(x, y, width, height);

  // Remplissage de la barre de vie
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * ratio, height);

  // Contour
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, width, height);
}
//==light stuff vars==
function lightOfSceneFunction(opacity) {
    // Clamp la valeur entre 0 et 1
    opacity = Math.max(0, Math.min(1, opacity));
  
    // Si l'opacité est 1, pas besoin de dessiner un calque noir
    if (opacity >= 1) return;
  
    const ctx = render.context;
    const width = render.canvas.width;
    const height = render.canvas.height;
  
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - opacity})`; // 1 = normal → 0 d’ombre
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
  var lightOfScene = 1
  let targetLightLevel = 1;  // objectif
  let lightTransitionSpeed = 0.01; // vitesse de transition
  
  function setTargetLight(level) {
    targetLightLevel = Math.max(0, Math.min(1, level)); // clamp entre 0 et 1
  }

//=== ====

function convertToObjects(coordList) {
    return coordList.map(([x, y]) => ({ x, y }));
  }  
  function getOppositeColor(hex) {
    // Remove the # if present
    hex = hex.replace(/^#/, '');

    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    if (hex.length !== 6) {
        throw new Error("Invalid hex color.");
    }

    // Invert each color component
    let r = 255 - parseInt(hex.substring(0, 2), 16);
    let g = 255 - parseInt(hex.substring(2, 4), 16);
    let b = 255 - parseInt(hex.substring(4, 6), 16);

    // Convert back to hex and pad with zeros if needed
    let inverted = [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');

    return `#${inverted}`;
}

const customShapes = {
    "Bizeau": [ 
        {x: 0, y: 0},
        {x: 100, y: 0},
        {x: 100, y: 20},
        {x: 0, y: 50}
    ],
    "ArrasShape": convertToObjects([[-1,-1],[0.5,-1],[1,-0.5],[1,0.5],[0.5,1],[-1,1]])
}
  
  
  
// Import des modules de Matter.js
const {
    Engine,
    Render,
    Runner,
    Bodies,
    Composite,
    Composites,
    Body,
    Events,
    Mouse,
    MouseConstraint,
    Constraint
} = Matter;
let developerMode = false;


// Création du moteur
const engine = Engine.create();
const { world } = engine;

// Création du rendu
const render = Render.create({
    element: document.body,
    canvas: document.getElementById('gameCanvas'),
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: '#222',
        hasBounds: true // active la gestion de "vue"
    }
});


Render.run(render);
Runner.run(Runner.create(), engine);

function worldToScreen(position, render) {
  const bounds = render.bounds;
  const canvas = render.canvas;
  const viewWidth = bounds.max.x - bounds.min.x;
  const viewHeight = bounds.max.y - bounds.min.y;
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  return {
    x: ((position.x - bounds.min.x) / viewWidth) * canvasWidth,
    y: ((position.y - bounds.min.y) / viewHeight) * canvasHeight
  };
}


const mouse = Mouse.create(render.canvas);

Matter.Common.setDecomp(decomp); // le truc qui permet d'utiliser fromVertices()

function updateRenderView() {
    const canvasW = window.innerWidth;
    const canvasH = window.innerHeight;

    const screenRatio = canvasW / canvasH;
    const worldRatio = WORLD_WIDTH / WORLD_HEIGHT;

    let viewWidth, viewHeight;

    if (screenRatio > worldRatio) {
        // écran large → vue plus large
        viewHeight = WORLD_HEIGHT;
        viewWidth = viewHeight * screenRatio;
    } else {
        // écran étroit → vue plus haute
        viewWidth = WORLD_WIDTH;
        viewHeight = viewWidth / screenRatio;
    }

    render.bounds.min.x = 0;
    render.bounds.min.y = 0;
    render.bounds.max.x = viewWidth;
    render.bounds.max.y = viewHeight;

    render.canvas.width = canvasW;
    render.canvas.height = canvasH;
    render.options.width = canvasW;
    render.options.height = canvasH;
}

function rel(x, y) {//Position relative des objets lors de l'init
    return {
        x: x * WORLD_WIDTH,
        y: y * WORLD_HEIGHT
    };
}
function relX(x) {
    return x * WORLD_WIDTH;
}

function relY(y) {
    return y * WORLD_HEIGHT;
}


window.addEventListener('resize', updateRenderView);
updateRenderView(); // appel initial

const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false
        }
    }
});
document.addEventListener('keydown', event => {
    if (event.code === 'KeyD') {
        developerMode = !developerMode;
        console.log(`🛠️ Dev mode : ${developerMode ? 'ON' : 'OFF'}`);

        if (developerMode) {
            Composite.add(world, mouseConstraint);
        } else {
            Composite.remove(world, mouseConstraint);
        }
    }
});
render.mouse = mouse;

// Création du sol
/*const sol = Bodies.rectangle(window.innerWidth / 2, window.innerHeight - 50, window.innerWidth, 100, {
    isStatic: true,
    friction: 0,     // glissant
    restitution: 0, // léger rebond (optionnel)
    render: { fillStyle: '#888' }
});

Composite.add(world, sol);*/

// Création de la boule contrôlable
/*const ball = Bodies.circle(200, 200, 30, {
    restitution: 0.75,
    friction: 0,
    frictionAir: 0.001, // petit ralentissement dans l'air
    render: { fillStyle: '#4cf' }
});

Composite.add(world, ball);
*/
const COLLISION_GROUP_PORTAL = Body.nextGroup(true); // Groupe de collision exclusif aux portails

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

document.addEventListener('keydown', event => {
    if (event.code === 'Space') {
        keys.Space = true;
    } else if (event.code in keys) {
        keys[event.code] = true;
    }
});

document.addEventListener('keyup', event => {
    if (event.code === 'Space') {
        keys.Space = false;
    } else if (event.code in keys) {
        keys[event.code] = false;
    }
});


function isSurfaceGroundLike(normal, angleThreshold = 45) {
  let angle = Math.atan2(normal.y, normal.x) * (180 / Math.PI);
  if (angle < 0) angle += 360;

  const upAngle = Math.abs(angle - 270);


  return upAngle <= angleThreshold;
}






let currentLevelId = 1; // valeur par défaut
const dynamicKillers = [];
const portals = [];
// == DIALOGUE ==//

let canMove = true;
let canJump = false;
let jumpCooldown = 0; // pour limiter la fréquence des sauts
let dialogueMode = "text"; // "text" ou "choice"
let choices = [];
let selectedChoiceIndex = 0;
let playerInput = "";
let currentInputPlaceholder = "";
let currentInputDefault = "";

const dialogueBox = document.getElementById("dialogueBox");

let dialogueActive = false;
let dialogueCallback = null;

let fullText = "";
let typingIndex = 0;
let isTyping = false;
let typingSpeed = 25;
let typingInterval = null;

let currentStyle = {
  font: '18px Arial',
  color: '#eee'
};

let currentQuestion = "";

let choiceCallbackToCall = null;  // <-- Nouvelle variable pour stocker callback du choix

const colorOfPurcentagedStuff = "#2e68ff"
// === FORMATTAGE DU TEXTE ===
function parseSegments(text) {
  const segments = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    if (text[i] === '%') {
      let end = text.indexOf('%', i + 1);
      if (end === -1) end = len;
      const content = text.slice(i + 1, end);
      segments.push({ text: content, color: colorOfPurcentagedStuff, italic: false });
      i = end + 1;
    } else if (text.slice(i, i + 2) === '**') {
      let end = text.indexOf('**', i + 2);
      if (end === -1) end = len;
      const content = text.slice(i + 2, end);
      segments.push({ text: content, color: 'normal', italic: true });
      i = end + 2;
    } else {
      let nextPercent = text.indexOf('%', i);
      let nextItalic = text.indexOf('**', i);
      let nextPos = Math.min(
        nextPercent === -1 ? len : nextPercent,
        nextItalic === -1 ? len : nextItalic
      );
      const content = text.slice(i, nextPos);
      segments.push({ text: content, color: 'normal', italic: false });
      i = nextPos;
    }
  }

  return segments;
}

// === AFFICHAGE LETTRE PAR LETTRE ===
function startTyping() {
  isTyping = true;
  dialogueBox.innerHTML = "";

  const segments = parseSegments(fullText);
  let segIndex = 0;
  let charIndex = 0;

  function addNextChar() {
    if (segIndex >= segments.length) {
      finishTyping();
      return;
    }

    const segment = segments[segIndex];

    if (!dialogueBox.lastChild || dialogueBox.lastChild.dataset.segIndex != segIndex) {
      const span = document.createElement('span');
      span.dataset.segIndex = segIndex;
      span.style.color = segment.color === colorOfPurcentagedStuff ? colorOfPurcentagedStuff : '#eee';
      span.style.fontStyle = segment.italic ? 'italic' : 'normal';
      dialogueBox.appendChild(span);
    }

    const currentSpan = dialogueBox.lastChild;
    currentSpan.textContent += segment.text[charIndex];
    charIndex++;

    if (charIndex >= segment.text.length) {
      segIndex++;
      charIndex = 0;
    }
  }

  typingInterval = setInterval(addNextChar, typingSpeed);
}

function finishTyping() {
  clearInterval(typingInterval);
  typingInterval = null;
  isTyping = false;

  dialogueBox.innerHTML = "";

  const segments = parseSegments(fullText);
  segments.forEach(seg => {
    const span = document.createElement('span');
    span.style.color = seg.color === colorOfPurcentagedStuff ? colorOfPurcentagedStuff : '#eee';
    span.style.fontStyle = seg.italic ? 'italic' : 'normal';
    span.innerHTML = seg.text;
    dialogueBox.appendChild(span);
  });

  // Après fin de la frappe, si on est en mode choix, on affiche les chevrons
  if (dialogueMode === "choice") {
    renderChoice();
  }
  if (dialogueMode === "input") {
    createInputField(currentInputPlaceholder || "", currentInputDefault || "");
  }
}

function renderChoice() {
  // Ajoute chevrons devant le choix sélectionné
  // On repart du texte complet (question + choix)
  // Recrée le contenu avec ">" devant choix sélectionné

  let content = "";

  // Question stylée
  const questionSegments = parseSegments(currentQuestion);
  questionSegments.forEach(seg => {
    content += `<span style="color:${seg.color === colorOfPurcentagedStuff ? colorOfPurcentagedStuff : '#eee'};font-style:${seg.italic ? 'italic' : 'normal'}">${seg.text}</span>`;
  });

  content += "<br><br>";

  choices.forEach((choice, i) => {
    const prefix = i === selectedChoiceIndex ? "> " : "&nbsp;&nbsp;";
    const segments = parseSegments(choice.text);
    content += prefix;
    segments.forEach(seg => {
      content += `<span style="color:${seg.color === colorOfPurcentagedStuff ? colorOfPurcentagedStuff : '#eee'};font-style:${seg.italic ? 'italic' : 'normal'}">${seg.text}</span>`;
    });
    content += "<br>";
  });

  dialogueBox.innerHTML = content;
}

function hideDialogue() {
  dialogueActive = false;
  canMove = true;
  dialogueBox.style.display = "none";

  if (typeof dialogueCallback === 'function') {
    const cb = dialogueCallback;
    dialogueCallback = null;

    // ✅ Transmet l'input si on est en mode 'input'
    if (dialogueMode === "input") {
      cb(playerInput);
    } else {
      cb();
    }
  }
}

  
  function createInputField(placeholder = "", defaultValue = "") {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.value = defaultValue;
    input.style.marginTop = "10px";
    input.style.padding = "5px";
    input.style.fontSize = "16px";
    input.style.width = "90%";
    input.style.boxSizing = "border-box";
    input.style.border = "1px solid #ccc";
    input.style.borderRadius = "4px";
    input.style.backgroundColor = "#222";
    input.style.color = "#eee";
  
    input.id = "dialogueInputField";
  
    dialogueBox.appendChild(document.createElement("br"));
    dialogueBox.appendChild(input);
    input.focus();
  }
  
  function resetDialogue() {
    // Arrête la frappe
    if (isTyping) {
      clearInterval(typingInterval);
      typingInterval = null;
      isTyping = false;
    }
  
    // Nettoie tout
    dialogueBox.innerHTML = "";
    dialogueBox.style.display = "none";
    
    // Supprime input si existant
    const inputField = document.getElementById("dialogueInputField");
    if (inputField) {
      inputField.remove();
    }
  
    // Réinitialise les états
    dialogueActive = false;
    fullText = "";
    typingIndex = 0;
    choices = [];
    selectedChoiceIndex = 0;
    dialogueMode = "text";
    currentQuestion = "";
    currentInputPlaceholder = "";
    currentInputDefault = "";
  }
  
  
function showDialogue(content, onFinish = null, options = {}) {
  resetDialogue()
  dialogueActive = true;
  canMove = false;
  dialogueCallback = onFinish;

  currentStyle.font = (typeof content === "object" && content.font) || options.font || '18px Arial';
  currentStyle.color = (typeof content === "object" && content.color) || options.color || '#eee';

  dialogueBox.style.font = currentStyle.font;
  dialogueBox.style.color = currentStyle.color;
  dialogueBox.style.display = "block";
  dialogueBox.innerHTML = "";

  if (typeof content === "string") {
    dialogueMode = "text";
    fullText = content;
    startTyping();
  } else if (content.input === true) {
    dialogueMode = "input";
    fullText = content.text || "";
    currentInputPlaceholder = content.placeholder || "";
    currentInputDefault = content.default || "";
    startTyping();
  } else if (typeof content === "object") {
    if (Array.isArray(content.choices)) {
      dialogueMode = "choice";
      choices = content.choices;
      selectedChoiceIndex = 0;

      currentQuestion = content.text;
      fullText = content.text;  // afficher seulement la question en premier

      startTyping();
    } else if (content.text) {
      dialogueMode = "text";
      fullText = content.text;
      startTyping();
    }
  } 
}

function makeDialogue(dialogueObject, finalCallback = null) {
  resetDialogue();
  const keys = Object.keys(dialogueObject).map(Number).sort((a, b) => a - b);
  const dialogues = keys.map(k => dialogueObject[k]);

  function next(index) {
    if (index >= dialogues.length) {
      if (finalCallback) finalCallback();
      return;
    }

    const dlg = dialogues[index];
    const nextCallback = () => next(index + 1);

    if (typeof dlg === "string") {
      showDialogue(dlg, nextCallback);
    } else if (typeof dlg === "object") {
      if (dlg.text && Array.isArray(dlg.choices)) {
        showDialogue(dlg, nextCallback);
      } else if (dlg.text) {
        showDialogue(dlg, nextCallback);
      } else {
        showDialogue(String(dlg), nextCallback);
      }
    } else {
      showDialogue(String(dlg), nextCallback);
    }
  }

  next(0);
}


// === INPUT CLAVIER ===
window.addEventListener("keydown", (e) => {
  if (!dialogueActive) return;

  if (dialogueMode === "text") {
    if (e.code === "Space") {
      e.preventDefault();
      if (isTyping) {
        finishTyping();
      } else {
        hideDialogue();
      }
    }
} else if (dialogueMode === "choice") {
        if (isTyping) {
          if (e.code === "Space") {
            e.preventDefault();
            finishTyping();
          }
        } else {
          if (e.code === "ArrowUp") {
            e.preventDefault();
            selectedChoiceIndex = (selectedChoiceIndex - 1 + choices.length) % choices.length;
            renderChoice();
          } else if (e.code === "ArrowDown") {
            e.preventDefault();
            selectedChoiceIndex = (selectedChoiceIndex + 1) % choices.length;
            renderChoice();
          } else if (e.code === "Space") {
            e.preventDefault();
      
            // Stocke le callback du choix, mais ne l'appelle pas encore
            choiceCallbackToCall = choices[selectedChoiceIndex]?.callback || null;
      
            hideDialogue();
      
            // Appelle le callback après la fermeture, pour éviter conflit
            if (choiceCallbackToCall) {
              const cb = choiceCallbackToCall;
              choiceCallbackToCall = null;
              setTimeout(cb, 0);
            }
          }
        }
      } else if (dialogueMode === "input") {
        if (e.code === "Enter") {
          e.preventDefault();
    
          const inputField = document.getElementById("dialogueInputField");
          if (inputField) {
            playerInput = inputField.value;
    
            hideDialogue();
    
            if (typeof dialogueCallback === "function") {
              const cb = dialogueCallback;
              dialogueCallback = null;
    
              setTimeout(() => cb(playerInput), 0);
            }
          }
        }
      }
});

// =====

function normalizeDamageFormat(body) {
  if (body.damage !== undefined && !Array.isArray(body.damage)) {
    body.damage = [body.damage, 0];
  }
}


  
// Example lel
//showDialogue("Je pense que la vie n'est qu'une question de temps, et parfois, il faut savoir saisir les moments qui comptent vraiment. Car chaque seconde qui passe est une chance unique de changer quelque chose, d'aimer, de créer, ou simplement d'exister pleinement. Car oui, la Vie est quelque chose de formidable qu'il ne faut point oblier");


// ===LEVELS=== //

const levels = {
    "Test": {
        wallClimbEnabled: true,
        developerMode: true,
        spawn: rel(0.05, 0.1), // ≈ (96, 108)
        gravityY: 1.5,
        //ballRestitution: 0.75,
        frictionAir: 0.001,
        bodies: [
            () => Bodies.rectangle(rel(0.21, 0.46).x, rel(0.46, 0.46).y, 300, 20, {
                restitution: 1,
                isStatic: true,
                render: { fillStyle: '#888' }
            }),
            () => Bodies.rectangle(rel(0.5, 0.75).x, rel(0.5, 0.75).y - 50, WORLD_WIDTH, 100, {
                isStatic: true,
                friction: 0,
                restitution: 0,
                render: { fillStyle: '#888' }
            }),
            () => {
                const body = Bodies.rectangle(rel(0.31, 0.42).x, rel(0.42, 0.42).y, 50, 50, {
                    isStatic: true,
                    render: { fillStyle: '#000' }
                });
                body.damage = 50;
                return body;
            },
            () => {
                const portal = Bodies.rectangle(rel(0.39, 0.32).x, rel(0.32, 0.32).y, 40, 40, {
                    isStatic: true,
                    isSensor: true,
                    render: { fillStyle: '#0f0' },
                    collisionFilter: { group: COLLISION_GROUP_PORTAL }
                });
                portal.nextLevel = "Test2";
                return portal;
            },
            () => {
                const body = Bodies.rectangle(rel(0.10, 0.28).x, rel(0.28, 0.28).y, 40, 40, {
                    restitution: 0.5,
                    render: { fillStyle: '#f55' }
                });
                body.damage = [50, 2];
                return body;
            },
            () => Bodies.rectangle(rel(0.16, 0.28).x, rel(0.28, 0.28).y, 60, 60, {
                restitution: 0.5,
                render: { fillStyle: '#aaa' }
            }),
            () => {
                const body = Bodies.circle(rel(0.26, 0.09).x, rel(0.09, 0.09).y, 20, {
                    restitution: 0.5,
                    render: { fillStyle: '#f00' }
                });
                body.damage = [50, 50];
                return body;
            },
            () => Bodies.circle(rel(0.29, 0.09).x, rel(0.09, 0.09).y, 25, {
                restitution: 0.9,
                render: { fillStyle: '#0af' }
            }),
            () => Matter.Bodies.fromVertices(rel(0.21, 0.09).x, rel(0.09, 0.09).y, customShapes.Bizeau, {
                isStatic: false,
                render: { fillStyle: '#f55' }
            }),
            () => Matter.Bodies.fromVertices(rel(0.21, 0.09).x, rel(0.09, 0.09).y, customShapes.ArrasShape, {
                isStatic: false,
                render: { fillStyle: '#f55' },
                size: {x: 50, y: 50},
                density: 0.01
            })
        ]
    },    

    "Test2": {
        enableDoubleJump: true,
        developerMode: true,
        name: "Challenge Begins - Fixed",
        //light: 0.5, //cool effect lel
        spawn: rel(0.05, 0.75),
        gravityY: 1.5,
        voidY: 1100,
        bodies: [
    
            // === SOL PRINCIPAL ===
            () => Bodies.rectangle(relX(0.5), relY(1) - 50, WORLD_WIDTH, 100, {
                isStatic: true,
                friction: 0,
                restitution: 0.5,
                render: { fillStyle: '#666' }
            }),
    
            // === PLATEFORME DE SAUT DE DÉPART ===
            () => Bodies.rectangle(relX(0.2), relY(0.75), 200, 20, {
                isStatic: true,
                render: { fillStyle: '#888' }
            }),
    
            // === OBSTACLE MORTEL À SAUTER ===
            () => {
                const killer = Bodies.rectangle(relX(0.3), relY(0.75) - 35, 40, 40, {
                    isStatic: true,
                    render: { fillStyle: '#f00' }
                });
                killer.damage = 50;
                return killer;
            },
    
            // === 🪵 BALANCE STABILISÉE ===
            () => {
                const group = Body.nextGroup(true); // collision désactivée entre planche et pivot
            
                const x = relX(0.3);
                const y = relY(0.65);
            
                const plank = Bodies.rectangle(x, y, 200, 20, {
                    collisionFilter: { group },
                    friction: 0.6,
                    density: 0.002,
                    render: { fillStyle: '#c96' }
                });
            
                const pivot = Bodies.circle(x, y, 5, {
                    isStatic: true,
                    collisionFilter: { group },
                    render: { visible: false }
                });
            
                const constraint = Constraint.create({
                    bodyA: plank,
                    pointA: { x: 0, y: 0 },
                    bodyB: pivot,
                    pointB: { x: 0, y: 0 },
                    stiffness: 1,
                    length: 0
                });
            
                Composite.add(world, [pivot, constraint]);
                return plank;
            },
    
            // === 🌉 PONT SUSPENDU MOU & ALIGNÉ ===
            () => {
                var group = Body.nextGroup(true);
                var bridge = Composites.stack(160, 290, 15, 1, 0, 0, function(x, y) {
                    return Bodies.rectangle(x - 20, y, 53, 20, { 
                        collisionFilter: { group: group },
                        chamfer: 5,
                        density: 0.005,
                        frictionAir: 0.05,
                        render: {
                            fillStyle: '#060a19'
                        }
                    });
                });
                
                Composites.chain(bridge, 0.3, 0, -0.3, 0, { 
                    stiffness: 0.99,
                    length: 0.0001,
                    render: {
                        visible: false
                    }
                });
                var stack = Composites.stack(250, 50, 6, 3, 0, 0, function(x, y) {
                    return Bodies.rectangle(x, y, 50, 50, {
                        restitution: 1,
                        //chamfer: { radius: 20 }
                    });
                });
                /*
                                var stack = Composites.stack(250, 50, 6, 3, 0, 0, function(x, y) {
                    return Bodies.circle(x, y, 30, {
                        restitution: 0.75
                    });
                });*/
                var s = Bodies.rectangle(770, 490, 220, 380, { 
                    isStatic: false, 
                    chamfer: { radius: 20 },
                    density: 1
                });
                Composite.add(world, s)
                Composite.add(world, [
                    bridge,
                    stack,
                    Bodies.rectangle(30, 490, 220, 380, { 
                        isStatic: true, 
                        chamfer: { radius: 200 }
                    }),
                    /*Bodies.rectangle(770, 490, 220, 380, { 
                        isStatic: true, 
                        chamfer: { radius: 20 }
                    }),*/
                    Constraint.create({ 
                        pointA: { x: 140, y: 300 }, 
                        bodyB: bridge.bodies[0], 
                        pointB: { x: -25, y: 0 },
                        length: 2,
                        stiffness: 0.9
                    }),
                    Constraint.create({ 
                        bodyA: s,
                        pointA: { x: -100, y: -190 }, 
                        bodyB: bridge.bodies[bridge.bodies.length - 1], 
                        pointB: { x: 25, y: 0 },
                        length: 2,
                        stiffness: 0.9
                    })
                ])
              },
              
              
              
              () => {//coprs mou
                const cols = 6;
                const rows = 6;
                const spacing = 30;
                const softBody = [];
            
                const offsetX = 1600;
                const offsetY = 100;
            
                // Créer les points de masse (petits cercles)
                for (let y = 0; y < rows; y++) {
                  for (let x = 0; x < cols; x++) {
                    const circle = Bodies.circle(offsetX + x * spacing, offsetY + y * spacing, 10, {
                      collisionFilter: { group: -1 }, // pour éviter les collisions internes
                      render: { fillStyle: '#3498db', opacity: 0 }//pour éviter de voir les ronds
                    });
                    softBody.push(circle);
                  }
                }
            
                // Ajouter les corps au monde
                Composite.add(world, softBody);
            
                // Relier les points avec des contraintes ressort
                for (let y = 0; y < rows; y++) {
                  for (let x = 0; x < cols; x++) {
                    const idx = y * cols + x;
            
                    // Horizontal
                    if (x < cols - 1) {
                      const right = idx + 1;
                      Composite.add(world, Constraint.create({
                        bodyA: softBody[idx],
                        bodyB: softBody[right],
                        stiffness: 0.85,//combien le soft body résiste
                        damping: 0.1,
                        length: spacing
                      }));
                    }
            
                    // Vertical
                    if (y < rows - 1) {
                      const below = idx + cols;
                      Composite.add(world, Constraint.create({
                        bodyA: softBody[idx],
                        bodyB: softBody[below],
                        stiffness: 0.2,
                        damping: 0.1,
                        length: spacing
                      }));
                    }
            
                    // Diagonale (optionnel)
                    if (x < cols - 1 && y < rows - 1) {
                      const diag1 = idx + cols + 1;
                      Composite.add(world, Constraint.create({
                        bodyA: softBody[idx],
                        bodyB: softBody[diag1],
                        stiffness: 0.2,
                        damping: 0.1,
                        length: Math.sqrt(spacing ** 2 * 2)
                      }));
                    }
            
                    if (x > 0 && y < rows - 1) {
                      const diag2 = idx + cols - 1;
                      Composite.add(world, Constraint.create({
                        bodyA: softBody[idx],
                        bodyB: softBody[diag2],
                        stiffness: 0.2,
                        damping: 0.1,
                        length: Math.sqrt(spacing ** 2 * 2)
                      }));
                    }
                  }
                }            
              },
            
            
            
            
    
            // === 🌀 Triangle SUSPENDU STABILISÉ ===
            () => {
                var body = Bodies.polygon(280, 450, 3, 30);

                var constraint = Constraint.create({
                    pointA: { x: 280, y: 430 },
                    bodyB: body,
                    pointB: { x: -10, y: -7 },
                    stiffness: 0.0005
                });
            
                Composite.add(world, [body, constraint]);
            },
            
            () => {
                var body = Bodies.polygon(1600, 750, 4, 30, {
                    frictionAir: 0,
                    restitution: 2
                });

                var constraint = Constraint.create({
                    pointA: { x: 1600, y: 600 },
                    bodyB: body,
                    pointB: { x: -10, y: -7 },
                    stiffness: 1
                });
            
                Composite.add(world, [body, constraint]);
            },
            
            
        ]
    },





    // Niveau sans rien
    "MainMenu": {
        showHealthBar: false,
        bodies: []
    },
    "Dead": {
      showHealthBar: false,
      bodies: []
    }
    
    
    
    
    
};

//Changer les défauts des valeurs dans initLevel() pas ici
var showHealthBar = true;

var jumpForce = 0.1;
var jumpCooldownTime = 10; // nombre de ticks à attendre entre sauts (~166ms si 60fps)
var moveForce = 0.002;
var airUpForce = 0.0025;
var downForce = 0.0025;
var doesCenterViewOnBall = true;
var diesOffScreenPixels = -1;
var voidY = 1000

let ball; // déclaration globale
var ballHealth = 100;
var ballMaxHealth = 100;
var healthRegen = 0.075

let isOnGround = false;

let hasDoubleJumped = false;
//Abilities

let wallClimbEnabled = false; //celle ci pour le walljumping
let enableDoubleJump = false; // variable globale pour activer/désactiver le double jump

const baseDensity = 0.00105; // masse de base

const groundContactSet = new Set();

function initLevel(levelId) {
    groundContactSet.clear();
    hasDoubleJumped = false;
    updateCanJump();
    lightOfScene = 0
    updateRenderView();
    currentLevelId = levelId;
    const level = levels[levelId];
    if (!level) {
        console.error(`Le niveau ${levelId} n'existe pas.`);
        return;
    }
    if (level == undefined) return;
    // Nettoyage complet du monde (mais pas du moteur lui-même)
    Composite.clear(engine.world, false);
    // Reset variables de gameplay
    //groundContacts = 0;
    canJump = false;
    dynamicKillers.length = 0;
    portals.length = 0;
    //Light
    if (level.speedOfLightTranstition != undefined) {
        lightTransitionSpeed = level.speedOfLightTranstition
    }
    if (level.light != undefined) {
        setTargetLight(level.light)
    }

    // Réglage de la gravité du moteur selon le niveau
    engine.gravity.y = level.gravityY ?? 1.5;
    engine.gravity.x = level.gravityX ?? 0;
    if (level.spawn != undefined) {
        var spawnX = level.spawn.x;
        var spawnY = level.spawn.y;
    }
    // Création de la balle au point de spawn
    ball = Bodies.circle(spawnX, spawnY, 30, {
        restitution: level.ballRestitution ?? 0.5,
        friction: level.ballFriction ?? 0,
        frictionAir: level.frictionAir ?? 0.001,
        density: level.ballDensity ?? 0.00105, // 0.001 default density, also change const baseDensity
        render: { fillStyle: '#4cf' },
        label: "Ball"
    });
    Composite.add(world, ball);
    Body.setDensity(ball, baseDensity);
    //health bar
    showHealthBar = level.showHealthBar ?? true
    //dev mode

    if (level.developerMode != undefined) {
        developerMode = level.developerMode
    };
    if (developerMode) {
        Composite.add(world, mouseConstraint);
    } else {
        Composite.remove(world, mouseConstraint);
    }
    
    // Réglages spécifiques (sauts, forces, etc.) selon le niveau
    jumpForce = level.jumpForce ?? 0.1;
    jumpCooldownTime = level.jumpCooldownTime ?? 10;
    moveForce = level.moveForce ?? 0.002;
    airUpForce = level.airUpForce ?? 0.0025;
    downForce = level.downForce ?? 0.0025;
    doesCenterViewOnBall = level.doesCenterViewOnBall ?? true;
    diesOffScreenPixels = level.diesOffScreenPixels ?? -1;
    voidY = level.voidY ?? 1000;
    ballHealth = level.ballHealth ?? 100;
    ballMaxHealth = level.ballMaxHealth ?? 100;
    healthRegen = level.healthRegen ?? 0.075;
    enableDoubleJump = level.enableDoubleJump ?? false;
    wallClimbEnabled = level.wallClimbEnabled ?? false;
    // Ajout des autres corps (static/dynamiques) du niveau
    level.bodies.forEach(createFn => {
        const body = createFn(); // Appelle la fonction pour créer un NOUVEL objet
        if (!body) return;
        Composite.add(world, body);
        if (body.size) {
            Body.scale(body, body.size.x, body.size.y);
        }
        /*if (body.trueDensity) {
            Body.setDensity(body, body.trueDensity)
        }
        if (body.trueMass) {
            Body.setMass(body, body.trueMass)
        }*/
        if (body.damage !== undefined) {
          /*let realBodyDamage;
        
          // Si damage est un tableau [valeur, variation], on le garde tel quel
          if (Array.isArray(body.damage)) {
            realBodyDamage = body.damage;
          } else {
            // Sinon, on le reformate en [valeur, 0]
            realBodyDamage = [body.damage, 0];
          }*/

          normalizeDamageFormat(body);

          if (body.damage[0] > 0) {
            dynamicKillers.push(body);
            body.render.strokeStyle = "#fff"; // getOppositeColor(body.render.fillStyle);
            body.render.lineWidth = 3;
          }
        }
        
      
        if (typeof body.nextLevel !== 'undefined') {
          portals.push(body);
        }
      });
      
}

var currentGameState = 1;
var levelBeforeDeath = 1;
var gameStateBeforeDeath = 1;
function death() {
    levelBeforeDeath = currentLevelId
    gameStateBeforeDeath = currentGameState
    initLevel("Dead")
    currentGameState = "Dead";
    makeDialogue({
      1: "It looks like you died..",
      2: {
        text: "What do you want to do?",
        choices: [
          {text: "%Respawn%", callback: () => {
            initLevel(levelBeforeDeath)
            currentGameState = gameStateBeforeDeath
          }},
          {text: "Go Back To Main Menu", callback: () => {
            loadGameState(1);
          }}
        ]
      }
    })
}








document.addEventListener('keydown', event => {
    if (event.code in keys) {
        keys[event.code] = true;
    }
});

document.addEventListener('keyup', event => {
    if (event.code in keys) {
        keys[event.code] = false;
    }
});
/*document.addEventListener('keydown', event => {
    if (event.code === 'ArrowUp' && canJump) {
        Body.applyForce(ball, ball.position, { x: 0, y: -jumpForce });
        canJump = false;
    }
});*/
// Collision entre la balle et les sols


const damageNumbers = [];

const criticalHitPurcentage = 0.6

function makeDamageNumber(amount, x, y) {
  const isCritical = amount > ballMaxHealth * criticalHitPurcentage;
  const color = isCritical ? "red" : "orange";

  const velocity = {
    x: (Math.random() - 0.5) * 1.5, // Léger mouvement gauche/droite
    y: -(Math.random() * 1.5 + 1),  // Toujours vers le haut
  };

  damageNumbers.push({
    x,
    y,
    vx: velocity.x,
    vy: velocity.y,
    alpha: 1,
    color,
    amount,
    gravity: 0.05,
    fadeRate: 0.02,
    font: "20px Arial"
  });
}

function updateDamageNumbers() {

  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const dmg = damageNumbers[i];

    // Mise à jour de la position
    dmg.x += dmg.vx;
    dmg.y += dmg.vy;
    dmg.vy += dmg.gravity;

    // Diminution de l'alpha
    dmg.alpha -= dmg.fadeRate;

    // Dessin
    ctx.save();
    ctx.globalAlpha = Math.max(dmg.alpha, 0);
    ctx.fillStyle = dmg.color;
    ctx.font = dmg.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dmg.amount, dmg.x, dmg.y);
    ctx.restore();

    // Suppression si invisible
    if (dmg.alpha <= 0) {
      damageNumbers.splice(i, 1);
    }
  }
}



function updateCanJump() {
  canJump = isOnGround;
}


/*function debugGroundContacts() {
  console.log("Ground contacts:", [...groundContactSet]);
  console.log("canJump:", canJump);
}*/


Events.on(engine, 'collisionStart', event => {
  for (let pair of event.pairs) {
    const { bodyA, bodyB, collision } = pair;

    const isBall = bodyA === ball || bodyB === ball;
    if (!isBall) continue;

    const other = bodyA === ball ? bodyB : bodyA;

    // === Détection du sol ===
    const actualNormal = { ...collision.normal }; // Pas d'inversion nécessaire

    const isGround = wallClimbEnabled || isSurfaceGroundLike(actualNormal);

    if (isGround) {
      isOnGround = true;
      hasDoubleJumped = false;
      groundContactSet.add(pair.id);
      updateCanJump();
      //debugGroundContacts();
    }

    // === Collision avec objet mortel ===
    if (dynamicKillers.includes(other)) {
      let finalDamage = 0;
      if (Array.isArray(other.damage)) {
        let [base, variance] = other.damage;
        let min = base - variance;
        let max = base + variance;
        finalDamage = Math.floor(Math.random() * (max - min + 1)) + min;
      } else {
        finalDamage = other.damage ?? 0;
      }

      ballHealth -= finalDamage;

      const screenPos = worldToScreen(ball.position, render);
      makeDamageNumber(finalDamage, screenPos.x, screenPos.y);
    }

    // === Collision avec portail ===
    if (portals.includes(other) && other.nextLevel !== undefined) {
      initLevel(other.nextLevel);
    }
  }
});




Events.on(engine, 'collisionEnd', event => {
  for (let pair of event.pairs) {
    const { bodyA, bodyB } = pair;

    const isBall = bodyA === ball || bodyB === ball;
    if (!isBall) continue;
    isOnGround = false;
    groundContactSet.delete(pair.id);
    updateCanJump();
    //debugGroundContacts();
  }
});





//let groundContacts = 0;



let heavyMode = false;
const heavyMultiplier = 7.5;


function jump(force, moveFactor) {
  Body.applyForce(ball, ball.position, { x: 0, y: -force * moveFactor });
  jumpCooldown = jumpCooldownTime;
}


let jumpPressed = false;          // Pour détecter le premier appui
let doubleJumpPressed = false;    // Pour détecter si la touche a été relâchée après le 1er saut

// Appliquer les forces à chaque tick
Events.on(engine, 'beforeUpdate', () => {

  //Death if damage

    if (ballHealth <= 0) {
      death();
    } else {//Regen
      if (ballHealth < ballMaxHealth) {
        if ((ballHealth + healthRegen) > ballMaxHealth) {
          ballHealth = ballMaxHealth //pour éviter les 100.999999
        } else {
        ballHealth += healthRegen
        }
      }
    }
    ball.render.opacity = (ballHealth / ballMaxHealth)
    //canJump = groundContacts > 0;
    //updateCanJump()
    // Gestion du heavy mode (Espace)
    if (keys.Space && !heavyMode && canMove) {
        Body.setDensity(ball, baseDensity * heavyMultiplier);
        ball.render.strokeStyle = '#fff';
        ball.render.lineWidth = 5;
        heavyMode = true;
    } else if (!keys.Space && heavyMode && canMove) {
        Body.setDensity(ball, baseDensity);
        ball.render.strokeStyle = null;
        ball.render.lineWidth = 0;
        heavyMode = false;
    }

    const moveFactor = heavyMode ? 1 / heavyMultiplier : 1;

    if (jumpCooldown > 0) {
        jumpCooldown--;
    }

    // Saut automatique si on maintient la touche et que le cooldown est écoulé
    if (keys.ArrowUp && jumpCooldown === 0 && canMove) {
      if (!jumpPressed) {
        if (canJump) {
          jump(jumpForce, moveFactor);
          canJump = false;
          isOnGround = false;
          hasDoubleJumped = false;
          jumpPressed = true;
          doubleJumpPressed = false;  // on remet à false car on vient de sauter
        } else if (enableDoubleJump && !hasDoubleJumped && doubleJumpPressed) {
          jump(jumpForce, moveFactor);
          hasDoubleJumped = true;
          jumpPressed = true;
        }
      }
    } else {
      if (!keys.ArrowUp) {
        // Touche relâchée
        jumpPressed = false;
        doubleJumpPressed = true;  // On autorise le double saut au prochain appui
      }
    }
    

    // Mouvements avec facteur ajusté
    if (keys.ArrowLeft && canMove) {
        Body.applyForce(ball, ball.position, { x: -moveForce * moveFactor, y: 0 });
    }
    if (keys.ArrowRight && canMove) {
        Body.applyForce(ball, ball.position, { x: moveForce * moveFactor, y: 0 });
    }
    if (keys.ArrowUp && !canJump && canMove) {
        Body.applyForce(ball, ball.position, { x: 0, y: -airUpForce * moveFactor });
    }
    if (keys.ArrowDown && canMove) {
        Body.applyForce(ball, ball.position, { x: 0, y: downForce * moveFactor });
    }

    // Mort hors écran
    if (diesOffScreenPixels >= 0) {
    const margin = diesOffScreenPixels;
    if (ball.position != undefined)  {
        var x = ball.position.x;
        var y = ball.position.y;
    }

    if (
        x < -margin || x > render.canvas.width + margin ||
        y < -margin || y > render.canvas.height + margin
    ) {
        death();
    }
    }
    if (voidY) {
        const y = ball.position.y;
        if (y >= voidY && y != undefined) {
            death();
        }
    }
});

Events.on(engine, 'afterUpdate', () => {
    if (doesCenterViewOnBall = true) {
    if (!ball) return;

    const centerX = ball.position.x;
    const centerY = ball.position.y;

    const viewWidth = render.bounds.max.x - render.bounds.min.x;
    const viewHeight = render.bounds.max.y - render.bounds.min.y;

    render.bounds.min.x = centerX - viewWidth / 2;
    render.bounds.min.y = centerY - viewHeight / 2;
    render.bounds.max.x = centerX + viewWidth / 2;
    render.bounds.max.y = centerY + viewHeight / 2;
    }
});








/* example:
            makeDialogue(
                {
                  1: {
                    text: "Ceci est une intro.",
                    font: "bold 22px Arial",
                    color: "#fff"
                  },
                  2: {
                    text: "Chaque ligne a son propre style !",
                    font: "italic 20px 'Courier New'",
                    color: "#ff00ff"
                  },
                  3: {
                    text: "Et à la fin, on continue l'histoire.",
                    font: "20px Georgia",
                    color: "#00ff00"
                  }
                },
                () => {//à la fin du dialogue:
                  loadGameState(2)
                }
              );

              (showDialogue est la version "light" si l'on puis dire)
*/

/*

            showDialogue("Once Upon A Time", () => {
                loadGameState(2)
            })
            
            */


            /*
                        makeDialogue({
                1: "Bienvenue dans le jeu !",
                2: {
                  text: "Que veux-tu faire ?",
                  choices: [
                    { text: "Commencer l'aventure", callback: () => console.log("Aventure") },
                    { text: "Regarder les options", callback: () => console.log("Options") },
                    { text: "Quitter", callback: () => console.log("Quitter") }
                  ]
                },
                3: "Bonne chance !"
              }, () => {
                console.log("Dialogue terminé");
              });  */

//const healthBarFreeSpace = 100
/*let gameOverFonts = ["'Arial Black'","Impact","Georgia","'Courier New'","Arial"]
function getRandomGameOverFont() {
  return gameOverFonts[Math.floor(Math.random() * gameOverFonts.length + 1)]
} */
Matter.Events.on(render, 'afterRender', function() {

  if (currentGameState == "Dead") {
    drawText("Game Over", window.innerWidth / 2, window.innerHeight / 2, "red", "72px 'Arial Black'");
  }



  // Transition vers la lumière cible
  if (Math.abs(lightOfScene - targetLightLevel) > 0.001) {
    if (lightOfScene < targetLightLevel) {
        lightOfScene += lightTransitionSpeed;
    } else {
        lightOfScene -= lightTransitionSpeed;
    }
    // Clamp pour éviter de dépasser
    lightOfScene = Math.max(0, Math.min(1, lightOfScene));
  }

  lightOfSceneFunction(lightOfScene);
  // ==Barre de vie==
  //drawHealthBar(ballHealth, ballMaxHealth, ctx, healthBarFreeSpace, window.innerHeight - 10, window.innerWidth - healthBarFreeSpace * 2, 10)
  if (showHealthBar == true) {
    drawText(Math.round(ballHealth/* * 100*/)/* / 100*/, (Math.min(ballMaxHealth, 250) / 2) + 10, 40, "white")
    drawHealthBar(ballHealth, ballMaxHealth, ctx, 10, 50, Math.min(ballMaxHealth, 250)/* plus tu as de vie max plus la barre est grande */, 10)
  }

  // == Damage Numbers //
  updateDamageNumbers()
});

  
function loadGameState(stateId) {
    currentGameState = stateId;
    console.log(stateId);
    switch(stateId) {
        /// == Cinématique du début == ///
        case 1:
            initLevel("MainMenu")
            render.options.background = "#000"       
            makeDialogue({
              1: "Greetings.",
              2: {
                text: "I am %The Great Simulator%, your computer. What do you want to do?",
                choices: [
                  {
                    text: "%Start% a New Simulation",
                    callback: () => {
                      showDialogue("This is Coming Soon.");
                    }
                  },
                  {
                    text: "%Load% a Simulation",
                    callback: () => {
                      showDialogue({
                        text: "Enter the name of the simulation to load:",
                        input: true,
                        placeholder: "<Game State ID>"
                      }, (playerInput) => {
                        // Action après avoir saisi l'input
                        //showDialogue(`Loading %${playerInput}%...`, () => {
                          loadGameState(stringToNumberIfDigitsOnly(playerInput));
                        //});
                      });
                    }
                  },
                  {
                    text: "Go in %Test% Level",
                    callback: () => {
                      showDialogue("Once upon a time...", () => {
                        loadGameState(2);
                      });
                    }
                  }
                ]
              }
            });
            
        break;
        case 2://Test
            initLevel("Test")
        break;
        default:
            showDialogue("This Level Doesn't Exist. Bringing You Back To The Simulation Realms", () => {
              loadGameState(1)
            })
        break;
    }
}
loadGameState(currentGameState)