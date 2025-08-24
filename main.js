

// Import des modules de Matter.js
const {
    Engine,
    Render,
    Runner,
    Bodies,
    Composite,
    Body,
    Events
} = Matter;

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
        background: '#222'
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);

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

const jumpForce = 0.03;
const jumpCooldownTime = 10; // nombre de ticks à attendre entre sauts (~166ms si 60fps)
const moveForce = 0.00125;
const airUpForce = 0.0025;
const downForce = 0.0025;

let currentLevelId = 1; // valeur par défaut
const dynamicKillers = [];
const portals = [];

// ===LEVELS=== //

const levels = {
    "Test": {//Test
        spawnX: 100,
        spawnY: 100,
        gravityY: 1.5,
        ballRestitution: 0.5,
        objects: [
            { type: 'platform', x: 400, y: 500, width: 300, height: 20 },
            { type: 'killer', x: 600, y: 450, width: 50, height: 50 },
    
            { type: 'portal', x: 750, y: 350, width: 40, height: 40, nextLevel: "Test2" },
    
            // ➕ Cube qui tue
            { type: 'cube', x: 200, y: 300, width: 40, height: 40, doesKill: true, renderColor: '#f55' },
    
            // ➕ Cube inoffensif
            { type: 'cube', x: 300, y: 300, width: 60, height: 60 },
    
            // ➕ Balle tueuse
            { type: 'circle', x: 500, y: 100, radius: 20, doesKill: true, renderColor: '#f00' },
    
            // ➕ Balle rebondissante inoffensive
            { type: 'circle', x: 550, y: 100, radius: 25, restitution: 0.9, renderColor: '#0af' }
        ]
    },
    "Test2": {
        spawnX: 50,
        spawnY: 50,
        gravityY: 2.0,
        ballRestitution: 0.2,
        objects: [
            { type: 'platform', x: 300, y: 600, width: 500, height: 20 }
        ]
    },
    1: {
        spawnX: 100,
        spawnY: 100,
        gravityY: 1.5,
        ballRestitution: 0.4,
        objects: [
            // Sol principal
            { type: 'platform', x: 400, y: 580, width: 800, height: 40 },
    
            // Petites plateformes en hauteur
            { type: 'platform', x: 300, y: 450, width: 150, height: 20 },
            { type: 'platform', x: 500, y: 350, width: 150, height: 20 },
    
            // Portail de fin
            { type: 'portal', x: 700, y: 300, width: 40, height: 40, nextLevel: "Test" },
    
            // Cube décoratif inoffensif
            { type: 'cube', x: 250, y: 0, width: 40, height: 40, renderColor: '#aaa' },
    
            // Ennemi simple
            { type: 'circle', x: 600, y: 0, radius: 20, doesKill: true, renderColor: '#f00' }
        ]
    }
};




let ball; // déclaration globale
const baseDensity = 0.001; // masse de base
function initLevel(levelId) {
    currentLevelId = levelId;
    const level = levels[levelId];
    if (!level) {
        console.error(`Le niveau ${levelId} n'existe pas.`);
        return;
    }

    // Nettoyage
    Composite.clear(engine.world, false);
    groundContacts = 0;
    canJump = false;

    // Vider les objets interactifs précédents
    dynamicKillers.length = 0;
    portals.length = 0;

    // Gravité
    engine.gravity.y = level.gravityY ?? 1.5;
    engine.gravity.x = level.gravityX ?? 0;

    // Créer la balle
    ball = Bodies.circle(level.spawnX, level.spawnY, 30, {
        restitution: level.ballRestitution ?? 0.5,
        friction: 0,
        frictionAir: 0.001,
        render: { fillStyle: '#4cf' }
    });
    Composite.add(world, ball);
    Body.setDensity(ball, baseDensity); // Masse par défaut
    // Objets
    level.objects.forEach(obj => {
        let body;
    
        // Plateforme statique
        if (obj.type === 'platform') {
            body = Bodies.rectangle(obj.x, obj.y, obj.width, obj.height, {
                isStatic: true,
                friction: 0,
                render: { fillStyle: '#888' }
            });
        }
    
        // Objet mortel statique
        else if (obj.type === 'killer') {
            body = Bodies.rectangle(obj.x, obj.y, obj.width, obj.height, {
                isStatic: true,
                //isSensor: true,
                render: { fillStyle: '#000' }
            });
            dynamicKillers.push(body);
        }
    
        // Portail
        else if (obj.type === 'portal') {
            body = Bodies.rectangle(obj.x, obj.y, obj.width, obj.height, {
                isStatic: true,
                isSensor: true, // pour détecter sans collision
                render: { fillStyle: '#0f0' },
                collisionFilter: {
                    group: COLLISION_GROUP_PORTAL
                }
            });
            body.nextLevel = obj.nextLevel;
            portals.push(body);
        }
        
    
        // ✅ Cube dynamique
        else if (obj.type === 'cube') {
            body = Bodies.rectangle(obj.x, obj.y, obj.width, obj.height, {
                isStatic: false,
                restitution: obj.restitution ?? 0.5,
                friction: obj.friction ?? 0.1,
                render: { fillStyle: obj.renderColor ?? '#aaa' }
            });
            if (obj.doesKill) dynamicKillers.push(body);
        }
    
        // ✅ Cercle dynamique
        else if (obj.type === 'circle') {
            body = Bodies.circle(obj.x, obj.y, obj.radius, {
                isStatic: false,
                restitution: obj.restitution ?? 0.5,
                friction: obj.friction ?? 0.1,
                render: { fillStyle: obj.renderColor ?? '#aaa' }
            });
            if (obj.doesKill) dynamicKillers.push(body);
        }
    
        if (body) {
            Composite.add(world, body);
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
    const margin = 100;
    const x = ball.position.x;
    const y = ball.position.y;

    if (
        x < -margin || x > render.canvas.width + margin ||
        y < -margin || y > render.canvas.height + margin
    ) {
        death();
    }
});

function resizeCanvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    render.canvas.width = width;
    render.canvas.height = height;

    render.options.width = width;
    render.options.height = height;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // appel initial
initLevel(1)

