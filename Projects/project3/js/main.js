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
    stage.appendChild(gameOverScene);

    // Create labels for all 3 scenes
    createLabelsAndButtons();
}