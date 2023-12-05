"use strict";

const app = new PIXI.Application(
    {
        width: 600,
        height: 600
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
        "images/title.svg"
    ]);
app.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
app.loader.onComplete.add(Setup);
app.loader.load();

// aliases
let stage;

// game variables
let startScene;
let gameScene,guy,pointsLabel,healthLabel,timeLabel, waveLabel, shootSound, hitSound;
let shopScene, fireSpeedLabel, moveSpeedLabel, healthModLabel, shopPointsLabel;
let gameOverScene, gameOverKillsLabel, gameOverTimeLevel, gameOverWaveLevel;

let bullets = [];
let zombies = [];
let score = 0;
let health = 100;
let waveNum = 1;
let time = 0;
let currentState = GameState.Start;

function Setup() 
{
	stage = app.stage;
	// Create the `start` scene
    startScene = new PIXI.Container();
    stage.addChild(startScene);
	
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
    stage.addChild(gameOverScene);

    // Create labels for all 3 scenes
    createLabelsAndButtons();

    // Start update loop
    app.ticker.add(gameLoop);

    // Start listening for click events on the canvas
    app.view.onclick = fireBullet;
}

function createLabelsAndButtons()
{
    let textButtonStyle = new PIXI.TextStyle({
        fill: 0xddd573,
        fontSize: 48,
        fontFamily: "Arial"
    });

    // start scene
    // top title
    let title = new PIXI.Sprite.from(app.loader.resources["images/title.svg"].texture);
    title.x = 30;
    title.y = 60;
    startScene.addChild(title);

    // help button
    let helpButton = new PIXI.Text("HELP");
    helpButton.style = textButtonStyle;
    helpButton.x = 30;
    helpButton.y = 240;
    helpButton.interactive = true;
    helpButton.buttonMode = true;
    helpButton.on("pointerup", startGame); // function reference to startGame
    helpButton.on('pointerover', e => e.target.alpha = 0.7);
    helpButton.on('pointerout', e => e.currentTarget.alpha = 1.0);
    startScene.addChild(helpButton);
}

function startGame(){
    startScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;

    levelNum = 1;
    score = 0;
    life = 100;
    increaseScoreBy(0);
    decreaseLifeBy(0);
    ship.x = 300;
    ship.y = 550;
    loadLevel();
}