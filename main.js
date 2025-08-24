

const WORLD_WIDTH = 1920;
const WORLD_HEIGHT = 1080;



const customShapes = {
    "Bizeau": [ 
        {x: 0, y: 0},
        {x: 100, y: 0},
        {x: 100, y: 20},
        {x: 0, y: 50}
    ]
}
  
  
  
// Import des modules de Matter.js
const {
    Engine,
    Render,
    Runner,
    Bodies,
    Composite,
    Body,
    Events,
    Mouse,
    MouseConstraint
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

const mouse = Mouse.create(render.canvas);

Matter.Common.setDecomp(decomp); // le truc qui permet d'utiliser fromVertices()

function updateRenderView() {
    const canvasW = window.innerWidth;
    const canvasH = window.innerHeight;

    // Définir une vue du monde (logique) centrée autour de (0,0)
    let worldX = 0;
    let worldY = 0;

    // Taille fixe du monde logique
    const viewWidth = WORLD_WIDTH;
    const viewHeight = WORLD_HEIGHT;

    // Calcule le facteur de zoom (scale) pour adapter le monde au canvas
    const scaleX = canvasW / viewWidth;
    const scaleY = canvasH / viewHeight;
    const scale = Math.min(scaleX, scaleY); // pour contenir tout le monde dans le canvas

    const scaledWidth = viewWidth * scale;
    const scaledHeight = viewHeight * scale;

    // Centrage
    const offsetX = (canvasW - scaledWidth) / 2;
    const offsetY = (canvasH - scaledHeight) / 2;

    // Définir les limites de rendu selon le monde logique
    render.bounds.min.x = 0;
    render.bounds.min.y = 0;
    render.bounds.max.x = viewWidth;
    render.bounds.max.y = viewHeight;

    render.canvas.width = canvasW;
    render.canvas.height = canvasH;

    render.options.width = canvasW;
    render.options.height = canvasH;

    // Appliquer la transformation de rendu (zoom + centrage)
    const context = render.context;
    context.setTransform(
        scale, 0,    // scaleX, skewX
        0, scale,    // skewY, scaleY
        offsetX, offsetY // translateX, translateY
    );
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
        console.log(`🛠️ Mode développeur : ${developerMode ? 'activé' : 'désactivé'}`);
        
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


let currentLevelId = 1; // valeur par défaut
const dynamicKillers = [];
const portals = [];

// ===LEVELS=== //

const levels = {
    "Test": {
        spawn: { x: 100, y: 100 },
        gravityY: 1.5,
        ballRestitution: 0.5,
        bodies: [
          () => Bodies.rectangle(400, 500, 300, 20, {
            isStatic: true,
            render: { fillStyle: '#888' }
          }),
          () => Bodies.rectangle(window.innerWidth / 2, window.innerHeight - 50, window.innerWidth, 100, {
            isStatic: true,
            friction: 0,
            restitution: 0,
            render: { fillStyle: '#888' }
          }),
          () => {
            const body = Bodies.rectangle(600, 450, 50, 50, {
              isStatic: true,
              render: { fillStyle: '#000' }
            });
            body.doesKill = true;
            return body;
          },
          () => {
            const portal = Bodies.rectangle(750, 350, 40, 40, {
              isStatic: true,
              isSensor: true,
              render: { fillStyle: '#0f0' },
              collisionFilter: { group: COLLISION_GROUP_PORTAL }
            });
            portal.nextLevel = "Test2";
            return portal;
          },
          () => {
            const body = Bodies.rectangle(200, 300, 40, 40, {
              restitution: 0.5,
              render: { fillStyle: '#f55' }
            });
            body.doesKill = true;
            return body;
          },
          () => Bodies.rectangle(300, 300, 60, 60, {
            restitution: 0.5,
            render: { fillStyle: '#aaa' }
          }),
          () => {
            const body = Bodies.circle(500, 100, 20, {
              restitution: 0.5,
              render: { fillStyle: '#f00' }
            });
            body.doesKill = true;
            return body;
          },
          () => Bodies.circle(550, 100, 25, {
            restitution: 0.9,
            render: { fillStyle: '#0af' }
          }),
          () => Matter.Bodies.fromVertices(400, 100, customShapes.Bizeau, {
            isStatic: false,
            render: { fillStyle: '#f55' }
          })
        ]
      },

    1: {
        name: "Welcome To The Game!",
        spawn: {x: 100, y:300},
        gravityY: 1.5,
        bodies:[
            () => Bodies.rectangle(window.innerWidth / 2, window.innerHeight - 50, window.innerWidth, 100, {
                isStatic: true,
                friction: 0,     // glissant
                restitution: 0, // léger rebond (optionnel)
                render: { fillStyle: '#888' }
            })
        ]
    }
};

//Changer les défauts des valeurs dans initLevel() pas ici

var jumpForce = 0.03;
var jumpCooldownTime = 10; // nombre de ticks à attendre entre sauts (~166ms si 60fps)
var moveForce = 0.00125;
var airUpForce = 0.0025;
var downForce = 0.0025;
var doesCenterViewOnBall = true;
var diesOffScreenPixels = -1;
var voidY = 1000

let ball; // déclaration globale
const baseDensity = 0.001; // masse de base
function initLevel(levelId) {
    currentLevelId = levelId;
    const level = levels[levelId];
    if (!level) {
        console.error(`Le niveau ${levelId} n'existe pas.`);
        return;
    }

    // Nettoyage complet du monde (mais pas du moteur lui-même)
    Composite.clear(engine.world, false);

    // Reset variables de gameplay
    groundContacts = 0;
    canJump = false;
    dynamicKillers.length = 0;
    portals.length = 0;

    // Réglage de la gravité du moteur selon le niveau
    engine.gravity.y = level.gravityY ?? 1.5;
    engine.gravity.x = level.gravityX ?? 0;

    // Création de la balle au point de spawn
    ball = Bodies.circle(level.spawn.x, level.spawn.y, 30, {
        restitution: level.ballRestitution ?? 0.5,
        friction: 0,
        frictionAir: 0.001,
        render: { fillStyle: '#4cf' }
    });
    Composite.add(world, ball);
    Body.setDensity(ball, baseDensity);

    // Réglages spécifiques (sauts, forces, etc.) selon le niveau
    jumpForce = level.jumpForce ?? 0.03;
    jumpCooldownTime = level.jumpCooldownTime ?? 10;
    moveForce = level.moveForce ?? 0.00125;
    airUpForce = level.airUpForce ?? 0.0025;
    downForce = level.downForce ?? 0.0025;
    doesCenterViewOnBall = level.doesCenterViewOnBall ?? true;
    diesOffScreenPixels = level.diesOffScreenPixels ?? -1;
    voidY = level.voidY ?? 1000;

    // Ajout des autres corps (static/dynamiques) du niveau
    level.bodies.forEach(createFn => {
        const body = createFn(); // Appelle la fonction pour créer un NOUVEL objet
        
        Composite.add(world, body);
      
        if (body.doesKill) {
          dynamicKillers.push(body);
        }
      
        if (typeof body.nextLevel !== 'undefined') {
          portals.push(body);
        }
      });
      
}


function death() {
    console.log('🪦 Mort : réinitialisation du niveau');
    initLevel(currentLevelId);
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
document.addEventListener('keydown', event => {
    if (event.code === 'ArrowUp' && canJump) {
        Body.applyForce(ball, ball.position, { x: 0, y: -jumpForce });
        canJump = false;
    }
});
// Collision entre la balle et les sols
Events.on(engine, 'collisionStart', event => {
    for (let pair of event.pairs) {
        const { bodyA, bodyB } = pair;

        const isBall = bodyA === ball || bodyB === ball;
        const other = bodyA === ball ? bodyB : bodyA;

        if (isBall) {
            //if (other.isStatic) {
                groundContacts++;
            //}

            // Collision avec objet mortel
            if (dynamicKillers.includes(other)) {
                death();
            }

            // Collision avec portail
            if (portals.includes(other) && other.nextLevel !== undefined) {
                initLevel(other.nextLevel);
            }
        }
    }
});


Events.on(engine, 'collisionEnd', event => {
    for (let pair of event.pairs) {
        const { bodyA, bodyB } = pair;

        const isBall = bodyA === ball || bodyB === ball;
        //const isStatic = bodyA.isStatic || bodyB.isStatic;

        if (isBall/* && isStatic*/) {
            groundContacts = Math.max(groundContacts - 1, 0);
        }
    }
});




let groundContacts = 0;
let canJump = false;
let jumpCooldown = 0; // pour limiter la fréquence des sauts

let heavyMode = false;
const heavyMultiplier = 3;

// Appliquer les forces à chaque tick
Events.on(engine, 'beforeUpdate', () => {
    canJump = groundContacts > 0;

    // Gestion du heavy mode (Espace)
    if (keys.Space && !heavyMode) {
        Body.setDensity(ball, baseDensity * heavyMultiplier);
        ball.render.strokeStyle = '#fff';
        ball.render.lineWidth = 3;
        heavyMode = true;
    } else if (!keys.Space && heavyMode) {
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
    if (keys.ArrowUp && canJump && jumpCooldown === 0) {
        Body.applyForce(ball, ball.position, { x: 0, y: -jumpForce * moveFactor });
        jumpCooldown = jumpCooldownTime;
        canJump = false;
    }

    // Mouvements avec facteur ajusté
    if (keys.ArrowLeft) {
        Body.applyForce(ball, ball.position, { x: -moveForce * moveFactor, y: 0 });
    }
    if (keys.ArrowRight) {
        Body.applyForce(ball, ball.position, { x: moveForce * moveFactor, y: 0 });
    }
    if (keys.ArrowUp && !canJump) {
        Body.applyForce(ball, ball.position, { x: 0, y: -airUpForce * moveFactor });
    }
    if (keys.ArrowDown) {
        Body.applyForce(ball, ball.position, { x: 0, y: downForce * moveFactor });
    }

    // Mort hors écran
    if (diesOffScreenPixels >= 0) {
    const margin = diesOffScreenPixels;
    const x = ball.position.x;
    const y = ball.position.y;

    if (
        x < -margin || x > render.canvas.width + margin ||
        y < -margin || y > render.canvas.height + margin
    ) {
        death();
    }
    }
    if (voidY) {
        const y = ball.position.y;
        if (y >= voidY) {
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

initLevel(1)

