"use strict";

//const Victor = require("./victor");

const app = new PIXI.Application(
    {
        width: 1024,
        height: 758
    });
document.body.appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;

// game state enum
const GameState =
{
    Start: 0,
    Game: 1,
    Shop: 2,
    GameOver: 3
}

// pre-load the images (this code works with PIXI v6)
app.loader.
    add([
        "images/title.svg",
        "images/playButton.svg",
        "images/closeButton.svg",
        "images/S_Grass.png",
        "images/shopButton.svg",
        "images/shopTitle.svg",
        "images/buyButton.svg",
        "images/gameOverTitle.svg",
        "images/retryButton.svg",
        "images/quitButton.svg",
        "images/S_Player.png",
        "images/S_Zombie.png",
        "images/S_Survivor.png",
        "images/S_Shot.png"
    ]);
app.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
app.loader.onComplete.add(Setup);
app.loader.load();

// aliases
let stage;

// game variables
let startScene;
let helpScene;
let gameScene, player, pointsLabel, healthLabel, timeLabel, waveLabel, respawnTimer;
let shopScene, fireSpeedLabel, moveSpeedLabel, healthShopLabel, shopPointsLabel;
let gameOverScene, gameOverKillsLabel, gameOverTimeLabel, gameOverWaveLabel;

let clickSound, zombieHitSound, bulletHitSound, deathSound;
let shootSounds = [];

let bullets = [];
let zombies = [];
let survivors = [];
let points = 0;
//let health = 100;
let waveNum = 0;
let time = 0;
let kills = 0;
let currentState = GameState.Start;

//let shootSpeedMultiplier = 1;
let shootSpeedCost = 5;
//let moveSpeedMultiplier = 1;
let moveSpeedCost = 1;
//let healthMultiplier = 1;
let healthCost = 10;

// control variables
let keyW = false;
let keyA = false;
let keyS = false;
let keyD = false;
let keyEsc = false;
let shooting = false;

function Setup() {
    //add control sening to key events
    window.addEventListener('keydown', function (e) {
        // function senses whether W,A,S,D, or ESC are pressed and reports to program
        //console.log("a key was pressed");
        if (e.key === 'w' || e.key === 'W') {
            keyW = true;
            //console.log("pressed W");
        }
        if (e.key === 'a' || e.key === 'A') {
            keyA = true;
            //console.log("pressed A");
        }
        if (e.key === 's' || e.key === 'S') {
            keyS = true;
            //console.log("pressed S");
        }
        if (e.key === 'd' || e.key === 'D') {
            keyD = true;
            //console.log("pressed D");
        }
        if (e.key === 'Escape') {
            keyEsc = true;
            //console.log("pressed Esc");
        }
    });
    window.addEventListener('keyup', function (e) {
        // function senses whether W,A,S,D, or ESC are pressed and reports to program
        //console.log("a key was released");
        if (e.key === 'w' || e.key === 'W') {
            keyW = false;
            //console.log("released W");
        }
        if (e.key === 'a' || e.key === 'A') {
            keyA = false;
            //console.log("released A");
        }
        if (e.key === 's' || e.key === 'S') {
            keyS = false;
            //console.log("released S");
        }
        if (e.key === 'd' || e.key === 'D') {
            keyD = false;
            //console.log("released D");
        }
        if (e.key === 'Escape') {
            keyEsc = false;
            //console.log("released Esc");
        }
    });
    app.view.addEventListener('mousedown', function (e) {
        // senses when the user brings the mouse down on the canvas
        //console.log('started shooting');
        shooting = true;
    });
    window.addEventListener('mouseup', function (e) {
        // senses when the user releases the mouse
        shooting = false;
    });

    stage = app.stage;
    // Create the `start` scene
    startScene = new PIXI.Container();
    stage.addChild(startScene);

    helpScene = new PIXI.Container();
    helpScene.visible = false;
    stage.addChild(helpScene);

    // Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);

    // Create the `gameOver` scene and make it invisible
    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);

    // Create the `shop` scene and make it invisible
    shopScene = new PIXI.Container();
    shopScene.visible = false;
    stage.addChild(shopScene);

    // Create player
    player = new Player(sceneWidth / 2, sceneHeight - 200);

    // Create labels for all 3 scenes
    createLabelsAndButtons();

    // add player
    gameScene.addChild(player);

    // load sounds
    shootSounds.push(new Howl({
        src: ["sounds/SFX_Shoot1.wav"]
    }))
    shootSounds.push(new Howl({
        src: ["sounds/SFX_Shoot2.wav"]
    }))
    shootSounds.push(new Howl({
        src: ["sounds/SFX_Shoot3.wav"]
    }))

    clickSound = new Howl({
        src: ["sounds/SFX_Click.wav"]
    })
    zombieHitSound = new Howl({
        src: ["sounds/SFX_Hit.wav"]
    })
    bulletHitSound = new Howl({
        src: ["sounds/SFX_BulletHit.wav"]
    })
    deathSound = new Howl({
        src: ["sounds/SFX_Death.wav"]
    })

    // Start update loop
    app.ticker.add(gameLoop);

    // Start listening for click events on the canvas
    //app.view.onclick = fireBullet;
}

function createLabelsAndButtons() {
    let textButtonStyle = new PIXI.TextStyle({
        fill: 0xddd573,
        fontSize: 48,
        fontFamily: "Arial"
    });

    let titleTextStyle = new PIXI.TextStyle({
        fill: 0x629839,
        fontSize: 36,
        fontFamily: 'MV Boli',
        stroke: 0xddd573,
        strokeThickness: 2
    });

    let gameText = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 24,
        fontFamily: 'MV Boli',
        stroke: 0x000000,
        strokeThickness: 2
    });

    let textStyle = new PIXI.TextStyle({
        fill: 0xddd573,
        fontSize: 18,
        fontFamily: 'MV Boli',
        //stroke: 0xddd573,
        //strokeThickness: 2
    });

    // start scene
    // top title
    let title = new PIXI.Sprite.from(app.loader.resources["images/title.svg"].texture);
    title.x = 10;
    title.y = 60;
    startScene.addChild(title);

    // help button
    let helpButton = new PIXI.Text("HELP");
    helpButton.style = textButtonStyle;
    helpButton.x = 30;
    helpButton.y = 240;
    helpButton.interactive = true;
    helpButton.buttonMode = true;
    helpButton.on("pointerup", openHelp); // function reference to startGame
    helpButton.on('pointerover', e => e.target.alpha = 0.7);
    helpButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    startScene.addChild(helpButton);

    // play button
    let startButton = new PIXI.Sprite.from(app.loader.resources["images/playButton.svg"].texture);
    //startButton.style = buttonStyle;
    startButton.x = (sceneWidth / 2) - (startButton.width / 2);
    startButton.y = sceneHeight - 200;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", startGame); // function reference to startGame
    startButton.on('pointerover', e => e.target.alpha = 0.7);
    startButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);

    //set up 'help scene'
    // back button
    let backButton = new PIXI.Sprite.from(app.loader.resources["images/closeButton.svg"].texture);
    //startButton.style = buttonStyle;
    backButton.x = (sceneWidth) - (backButton.width) - 10;
    backButton.y = 10;
    backButton.interactive = true;
    backButton.buttonMode = true;
    backButton.on("pointerup", backToTitle); // function reference to startGame
    backButton.on('pointerover', e => e.target.alpha = 0.7);
    backButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    helpScene.addChild(backButton);

    // titleRules
    let titleRules = new PIXI.Text("How to play");
    titleRules.style = titleTextStyle;
    titleRules.x = (sceneWidth / 2) - (titleRules.width / 2);
    titleRules.y = 50;
    helpScene.addChild(titleRules);

    //rule bullets
    let controls = new PIXI.Text(
        "W,A,S,D to move \nhold LEFT CLICK to shoot \nESC to open shop");
    controls.style = textStyle;
    controls.x = 10;
    controls.y = 100;
    helpScene.addChild(controls);

    let ruleBullet1 = new PIXI.Text("Kill zombies to gain points and protect survivors.");
    ruleBullet1.style = textStyle;
    ruleBullet1.x = 10;
    ruleBullet1.y = 200;
    helpScene.addChild(ruleBullet1);

    let rulebullet2 = new PIXI.Text("Spend points in the shop for upgrades.");
    rulebullet2.style = textStyle;
    rulebullet2.x = 10;
    rulebullet2.y = 300;
    helpScene.addChild(rulebullet2);

    let rulebullet3 = new PIXI.Text("Kill infected surivors before they turn.");
    rulebullet3.style = textStyle;
    rulebullet3.x = 10;
    rulebullet3.y = 400;
    helpScene.addChild(rulebullet3);

    let rulebullet4 = new PIXI.Text("You can respawn, but survivors do not. \nKeep them alive as long as possible.");
    rulebullet4.style = textStyle;
    rulebullet4.x = 10;
    rulebullet4.y = 500;
    helpScene.addChild(rulebullet4);

    // set up 'gameScene'
    // background 
    let background = new PIXI.TilingSprite(app.loader.resources["images/S_Grass.png"].texture, sceneWidth, sceneHeight);
    background.tileScale.x = 0.2;
    background.tileScale.y = 0.2;
    gameScene.addChild(background);

    // make score label
    pointsLabel = new PIXI.Text();
    pointsLabel.style = gameText;
    pointsLabel.x = sceneWidth - pointsLabel.width - 10;
    pointsLabel.y = 5;
    gameScene.addChild(pointsLabel);


    //make a life label
    healthLabel = new PIXI.Text();
    healthLabel.style = gameText;
    healthLabel.x = 10;
    healthLabel.y = 5;
    gameScene.addChild(healthLabel);
    //decreaseLifeBy(0);

    // make a time label
    timeLabel = new PIXI.Text("Time:    0:00");
    timeLabel.style = gameText;
    timeLabel.x = sceneWidth / 2 - timeLabel.width / 2
    timeLabel.y = 5;
    gameScene.addChild(timeLabel);

    // make a wave label
    waveLabel = new PIXI.Text("Wave:    1");
    waveLabel.style = gameText;
    waveLabel.x = sceneWidth / 2 - timeLabel.width / 2;
    waveLabel.y = 25;
    gameScene.addChild(waveLabel);

    // shop button
    let shopButton = new PIXI.Sprite.from(app.loader.resources["images/shopButton.svg"].texture);
    //startButton.style = buttonStyle;
    shopButton.x = (sceneWidth / 2) - (shopButton.width / 2);
    shopButton.y = sceneHeight - 100;
    shopButton.interactive = true;
    shopButton.buttonMode = true;
    shopButton.on("pointerup", openShop); // function reference to startGame
    shopButton.on('pointerover', e => e.target.alpha = 0.7);
    shopButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    gameScene.addChild(shopButton);

    // respawn timer
    respawnTimer = new PIXI.Text("3");
    respawnTimer.style = new PIXI.TextStyle({
        fill: 0xFF0000,
        fontSize: 72,
        fontFamily: 'MV Boli',
        stroke: 0xFFFFFF,
        strokeThickness: 2
    });
    respawnTimer.x = sceneWidth / 2 - respawnTimer.width / 2;
    respawnTimer.y = sceneHeight / 2 - respawnTimer.height / 2;
    gameScene.addChild(respawnTimer);

    let gameOverButton = new PIXI.Sprite.from(app.loader.resources["images/closeButton.svg"].texture);
    //startButton.style = buttonStyle;
    gameOverButton.x = 10;
    gameOverButton.y = sceneHeight - 60;
    gameOverButton.interactive = true;
    gameOverButton.buttonMode = true;
    gameOverButton.on("pointerup", gameOver); // function reference to startGame
    gameOverButton.on('pointerover', e => e.target.alpha = 0.7);
    gameOverButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    gameScene.addChild(gameOverButton);

    // set up 'shopScene'
    // top title
    let shopTitle = new PIXI.Sprite.from(app.loader.resources["images/shopTitle.svg"].texture);
    shopTitle.x = 10;
    shopTitle.y = 10;
    shopScene.addChild(shopTitle);

    let closeShopButton = new PIXI.Sprite.from(app.loader.resources["images/closeButton.svg"].texture);
    //startButton.style = buttonStyle;
    closeShopButton.x = (sceneWidth) - (backButton.width) - 10;
    closeShopButton.y = 10;
    closeShopButton.interactive = true;
    closeShopButton.buttonMode = true;
    closeShopButton.on("pointerup", backToGame); // function reference to startGame
    closeShopButton.on('pointerover', e => e.target.alpha = 0.7);
    closeShopButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    shopScene.addChild(closeShopButton);

    let buyShootSpeedButton = new PIXI.Sprite.from(app.loader.resources["images/buyButton.svg"].texture);
    //startButton.style = buttonStyle;
    buyShootSpeedButton.x = 10;
    buyShootSpeedButton.y = 200;
    buyShootSpeedButton.interactive = true;
    buyShootSpeedButton.buttonMode = true;
    buyShootSpeedButton.on("pointerup", buyShootSpeed); // function reference to startGame
    buyShootSpeedButton.on('pointerover', e => e.target.alpha = 0.7);
    buyShootSpeedButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    shopScene.addChild(buyShootSpeedButton);

    fireSpeedLabel = new PIXI.Text(`Fire Speed \n$${shootSpeedCost} | ${player.attackSpeed}x`);
    fireSpeedLabel.style = textStyle;
    fireSpeedLabel.x = 130;
    fireSpeedLabel.y = 200;
    shopScene.addChild(fireSpeedLabel);

    let buyMoveSpeedButton = new PIXI.Sprite.from(app.loader.resources["images/buyButton.svg"].texture);
    //startButton.style = buttonStyle;
    buyMoveSpeedButton.x = 10;
    buyMoveSpeedButton.y = 300;
    buyMoveSpeedButton.interactive = true;
    buyMoveSpeedButton.buttonMode = true;
    buyMoveSpeedButton.on("pointerup", buySpeed); // function reference to startGame
    buyMoveSpeedButton.on('pointerover', e => e.target.alpha = 0.7);
    buyMoveSpeedButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    shopScene.addChild(buyMoveSpeedButton);

    moveSpeedLabel = new PIXI.Text(`Movement Speed \n$${moveSpeedCost} | ${player.speedMultiplier}x`);
    moveSpeedLabel.style = textStyle;
    moveSpeedLabel.x = 130;
    moveSpeedLabel.y = 300;
    shopScene.addChild(moveSpeedLabel);

    let buyHealthutton = new PIXI.Sprite.from(app.loader.resources["images/buyButton.svg"].texture);
    //startButton.style = buttonStyle;
    buyHealthutton.x = 10;
    buyHealthutton.y = 400;
    buyHealthutton.interactive = true;
    buyHealthutton.buttonMode = true;
    buyHealthutton.on("pointerup", buyHealth); // function reference to startGame
    buyHealthutton.on('pointerover', e => e.target.alpha = 0.7);
    buyHealthutton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    shopScene.addChild(buyHealthutton);

    healthShopLabel = new PIXI.Text(`Health \n$${healthCost} | ${player.healthMultiplier}x`);
    healthShopLabel.style = textStyle;
    healthShopLabel.x = 130;
    healthShopLabel.y = 400;
    shopScene.addChild(healthShopLabel);

    shopPointsLabel = new PIXI.Text(`Points: ${points}`);
    shopPointsLabel.style = titleTextStyle;
    shopPointsLabel.x = sceneWidth - shopPointsLabel.width - 10;
    shopPointsLabel.y = sceneHeight - 50;
    shopScene.addChild(shopPointsLabel);
    increaseScoreBy(0);

    // set up 'gameOverScene'
    // game over title
    // top title
    let gameOverTitle = new PIXI.Sprite.from(app.loader.resources["images/gameOverTitle.svg"].texture);
    gameOverTitle.x = (sceneWidth / 2) - (gameOverTitle.width / 2);
    gameOverTitle.y = 10;
    gameOverScene.addChild(gameOverTitle);

    // time
    gameOverTimeLabel = new PIXI.Text("Time:    0:00");
    gameOverTimeLabel.style = textStyle;
    gameOverTimeLabel.x = sceneWidth / 2 - gameOverTimeLabel.width / 2;
    gameOverTimeLabel.y = 200;
    gameOverScene.addChild(gameOverTimeLabel);

    // wave
    gameOverWaveLabel = new PIXI.Text("Wave:    1");
    gameOverWaveLabel.style = textStyle;
    gameOverWaveLabel.x = sceneWidth / 2 - gameOverTimeLabel.width / 2;
    gameOverWaveLabel.y = 250;
    gameOverScene.addChild(gameOverWaveLabel);

    // kills
    gameOverKillsLabel = new PIXI.Text("Kills:     1");
    gameOverKillsLabel.style = textStyle;
    gameOverKillsLabel.x = sceneWidth / 2 - gameOverTimeLabel.width / 2;
    gameOverKillsLabel.y = 300;
    gameOverScene.addChild(gameOverKillsLabel);

    // retry button
    let retryButton = new PIXI.Sprite.from(app.loader.resources["images/retryButton.svg"].texture);
    //startButton.style = buttonStyle;
    retryButton.x = (sceneWidth / 2) - (retryButton.width / 2);
    retryButton.y = sceneHeight - 200;
    retryButton.interactive = true;
    retryButton.buttonMode = true;
    retryButton.on("pointerup", startGame); // function reference to startGame
    retryButton.on('pointerover', e => e.target.alpha = 0.7);
    retryButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    gameOverScene.addChild(retryButton);

    // quit button
    let quitButton = new PIXI.Sprite.from(app.loader.resources["images/quitButton.svg"].texture);
    //startButton.style = buttonStyle;
    quitButton.x = (sceneWidth / 2) - (quitButton.width / 2);
    quitButton.y = sceneHeight - 300;
    quitButton.interactive = true;
    quitButton.buttonMode = true;
    quitButton.on("pointerup", backToTitle); // function reference to startGame
    quitButton.on('pointerover', e => e.target.alpha = 0.7);
    quitButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    gameOverScene.addChild(quitButton);
}

//scene change functions
function startGame() {
    // play button sound
    clickSound.play();
    // make correct scene visible
    startScene.visible = false;
    helpScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;
    shopScene.visible = false;

    currentState = GameState.Game;

    // set up starting stats
    waveNum = 0;
    points = 0;
    time = 0;
    kills = 0;

    increaseScoreBy(0);

    player.physics.position.x = sceneWidth / 2;
    player.physics.position.y = sceneHeight - 200;

    player.attackSpeed = 1;
    shootSpeedCost = 5
    player.speedMultiplier = 1;
    player.physics.maxSpeed = player.startSpeed;
    moveSpeedCost = 1;
    player.healthMultiplier = 1;
    player.maxHealth = player.startHealth;
    player.health = player.maxHealth;
    healthCost = 10;

    //reset store text
    fireSpeedLabel.text = `Fire Speed \n$${shootSpeedCost} | ${player.attackSpeed}x`;
    moveSpeedLabel.text = `Movement Speed \n$${moveSpeedCost} | ${player.speedMultiplier}x`;
    healthShopLabel.text = `Health \n$${healthCost} | ${player.healthMultiplier}x`;

    // clear everything
    for (let z of zombies) {
        gameScene.removeChild(z);
    }
    zombies = [];
    for (let b of bullets) {
        gameScene.removeChild(b);
    }
    bullets = [];
    for (let s of survivors) {
        gameScene.removeChild(s);
    }
    survivors = [];

    // create new survivors
    for (let i = 0; i < 10; i++) {
        let s = new Survivor(Math.random() * sceneHeight, Math.random() * sceneWidth, "images/S_Survivor.png");
        survivors.push(s);
        gameScene.addChild(s);
    }

    newWave();
}

function openHelp() {
    // play button sound
    clickSound.play();
    // make correct scene visible
    startScene.visible = false;
    helpScene.visible = true;
    gameOverScene.visible = false;
    gameScene.visible = false;
    shopScene.visible = false;

    currentState = GameState.Start;
}

function backToTitle() {
    // play button sound
    clickSound.play();
    // make correct scene visible
    startScene.visible = true;
    helpScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = false;
    shopScene.visible = false;

    currentState = GameState.Start;
}

function openShop() {
    // play button sound
    clickSound.play();
    // make correct scene visible
    startScene.visible = false;
    helpScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = false;
    shopScene.visible = true;

    currentState = GameState.Shop;
}

function backToGame() {
    // play button sound
    clickSound.play();
    // make correct scene visible
    startScene.visible = false;
    helpScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;
    shopScene.visible = false;

    currentState = GameState.Game;
}

function gameOver() {
    startScene.visible = false;
    helpScene.visible = false;
    gameOverScene.visible = true;
    gameScene.visible = false;
    shopScene.visible = false;

    currentState = GameState.GameOver;

    let totalseconds = Math.floor(time);
    let minutes = Math.floor(totalseconds / 60)
    let seconds = totalseconds % 60;
    let formatSeconds = seconds < 10 ? '0' + seconds : seconds;

    gameOverTimeLabel.text = `Time:    ${minutes}:${formatSeconds}`
    gameOverTimeLabel.x = sceneWidth / 2 - gameOverTimeLabel.width / 2;

    gameOverWaveLabel.text = `Wave:    ${waveNum}`;
    gameOverWaveLabel.x = sceneWidth / 2 - gameOverTimeLabel.width / 2;

    gameOverKillsLabel.text = `Kills:     ${kills}`;
    gameOverKillsLabel.x = sceneWidth / 2 - gameOverTimeLabel.width / 2;
}

// value control functions
function increaseScoreBy(value) {
    points += value;
    pointsLabel.text = `Points: ${points}`;
    pointsLabel.x = sceneWidth - pointsLabel.width - 10;
    shopPointsLabel.text = `Points: ${points}`;
    shopPointsLabel.x = sceneWidth - shopPointsLabel.width - 10;
}

/*
function updateLifeDisplay()
{
    
    //health = parseInt(health);
    healthLabel.text = `Health: ${player.health}`;
}
*/

function buyShootSpeed() {
    if (points >= shootSpeedCost) {
        player.attackSpeed += 0.2;
        player.attackSpeed = Math.round(player.attackSpeed * 10) / 10;
        increaseScoreBy(-shootSpeedCost);
        shootSpeedCost++;
        fireSpeedLabel.text = `Fire Speed \n$${shootSpeedCost} | ${player.attackSpeed}x`;
    }
}
function buySpeed() {
    if (points >= moveSpeedCost) {
        player.speedMultiplier += 0.1;
        player.speedMultiplier = Math.round(player.speedMultiplier * 10) / 10;
        player.physics.maxSpeed = player.startSpeed * player.speedMultiplier;
        increaseScoreBy(-moveSpeedCost);
        moveSpeedCost++;
        moveSpeedLabel.text = `Movement Speed \n$${moveSpeedCost} | ${player.speedMultiplier}x`;
    }
}
function buyHealth() {
    if (points >= healthCost) {
        player.healthMultiplier += 0.5;
        player.healthMultiplier = Math.round(player.healthMultiplier * 10) / 10;
        player.maxHealth = player.startHealth * player.healthMultiplier;
        increaseScoreBy(-healthCost);
        healthCost++;
        healthShopLabel.text = `Health \n$${healthCost} | ${player.healthMultiplier}x`;
    }
}

// game control functions
function spawnZombies(num) {
    for (let i = 0; i < num; i++) {
        let y = Math.random() * sceneHeight;
        let x = 0;

        // half of the zombies go to each side
        if (i % 2 == 0) {
            x = sceneWidth;
        }

        let z = new Zombie(x, y, "images/S_Zombie.png");
        zombies.push(z);
        gameScene.addChild(z);
    }
}

/*
function fireBullet(e){
}
*/

function newWave() {
    waveNum++;
    waveLabel.text = `Wave:    ${waveNum}`
    // spawn up to waveNum * 2 zombies, but never less than waveNum
    spawnZombies(waveNum + Math.random() * waveNum);
}

//utilities
function clamp(val, min, max) {
    return val < min ? min : (val > max ? max : val);
}


// game loop
function gameLoop() {
    if (currentState == GameState.Game) {
        // calculate "delta time"
        let dt = 1 / app.ticker.FPS;
        if (dt > 1 / 12) dt = 1 / 12;

        // save game time
        time += dt;

        // calculate player's movement vector
        let mov = new Victor(0, 0);

        // open shop with ESC
        if(keyEsc)
        {
            openShop();
        }

        // allow player movement
        if (keyW) {
            mov.addScalarY(-1);
        }
        if (keyS) {
            mov.addScalarY(1);
        }
        if (keyA) {
            mov.addScalarX(-1);
        }
        if (keyD) {
            mov.addScalarX(1);
        }


        //get a vector mouse position
        let mousePosition = new Victor(
            app.renderer.plugins.interaction.mouse.global.x,
            app.renderer.plugins.interaction.mouse.global.y
        );

        if (shooting && player.health > 0) {
            player.shoot(mousePosition);
        }


        // update the player's position
        player.update(mov, mousePosition, dt);

        //keep player on screen
        player.physics.position.x = clamp(player.physics.position.x, 0 + player.physics.radius, sceneWidth - player.physics.radius);
        player.physics.position.y = clamp(player.physics.position.y, 0 + player.physics.radius, sceneHeight - player.physics.radius);


        // move zombies & check thier collisions
        for (let zombie of zombies) {
            // zombies find and follow the closest survivor/player
            let closestTarget;
            let closestDist = Infinity; // start with large number

            // find the closest survivor
            for (let survivor of survivors) {
                let distSq = zombie.physics.position.distanceSq(survivor.physics.position);
                if (distSq < closestDist) {
                    closestDist = distSq;
                    closestTarget = survivor;
                }
            }

            // check if the player is closer & alive
            let distSq = zombie.physics.position.distanceSq(player.physics.position);
            if (distSq < closestDist && player.health > 0) {
                closestDist = distSq;
                closestTarget = player;
            }

            zombie.update(closestTarget, zombies, dt);

            // detect survivor/player collisions
            if (zombie.physics.detectIntersection(player.physics) && player.health > 0) {
                zombie.attack(player);
            }
            for (let survivor of survivors) {
                if (zombie.physics.detectIntersection(survivor.physics)) {
                    zombie.attack(survivor);
                }
            }

            // detect bullet collisions
            for (let b of bullets) {
                if (b.detectIntersection(zombie.physics)) {
                    console.log("hit detected");
                    zombie.health -= b.damage;
                    gameScene.removeChild(b);
                    b.isAlive = false;

                    // play hit sound
                    bulletHitSound.play();
                }

                // kill bullets that move offscreen
                if (b.y < -10 || b.y > sceneHeight + 10 || b.x < -10 || b.x > sceneWidth + 10) {
                    b.isAlive = false;
                }
            }
        }

        // Move Bullets
        for (let b of bullets) {
            b.move(dt);
        }

        // Move Survivors
        for (let s of survivors) {
            s.update(survivors, zombies, dt);
        }

        // some clean up
        bullets = bullets.filter(b => b.isAlive);
        zombies = zombies.filter(z => z.isAlive);
        survivors = survivors.filter(s => s.isAlive);

        // end the game if no survivors remain
        if (survivors.length == 0) {
            gameOver();
        }

        // load next level
        if (zombies.length == 0) {
            newWave();
        }

        // update labels
        healthLabel.text = `Health: ${Math.max(0, player.health)}`;

        let totalseconds = Math.floor(time);
        let minutes = Math.floor(totalseconds / 60)
        let seconds = totalseconds % 60;
        let formatSeconds = seconds < 10 ? '0' + seconds : seconds;
        timeLabel.text = `Time:    ${minutes}:${formatSeconds}`;
    }
    // note whether ESC was held last frame

}