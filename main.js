
const WORLD_WIDTH = 1920;
const WORLD_HEIGHT = 1080;

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
        spawn: rel(0.05, 0.1), // ≈ (96, 108)
        gravityY: 1.5,
        ballRestitution: 0.75,
        frictionAir: 0.001,
        bodies: [
            () => Bodies.rectangle(rel(0.21, 0.46).x, rel(0.46, 0.46).y, 300, 20, {
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
                body.doesKill = true;
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
                body.doesKill = true;
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
                body.doesKill = true;
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
        name: "Challenge Begins - Fixed",
        spawn: rel(0.05, 0.75),
        gravityY: 1.5,
        voidY: 1100,
        bodies: [
    
            // === SOL PRINCIPAL ===
            () => Bodies.rectangle(relX(0.5), relY(1) - 50, WORLD_WIDTH, 100, {
                isStatic: true,
                friction: 0,
                restitution: 0,
                render: { fillStyle: '#666' }
            }),
    
            // === PLATEFORME DE SAUT DE DÉPART ===
            () => Bodies.rectangle(relX(0.2), relY(0.65), 200, 20, {
                isStatic: true,
                render: { fillStyle: '#888' }
            }),
    
            // === OBSTACLE MORTEL À SAUTER ===
            () => {
                const killer = Bodies.rectangle(relX(0.3), relY(0.75) - 35, 40, 40, {
                    isStatic: true,
                    render: { fillStyle: '#f00' }
                });
                killer.doesKill = true;
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
                    return Bodies.rectangle(x, y, 50, 50, 30);
                });
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
                        chamfer: { radius: 20 }
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
        restitution: level.ballRestitution ?? 0.75,
        friction: level.ballFriction ?? 0,
        frictionAir: level.frictionAir ?? 0.001,
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
        if (body.doesKill) {
          dynamicKillers.push(body);
          body.render.strokeStyle = "#fff"//getOppositeColor(body.render.fillStyle);
          body.render.lineWidth = 3;
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
        ball.render.lineWidth = 5;
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

initLevel("Test2")


