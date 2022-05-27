import { FreeCamera, MeshBuilder, NullEngine, Scene, Vector3 } from 'babylonjs';
import * as GUI from 'babylonjs-gui'

import { IBackendApi } from 'frakas/api'

import { interval } from "rxjs";

import { GameAction, IGameState, IPlayerState, PlayerAction, PlayerSide, __loop_speed } from "./common";

var index = 0;

export function getBackend(backendApi: IBackendApi) {

    var engine = new NullEngine();
    var scene = new Scene(engine);
    var camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);

    console.log(`Game Init`);

    var currentGameAction = GameAction.AwaitingGameStart;

    var gamePlayerStateIn: any = {}
    var ball: any = {};
    var ballObj = MeshBuilder.CreateSphere("ball", { diameter: 100, segments: 32 }, scene);
    ballObj.position.z = 100;
    ball.obj = ballObj;
    ball.speed = 110;
    ball.attack = 0;
    ball.spin = 0;
    ball.hDirection = 1;
    ball.vDirection = 1;

    var speedRatio = 90;

    var padSize = 400;
    var lobbyQueue: IPlayerState[] = [];
    var skipQueue: IPlayerState[] = [];
    var preLobbyQueue: IPlayerState[] = [];
    // create new game players
    //var gamePlayers = <any>{};
    //playerLeft = {};
    //playerRight = {};
    var playerLeft: IPlayerState = {} as IPlayerState;
    var playerRight: IPlayerState = {} as IPlayerState;
    var serverPlayer: IPlayerState = {} as IPlayerState;
    //var serveSide: PlayerSide = PlayerSide.Left;
    var startPointDelay = 15;
    var playAgainDelay = 100;

    var forgiveness = 100;
    var winScore = 3;

    backendApi.onPlayerEnter()
        .subscribe(playerPosition => {

            console.log(`onPlayerEnter`, playerPosition);
            console.log("lobbyQueue", lobbyQueue);
            console.log("skipQueue", skipQueue);
            console.log("preLobbyQueue", preLobbyQueue);
        });

    backendApi.onPlayerEvent<IPlayerState>()
        .subscribe((event) => {

            //console.log("backend.onPlayerEvent", event)
            // ############## PlayerAction.Serve ##############
            if (event.playerState.playerAction == PlayerAction.CompleteServe) {

                //console.log(`onPlayerEvent event.playerState.playerAction == PlayerAction.CompleteServe`, event);

                if (currentGameAction == GameAction.InServe) {

                    if (serverPlayer.playerPosition == event.playerPosition) {

                        serverPlayer = serverPlayer.playerPosition == playerLeft.playerPosition ? playerRight : playerLeft;

                        ball.speed = 95;

                        var attack = (Math.random() * 2) - 1;

                        ball.attack = Math.abs(attack);
                        ball.vDirection = attack > 0 ? 1 : -1;

                        currentGameAction = GameAction.InGame;

                        playerLeft.playerAction = PlayerAction.InGame;
                        playerRight.playerAction = PlayerAction.InGame;

                        if (serverPlayer.playerPosition == playerLeft.playerPosition) {
                            ball.hDirection = 1;
                        } else {
                            ball.hDirection = -1;
                        }

                        // console.log(`Player ${serveSide} serve, GameAction ${currentGameAction}!!`);
                    }
                }
            }
            // ############## PlayerAction.Enter ##############
            else if (event.playerState.playerAction == PlayerAction.Enter) {

                console.log(`onPlayerEvent event.playerState.playerAction == PlayerAction.Enter`, event);

                if (preLobbyQueue.some(x => { return x.playerPosition == event.playerPosition }) ||
                    skipQueue.some(x => { return x.playerPosition == event.playerPosition }) ||
                    lobbyQueue.some(x => { return x.playerPosition == event.playerPosition })) {
                    console.log(`Player ${event.playerState.nickname.substring(0, 15)}, pos:${event.playerPosition}, already in queue`);
                    return;
                }

                var newPlayer = <IPlayerState>
                    {
                        playerPosition: event.playerPosition,
                        nickname: event.playerState.nickname.substring(0, 15),
                        currentGameAction: GameAction.AwaitingGameStart,
                        idleCounter: 100,
                        isHit: false,
                        playerAction: PlayerAction.Queue,
                        playerSide: PlayerSide.Left,
                        queuePosition: 0,
                        score: -1,
                        speed: 0,
                        zPosition: 0

                    }

                if (currentGameAction == GameAction.FinishGame &&
                    (playerLeft.playerPosition == event.playerPosition ||
                        playerRight.playerPosition == event.playerPosition)) {

                    var mySide = playerLeft.playerPosition == event.playerPosition ?
                        playerLeft : playerRight;

                    // console.log(`From onPlayerEnter, Active Player-${playerPosition}, side: ${mySide}, playerAction:${gamePlayers[mySide].playerAction}`)

                    if (mySide.playerAction == PlayerAction.WinGame) {

                        skipQueue.push(newPlayer);

                        triggerGameEnd();

                    } else {

                        preLobbyQueue.push(newPlayer);
                    }
                } else {

                    preLobbyQueue.push(newPlayer);
                }

            }
            // ############## PlayerAction.SetPosition ##############
            else if (event.playerState.playerAction == PlayerAction.SetPosition) {
                if (!event.playerState.zPosition) return;

                gamePlayerStateIn[event.playerPosition].zTrail.push(event.playerState.zPosition);
            }

        });



    interval(__loop_speed)
        .subscribe(() => {

            preLoopLogic();

            switch (currentGameAction) {
                case GameAction.AwaitingGameStart: {
                    awaitingGameStartLogic();
                    break;
                }
                case GameAction.InServe: {
                    inServeLogic();
                    break;
                }
                case GameAction.InGame: {
                    inGameLogic();
                    break;
                }
                case GameAction.StartPoint: {
                    startPointLogic();
                    break;
                }
                case GameAction.FinishGame: {
                    finishGameLogic();
                    break;
                }
            }


        });


    var preLoopLogic = () => {
        while (skipQueue.length) {
            var nextPlayer = skipQueue.shift()!!;

            if (lobbyQueue.some(x => { return x.playerPosition == nextPlayer?.playerPosition })) {
                console.log(`Player ${nextPlayer.nickname}, pos:${nextPlayer.playerPosition}, already in queue`);
                return;
            }

            var queuePosition = lobbyQueue.length;

            console.log(`Player ${nextPlayer.nickname}, pos:${nextPlayer.playerPosition}, prioritized to queue position ${queuePosition}!`, lobbyQueue);

            lobbyQueue.unshift(nextPlayer);

            backendApi.sendToPlayer<IPlayerState>({
                playerPosition: nextPlayer.playerPosition,
                playerState: {
                    playerAction: PlayerAction.Lobby,
                    playerSide: PlayerSide.Left,
                    zPosition: 0,
                    currentGameAction: currentGameAction,
                    playerPosition: nextPlayer.playerPosition,
                    queuePosition: queuePosition,
                    nickname: nextPlayer.nickname
                } as IPlayerState
            });

        }
        while (preLobbyQueue.length) {
            var nextPlayer = preLobbyQueue.shift()!!;

            if (lobbyQueue.some(x => { return x.playerPosition == nextPlayer.playerPosition })) {
                console.log(`Player ${nextPlayer.nickname}, pos:${nextPlayer.playerPosition}, already in queue`);
                return;
            }

            var queuePosition = lobbyQueue.length;

            lobbyQueue.push(nextPlayer);

            console.log(`Player ${nextPlayer.nickname}, pos:${nextPlayer.playerPosition}, added to queue position ${queuePosition}!`, lobbyQueue);

            backendApi.sendToPlayer<IPlayerState>({
                playerPosition: nextPlayer.playerPosition,
                playerState: {
                    playerAction: PlayerAction.Lobby,
                    playerSide: PlayerSide.Left,
                    zPosition: 0,
                    currentGameAction: currentGameAction,
                    playerPosition: nextPlayer.playerPosition,
                    queuePosition: queuePosition,
                    nickname: nextPlayer.nickname
                } as IPlayerState
            });
        }

    }

    var awaitingGameStartLogic = () => {
        if (lobbyQueue.length >= 2) {

            currentGameAction = GameAction.StartPoint;

            playAgainDelay = 100;

            var player = lobbyQueue.shift()!!;
            playerLeft.playerPosition = player.playerPosition;
            playerLeft.playerAction = PlayerAction.StartServe;
            playerLeft.score = 0;
            playerLeft.playerSide = PlayerSide.Left;
            playerLeft.currentGameAction = currentGameAction;
            playerLeft.nickname = player.nickname;

            serverPlayer = playerLeft;

            gamePlayerStateIn[player.playerPosition] = {};
            gamePlayerStateIn[player.playerPosition].zTrail = [];

            player = lobbyQueue.shift()!!;
            playerRight.playerPosition = player.playerPosition;
            playerRight.playerAction = PlayerAction.AwaitServe;
            playerRight.currentGameAction = currentGameAction;
            playerRight.score = 0;
            playerRight.playerSide = PlayerSide.Right;
            playerRight.nickname = player.nickname;

            gamePlayerStateIn[player.playerPosition] = {};
            gamePlayerStateIn[player.playerPosition].zTrail = [];

            backendApi.sendToPlayer<IPlayerState>({
                playerPosition: playerLeft.playerPosition,
                playerState: playerLeft
            });

            backendApi.sendToPlayer<IPlayerState>({
                playerPosition: playerRight.playerPosition,
                playerState: playerRight
            });

            var queuePosition = 0;
            for (let player of lobbyQueue) {
                backendApi.sendToPlayer<IPlayerState>({
                    playerPosition: player.playerPosition,
                    playerState: {
                        playerAction: PlayerAction.Lobby,
                        currentGameAction: currentGameAction,
                        playerPosition: player.playerPosition,
                        queuePosition: queuePosition
                    } as IPlayerState
                });
                queuePosition++;
            }
        } else {
            // console.log("Awaiting Players", lobbyQueue);
        }
    }

    var startPointLogic = () => {
        console.log(`StartPoint delay: ${startPointDelay}`)

        if (startPointDelay <= 0) {
            currentGameAction = GameAction.InServe;

            var oldServerPlayer = serverPlayer.playerPosition == playerLeft.playerPosition ? playerLeft : playerRight;
            var nextServerPlayer = serverPlayer.playerPosition == playerLeft.playerPosition ? playerRight : playerLeft;

            //logger.log(`ServeSide is: ${serveSide}`);

            oldServerPlayer.playerAction = PlayerAction.StartServe;
            nextServerPlayer.playerAction = PlayerAction.AwaitServe;

            backendApi.sendToPlayer<IPlayerState>({
                playerPosition: playerLeft.playerPosition,
                playerState: playerLeft
            });

            backendApi.sendToPlayer<IPlayerState>({
                playerPosition: playerRight.playerPosition,
                playerState: playerRight
            });

            startPointDelay = 15
        }

        backendApi.sendToAll<IGameState>({
            gameAction: currentGameAction,
            playerLeft: playerLeft,
            playerRight: playerRight,
            ballPosition: ball.obj.position,
            ballSpin: ball.spin,
            ballDirection: ball.vDirection
        });

        startPointDelay--;
    }

    var inServeLogic = () => {
        for (const zPos of gamePlayerStateIn[playerLeft.playerPosition].zTrail) {
            if (zPos) {
                playerLeft.zPosition = zPos;
            }
        }

        for (const zPos of gamePlayerStateIn[playerRight.playerPosition].zTrail) {
            if (zPos) {
                playerRight.zPosition = zPos;
            }
        }

        gamePlayerStateIn[playerLeft.playerPosition].zTrail = [];
        gamePlayerStateIn[playerRight.playerPosition].zTrail = [];

        //var oldServerPlayer = serveSide == PlayerSide.Left ? playerLeft : playerRight;

        if (serverPlayer.zPosition) {
            if (serverPlayer.playerPosition == playerLeft.playerPosition) {
                ball.obj.position = new Vector3(1000, serverPlayer.zPosition, 100);
            } else {
                ball.obj.position = new Vector3(-1000, serverPlayer.zPosition, 100);
            }
        }

        var state = <IGameState>{
            gameAction: currentGameAction,
            playerLeft: playerLeft,
            playerRight: playerRight,
            ballPosition: ball.obj.position,
            ballSpin: ball.spin,
            ballDirection: ball.vDirection
        }

        backendApi.sendToAll<IGameState>(state);
    }

    var inGameLogic = () => {
        var activeBall = true;

        if (ball.obj.position.x < 1200) {
            playerLeft.isHit = false;
            //ball.hDirection = -1;
        }

        if (ball.obj.position.x > -1200) {
            playerRight.isHit = false;
            //ball.hDirection = 1;
        }

        var ballLogic = (player: IPlayerState) => {

            var playerPosition = player.playerPosition;

            for (const z of gamePlayerStateIn[playerPosition].zTrail) {

                if (player.zPosition) {
                    player.speed = z - player.zPosition;
                }

                player.zPosition = z;

                // check bat collisions

                if (ball.obj.position.x > 1000 &&
                    ball.obj.position.y - forgiveness < playerLeft.zPosition + (padSize / 2) &&
                    ball.obj.position.y + forgiveness > playerLeft.zPosition - (padSize / 2)) {

                    playerLeft.isHit = true;
                    ball.hDirection = -1;

                    var attack = Math.min(1, Math.max(-1, (ball.attack * ball.vDirection) + playerLeft.speed / speedRatio));

                    ball.attack = Math.abs(attack);
                    ball.vDirection = attack > 0 ? 1 : -1;

                    ball.spin = playerLeft.speed / speedRatio;

                    activeBall = false;

                    ball.speed += 1;
                }

                if (ball.obj.position.x < -1000 &&
                    ball.obj.position.y - forgiveness < playerRight.zPosition + (padSize / 2) &&
                    ball.obj.position.y + forgiveness > playerRight.zPosition - (padSize / 2)) {

                    playerRight.isHit = true;
                    ball.hDirection = 1;

                    var attack = Math.min(1, Math.max(-1, (ball.attack * ball.vDirection) + playerRight.speed / speedRatio));

                    ball.attack = Math.abs(attack);
                    ball.vDirection = attack > 0 ? 1 : -1;

                    ball.spin = playerRight.speed / speedRatio;

                    activeBall = false;

                    ball.speed += 1;
                }

            }

            gamePlayerStateIn[playerPosition].zTrail = [];
        }

        ballLogic(playerLeft);
        ballLogic(playerRight);

        ball.obj.position.x += ball.hDirection * Math.cos(Math.PI * ball.attack / 4) * ball.speed;
        ball.obj.position.y += ball.vDirection * Math.sin(Math.PI * ball.attack / 4) * ball.speed;

        //logger.log(ball.obj.position.x, (ball.rightSpeed * ball.hDirection));

        if (ball.obj.position.x < -1300 && activeBall) {
            // console.log(`Score: [${playerLeft.score}, ${playerRight.score}]`);

            playerLeft.score++;

            if (playerLeft.score == winScore) {
                currentGameAction = GameAction.FinishGame;
                playerLeft.playerAction = PlayerAction.WinGame;
                playerRight.playerAction = PlayerAction.LooseGame;
            } else {
                currentGameAction = GameAction.StartPoint;
                playerRight.playerAction = PlayerAction.WinPoint;
                playerRight.playerAction = PlayerAction.LoosePoint;

            }

        }

        if (ball.obj.position.x > 1300 && activeBall) {
            // console.log(`Score: [${playerLeft.score}, ${playerRight.score}]`);

            playerRight.score++;

            if (playerRight.score == winScore) {
                currentGameAction = GameAction.FinishGame;
                playerRight.playerAction = PlayerAction.WinGame;
                playerLeft.playerAction = PlayerAction.LooseGame;
            } else {
                currentGameAction = GameAction.StartPoint;
                playerRight.playerAction = PlayerAction.WinPoint;
                playerLeft.playerAction = PlayerAction.LoosePoint;

            }
        }

        if (ball.obj.position.y > 700) {
            ball.vDirection = -1;
        } else if (ball.obj.position.y < -700) {
            ball.vDirection = 1;
        }

        backendApi.sendToAll<IGameState>({
            gameAction: currentGameAction,
            playerLeft: playerLeft,
            playerRight: playerRight,
            ballPosition: ball.obj.position,
            ballSpin: ball.spin,
            ballDirection: ball.vDirection
        });
    }

    var finishGameLogic = () => {
        if (playAgainDelay <= 0) {
            triggerGameEnd();
        }

        playAgainDelay--;
    }

    var triggerGameEnd = () => {
        currentGameAction = GameAction.AwaitingGameStart;

        console.log(`triggerGameEnd gameAction: ${currentGameAction}`);

        var exit = (gamePlayer: IPlayerState) => {

            // don't exit player if in lobby queue
            if (
                lobbyQueue.some(pos => { return pos.playerPosition == gamePlayer.playerPosition }) ||
                preLobbyQueue.some(pos => { return pos.playerPosition == gamePlayer.playerPosition }) ||
                skipQueue.some(pos => { return pos.playerPosition == gamePlayer.playerPosition })
            ) return;

            console.log(`Exiting Player: ${gamePlayer.nickname}, pos: ${gamePlayer.playerPosition}`)

            gamePlayer.playerAction = PlayerAction.Exit;

            backendApi.sendToPlayer<IPlayerState>({
                playerPosition: gamePlayer.playerPosition,
                playerState: gamePlayer

            });
        }

        exit(playerLeft);
        exit(playerRight);
    }

    var userExit = (playerPosition: number) => {

        console.log(`Player ${playerPosition} exited the game`);

        console.log("userExit lobbyQueue", lobbyQueue);
        console.log("userExit preLobbyQueue", preLobbyQueue);
        console.log("userExit skipQueue", skipQueue);
        console.log(`playerLeft.playerPosition: ${playerLeft.playerPosition}, playerRight.playerPosition: ${playerRight.playerPosition}`)

        // remove player from lobby queue (if queing)
        // lobbyQueue = 
        lobbyQueue.filter(p => {
            var res = playerPosition != p.playerPosition
            if (!res) {
                console.log(`player ${playerPosition} exited, removed from lobby queue`);
                return res;
            }
        });

        if (!(
            playerLeft.playerPosition == playerPosition ||
            playerRight.playerPosition == playerPosition) ||
            currentGameAction == GameAction.FinishGame) return;

        var exitPlayer = playerLeft.playerPosition == playerPosition ? playerLeft : playerRight;
        var nonExitPlayer = playerLeft.playerPosition == playerPosition ? playerRight : playerLeft;

        exitPlayer.playerAction = PlayerAction.Exit;
        nonExitPlayer.playerAction = PlayerAction.WinGame;

        currentGameAction = GameAction.FinishGame;

        console.log(`Player ${exitPlayer}, pos:${playerPosition} is exiting an active game, terminating game`);

        backendApi.sendToAll<IGameState>({
            gameAction: GameAction.Terminate,
            playerLeft: playerLeft,
            playerRight: playerRight,
            ballPosition: ball.obj.position,
            ballSpin: ball.spin,
            ballDirection: ball.vDirection
        });

    }

    backendApi.onPlayerExit()
        .subscribe(playerPosition => {
            userExit(playerPosition);
        });

    backendApi.onGameStop()
        .subscribe(() => {
        });

    backendApi.onGameStart()
        .subscribe(() => {
            // console.log(`From onGameStart`);
        });
}



