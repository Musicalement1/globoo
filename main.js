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


const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

const jumpForce = 0.03;
const jumpCooldownTime = 10; // nombre de ticks à attendre entre sauts (~166ms si 60fps)
const moveForce = 0.00125;
const airUpForce = 0.0025;
const downForce = 0.0025;



const levels = {
    level1: {
        spawnX: 100,
        spawnY: 100,
        gravityY: 1.5,
        ballRestitution: 0.5,
        objects: [
            { type: 'platform', x: 400, y: 500, width: 300, height: 20 },
            { type: 'platform', x: 700, y: 400, width: 150, height: 20 }
        ]
    },
    level2: {
        spawnX: 50,
        spawnY: 50,
        gravityY: 2.0,
        ballRestitution: 0.2,
        objects: [
            { type: 'platform', x: 300, y: 600, width: 500, height: 20 }
        ]
    }
};
let ball; // déclaration globale

function initLevel(levelId) {
    const level = levels[levelId];
    if (!level) {
        console.error(`Le niveau ${levelId} n'existe pas.`);
        return;
    }

    // Vider entièrement le monde (tout effacer)
    Composite.clear(engine.world, false);

    // Réinitialiser état
    groundContacts = 0;
    canJump = false;

    // Mettre à jour la gravité
    engine.gravity.y = level.gravityY ?? 1.5;

    // Recréer la balle avec les nouveaux paramètres
    ball = Bodies.circle(level.spawnX, level.spawnY, 30, {
        restitution: level.ballRestitution ?? 0.5,
        friction: 0,
        frictionAir: 0.001,
        render: { fillStyle: '#4cf' }
    });
    Composite.add(world, ball);

    // Recréer les objets du niveau
    level.objects.forEach(obj => {
        if (obj.type === 'platform') {
            const platform = Bodies.rectangle(obj.x, obj.y, obj.width, obj.height, {
                isStatic: true,
                friction: 0,
                render: { fillStyle: '#888' }
            });
            Composite.add(world, platform);
        }
    });
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
        const isStatic = bodyA.isStatic || bodyB.isStatic;

        if (isBall && isStatic) {
            groundContacts++;
        }
    }
});

Events.on(engine, 'collisionEnd', event => {
    for (let pair of event.pairs) {
        const { bodyA, bodyB } = pair;

        const isBall = bodyA === ball || bodyB === ball;
        const isStatic = bodyA.isStatic || bodyB.isStatic;

        if (isBall && isStatic) {
            groundContacts = Math.max(groundContacts - 1, 0);
        }
    }
});




let groundContacts = 0;
let canJump = false;
let jumpCooldown = 0; // pour limiter la fréquence des sauts

Events.on(engine, 'beforeUpdate', () => {
    canJump = groundContacts > 0;

    if (jumpCooldown > 0) {
        jumpCooldown--;
    }

    // Saut automatique si on maintient la touche et que le cooldown est écoulé
    if (keys.ArrowUp && canJump && jumpCooldown === 0) {
        Body.applyForce(ball, ball.position, { x: 0, y: -jumpForce });
        jumpCooldown = jumpCooldownTime;
        canJump = false; // Empêche double saut dans ce tick
    }

    // Déplacement latéral et autres forces comme avant...

    if (keys.ArrowLeft) {
        Body.applyForce(ball, ball.position, { x: -moveForce, y: 0 });
    }
    if (keys.ArrowRight) {
        Body.applyForce(ball, ball.position, { x: moveForce, y: 0 });
    }
    if (keys.ArrowUp && !canJump) {
        Body.applyForce(ball, ball.position, { x: 0, y: -airUpForce });
    }
    if (keys.ArrowDown) {
        Body.applyForce(ball, ball.position, { x: 0, y: downForce });
    }
});

engine.gravity.y = 1.5

