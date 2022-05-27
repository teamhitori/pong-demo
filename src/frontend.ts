import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui'

import { IFrontendApi } from 'frakas/api'
import { GameAction, IGameState, IPlayerState, PlayerAction, PlayerSide } from "./common";
import {  KeyboardEventTypes, Mesh, PointerEventTypes } from "babylonjs";

import 'babylonjs-loaders';

export class Frontend {

    private _engine: BABYLON.Engine;
    private _canvas: HTMLCanvasElement;
    private _shouldRotate: boolean = false;
    private _canvasHolderEl: HTMLElement;
    private _canvasEl: HTMLElement | null;

    constructor(private frontEndApi: IFrontendApi) {

        // Get the canvas DOM element
        this._canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
        this._canvasHolderEl = document.getElementById('renderCanvas-holder') as any;
        this._canvasEl = document.getElementById('renderCanvas');

        this._canvasEl!!.style.touchAction = "none";
        this._canvasHolderEl!!.style.touchAction = "none"

        // Load the 3D engine
        this._engine = new BABYLON.Engine(this._canvas, true, { preserveDrawingBuffer: true, stencil: true });

        this._gameScene();


    }

    private async _gameScene() {

        var holder = document?.getElementById("renderCanvas-holder");

        if (holder) {
            holder.style.backgroundColor = "white";
        }

        // --- Game Scene ---
        var scene = new BABYLON.Scene(this._engine);
        scene.clearColor = new BABYLON.Color4(1, 1, 1, 1);

        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, -30, 190), scene);
        camera.inputs.clear();
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(this._canvas, false);

        var y = -300;
        var z = 1900;

        var reize = () => {

            var canvasHolderEl = document.getElementById('renderCanvas-holder') as any;
            this._shouldRotate = canvasHolderEl?.offsetHeight > canvasHolderEl?.offsetWidth;

            if (this._shouldRotate) {
                camera.upVector = new BABYLON.Vector3(3.1416, 0, 0);
                camera.position = new BABYLON.Vector3(0, -550, 3420);

                y = -700;
                z = 4260;
            } else {
                camera.upVector = new BABYLON.Vector3(0, 3.1416, 0);
                camera.position = new BABYLON.Vector3(0, -300, 1900);

                y = -350;
                z = 2010;
            }

            // console.log(`Current upVector:`, camera.upVector);
            // console.log(`offsetHeight: ${canvasHolderEl?.offsetHeight}, offsetWidth: ${canvasHolderEl?.offsetWidth}, shouldRotate: ${this._shouldRotate}`);

            this._resizeCanvasRatio();
            this._engine.resize();
        }


        var startGame = (shoe: BABYLON.AbstractMesh, ball: BABYLON.AbstractMesh) => {

            var lightH = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 0, 6000), scene);
            lightH.intensity = 0.4;

            var light = new BABYLON.PointLight("light", new BABYLON.Vector3(0, 1, 0), scene);
            light.position = new BABYLON.Vector3(0, 0, 1500);
            light.intensity = 0.5;
            // light.diffuse = new Color3(1, 1, 1);
            //light.specular = new Color3(0, 1, 1);

            // Effect.ShadersStore["customVertexShader"] = "precision highp float;\r\n" +
            //     "// Attributes\r\n" +
            //     "attribute vec3 position;\r\n" +
            //     "attribute vec3 normal;\r\n" +
            //     "// Uniforms\r\n" +
            //     "uniform mat4 world;\r\n" +
            //     "uniform mat4 worldViewProjection;\r\n" +
            //     "// Varying\r\n" +
            //     "varying vec3 vPositionW;\r\n" +
            //     "varying vec3 vNormalW;\r\n" +
            //     "void main(void) {\r\n" +
            //     "    vec4 outPosition = worldViewProjection * vec4(position, 1.0);\r\n" +
            //     "    gl_Position = outPosition;\r\n" +
            //     "    \r\n" +
            //     "    vPositionW = vec3(world * vec4(position, 1.0));\r\n" +
            //     "    vNormalW = normalize(vec3(world * vec4(normal, 0.0)));\r\n" +
            //     "}\r\n" +
            //     "    \r\n";

            // Effect.ShadersStore["customFragmentShader"] = "precision highp float;\r\n" +
            //     "// Lights\r\n" +
            //     "varying vec3 vPositionW;\r\n" +
            //     "varying vec3 vNormalW;\r\n" +
            //     "// Refs\r\n" +
            //     "uniform vec3 cameraPosition;\r\n" +
            //     "uniform sampler2D textureSampler;\r\n" +
            //     "void main(void) {\r\n" +
            //     "    vec3 color = vec3(1., 1.0, 1.0);\r\n" +
            //     "    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);\r\n" +
            //     "    // Fresnel\r\n" +
            //     "	float fresnelTerm = dot(viewDirectionW, vNormalW);\r\n" +
            //     "	fresnelTerm = clamp(fresnelTerm, 0., 1.);\r\n" +
            //     "    gl_FragColor = vec4(color * fresnelTerm, 1.);\r\n" +
            //     "}\r\n";

            // var shaderMaterial = new BABYLON.ShaderMaterial("shader", scene, {
            //     vertex: "custom",
            //     fragment: "custom",
            // },
            //     {
            //         attributes: ["position", "normal", "uv"],
            //         uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
            //     });
            // shaderMaterial.setVector3("cameraPosition", camera.position);
            // shaderMaterial.backFaceCulling = false;

            var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6000, height: 6000 }, scene);
            ground.rotation = new BABYLON.Vector3(1.57, 0, 0);
            ground.receiveShadows = true;
            ground.position = new BABYLON.Vector3(0, 0, -10);
            //ground.visibility = 0;

            var groundMaterial = new BABYLON.StandardMaterial(`groundMaterial`, scene);
            //groundMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);
            groundMaterial.backFaceCulling = false;
            groundMaterial.diffuseTexture = new BABYLON.Texture(`${this.frontEndApi.assetsRoot}/grass.jpg`, scene);
            console.log(`${this.frontEndApi.assetsRoot}/grass.jpg`);

            console.log(`${this.frontEndApi.assetsRoot}/profile.png`);

            ground.material = groundMaterial;

            var ground2 = BABYLON.MeshBuilder.CreateGround("ground", { width: 6000, height: 6000 }, scene);
            ground2.rotation = new BABYLON.Vector3(-1.57, 3.14, 0);
            ground2.position = new BABYLON.Vector3(0, 0, 50);

            // HUD
            var advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(ground2, 2048, 2048 * 1.5);

            var title = new GUI.TextBlock("title");
            title.fontFamily = "Helvetica";
            title.color = "black";
            title.fontSize = "90px";
            title.fontWeight = "bold"
            title.top = "-110px"
            advancedTexture.addControl(title);

            var subTitle = new GUI.TextBlock("subTitle");
            subTitle.fontFamily = "Helvetica";
            subTitle.color = "black";
            subTitle.fontSize = "70px";
            subTitle.top = "80px"
            advancedTexture.addControl(subTitle);

            var extraTitle = new GUI.TextBlock("extraTitle");
            extraTitle.fontFamily = "Helvetica";
            extraTitle.color = "black";
            extraTitle.fontSize = "50px";
            extraTitle.top = "240px"
            extraTitle.alpha = 0;
            advancedTexture.addControl(extraTitle);

            var playerLeftTitle = new GUI.TextBlock("playerLeftTitle");
            playerLeftTitle.fontFamily = "Helvetica";
            playerLeftTitle.text = `Player 1`;
            playerLeftTitle.color = "black";
            playerLeftTitle.fontSize = "40px";
            playerLeftTitle.top = "-400px"
            playerLeftTitle.left = "-270px"
            advancedTexture.addControl(playerLeftTitle);

            var playerLeftScore = new GUI.TextBlock("playerLeftScore");
            playerLeftScore.fontFamily = "Helvetica";
            playerLeftScore.text = `0`;
            playerLeftScore.color = "black";
            playerLeftScore.fontSize = "80px";
            playerLeftScore.top = "-300px"
            playerLeftScore.left = "-270px"
            advancedTexture.addControl(playerLeftScore);

            var playerRightTitle = new GUI.TextBlock("playerRightTitle");
            playerRightTitle.fontFamily = "Helvetica";
            playerRightTitle.text = `Player 2`;
            playerRightTitle.color = "black";
            playerRightTitle.fontSize = "40px";
            playerRightTitle.top = "-400px"
            playerRightTitle.left = "270px"
            advancedTexture.addControl(playerRightTitle);

            var playerRightScore = new GUI.TextBlock("playerRightScore");
            playerRightScore.fontFamily = "Helvetica";
            playerRightScore.text = `0`;
            playerRightScore.color = "black";
            playerRightScore.fontSize = "80px";
            playerRightScore.top = "-300px"
            playerRightScore.left = "270px"
            advancedTexture.addControl(playerRightScore);

            var button = GUI.Button.CreateSimpleButton("button", "Play Again?");
            button.width = "500px";
            button.height = "180px";
            button.color = "black";
            button.background = "white";
            button.paddingBottom = "20px";
            button.fontSize = "70px";
            button.top = "30000px";
            button.alpha = 0;
            button.zIndex = 100;

            var input = new GUI.InputText();
            input.width = "500px";
            input.height = "180px";
            input.paddingBottom = "20px";
            input.fontSize = "70px";
            input.top = "50px";
            input.alpha = 0;
            input.zIndex = 100;
            //input.text = "";
            input.color = "red";
            input.background = "white";
            advancedTexture.addControl(input);

            input.onTextChangedObservable.add(event => {
                myNickname = event.text.substring(0, 15);
                console.log(myNickname);

            })


            var hasEntered = false;
            var myNickname = "";


            advancedTexture.addControl(button);

            // Game
            var playAreaHeight = 700;
            //const colorR = new BABYLON.Color3(1, 0.2, 0);
            //const colorG = new BABYLON.Color3(0.2, 1, 0);
            const colorY = new BABYLON.Color3(1, 1, 0);
            const colorW = new BABYLON.Color3(1, 1, 1);
            var keyUp = false;
            var keyDown = false;

            var myPlayerState: IPlayerState | null;
            var myPlayerObj: BABYLON.AbstractMesh;
            var otherPlayerObj: BABYLON.AbstractMesh;

            var playerLeftState: IPlayerState = <IPlayerState>{
                currentGameAction: GameAction.AwaitingGameStart,
                isHit: false,
                playerAction: PlayerAction.Lobby,
                playerPosition: 0,
                playerSide: PlayerSide.Left,
                queuePosition: 0,
                score: 0,
                speed: 0,
                zPosition: 0
            };

            var playerRightState: IPlayerState = <IPlayerState>{
                currentGameAction: GameAction.AwaitingGameStart,
                isHit: false,
                playerAction: PlayerAction.Lobby,
                playerPosition: 0,
                playerSide: PlayerSide.Right,
                queuePosition: 0,
                score: 0,
                speed: 0,
                zPosition: 0
            };
            var currentGameAction: any;

            //var ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 100, segments: 32 }, scene);
            var ballMaterial = new BABYLON.StandardMaterial(`ball-mat`, scene);
            ballMaterial.diffuseTexture = new BABYLON.Texture(`${this.frontEndApi.assetsRoot}/10536_soccerball_V1_diffuse.jpg`, scene);
            ball.material = ballMaterial;
            ball.position = new BABYLON.Vector3(1000, 0, 100);
            ball.scaling = new BABYLON.Vector3(15, 15, 15);
            //ball.visibility = 0;

            var blockLeft = shoe; // BABYLON.MeshBuilder.CreateBox(`blockLeft`, { height: 400, width: 100, depth: 100 });
            var blockLeftMaterial = new BABYLON.StandardMaterial(`blockLeft-mat`, scene);
            blockLeft.material = blockLeftMaterial;
            blockLeftMaterial.diffuseTexture = new BABYLON.Texture(`${this.frontEndApi.assetsRoot}/10149_RunningShoe_v02.jpg`, scene);
            blockLeft.position = new BABYLON.Vector3(1200, 0, 100);
            blockLeft.scaling = new BABYLON.Vector3(15, 15, 15);

            var blockRight = shoe.clone("", null, true)!!;  //BABYLON.MeshBuilder.CreateBox(`blockRight`, { height: 400, width: 100, depth: 100 });
            var blockRightMaterial = new BABYLON.StandardMaterial(`blockRight-mat`, scene);
            blockRight.material = blockRightMaterial;
            blockRightMaterial.diffuseTexture = new BABYLON.Texture(`${this.frontEndApi.assetsRoot}/10149_RunningShoe_v02.jpg`, scene);
            blockRight.position = new BABYLON.Vector3(-1200, 0, 100);
            blockRight.rotate(new BABYLON.Vector3(0, 0, 1), Math.PI)
            blockLeft.scaling = new BABYLON.Vector3(15, 15, 15);

            var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
            shadowGenerator.addShadowCaster(ball);
            shadowGenerator.addShadowCaster(blockLeft);
            shadowGenerator.addShadowCaster(blockRight);
            shadowGenerator.useExponentialShadowMap = true;

            var footHit: BABYLON.Sound | undefined;
            var bounce: BABYLON.Sound | undefined;
            var tap: BABYLON.Sound | undefined;
            var game: BABYLON.Sound | undefined;
            var match: BABYLON.Sound | undefined;
            var start: BABYLON.Sound | undefined;

            var shoulPlayRightHit = false;
            var shoulPlayLeftHit = false;
            var ballPrevDirection = 1;

            var setPlay = () => {
                title.text = `PONG`;
                button.textBlock!!.text = `Play`;
                button.alpha = 1;
                button.top = "250px";
                title.alpha = 1;
                subTitle.alpha = 0;
                extraTitle.alpha = 0;
                input.alpha = 0;
                ball.visibility = 1;
                myPlayerState = null;
            }

            var setEnter = () => {

                footHit = new BABYLON.Sound("foot-hit", `${this.frontEndApi.assetsRoot}/foot-hit.mp3`, scene);
                bounce = new BABYLON.Sound("bounce", `${this.frontEndApi.assetsRoot}/bounce.mp3`, scene);
                tap = new BABYLON.Sound("tap", `${this.frontEndApi.assetsRoot}/tap.mp3`, scene);
                game = new BABYLON.Sound("game", `${this.frontEndApi.assetsRoot}/game.mp3`, scene);
                match = new BABYLON.Sound("match", `${this.frontEndApi.assetsRoot}/match.mp3`, scene);
                start = new BABYLON.Sound("start", `${this.frontEndApi.assetsRoot}/cartoon-jump-6462.mp3`, scene);

                title.text = `Enter nickname`;
                button.textBlock!!.text = `Enter`;
                button.alpha = 1;
                button.top = "250px";
                title.alpha = 1;
                subTitle.alpha = 0;
                extraTitle.alpha = 0;
                ball.visibility = 0;
                input.alpha = 1;
                myPlayerState = null;

                this.frontEndApi.playerEnter();

                this.frontEndApi.sendToBackend(<IPlayerState>{
                    playerAction: PlayerAction.Queue
                });
            }

            setPlay();

            var enterGame = () => {

                if (!myNickname) return;

                button.top = "30000px";
                button.alpha = 0;
                input.alpha = 0;
                title.text = `Hi ${myNickname}`;

                console.log(`${myNickname} enter`);

                this._canvasEl!!.style.touchAction = "none";
                this._canvasHolderEl!!.style.touchAction = "none"

                this.frontEndApi.sendToBackend(<IPlayerState>{
                    playerAction: PlayerAction.Enter,
                    nickname: myNickname
                });


                if (!hasEntered) {
                    start?.play();
                }

                hasEntered = true;
            };

            var startServe = () => {

                console.log("SERVE!!", GameAction[currentGameAction], myPlayerState);

                if (currentGameAction == GameAction.InServe &&
                    myPlayerState &&
                    myPlayerState.playerAction == PlayerAction.StartServe) {
                    myPlayerState.playerAction = PlayerAction.CompleteServe;
                    // console.log("SERVE!!");
                    // console.log(`myPlayer.playerAction: ${myPlayer.playerAction}`);
                    this.frontEndApi.sendToBackend(<IPlayerState>{
                        playerAction: PlayerAction.CompleteServe
                    });
                }
            }

            this.frontEndApi.onPrivateEvent<IPlayerState>()
                .subscribe((state) => {

                    console.log(`onPrivateEvent`, state);

                    if (state.playerAction == PlayerAction.Exit) {
                        setPlay()
                    }

                    if (state.playerAction == PlayerAction.Lobby) {

                        // console.log(`onPlayerEvent is Lobby`);

                        if (state.currentGameAction == GameAction.AwaitingGameStart && state.queuePosition == 0) {
                            // console.log("Waiting for your apponent");
                            subTitle.text = "Waiting for your apponent";
                            title.text = `${state.nickname}`;

                            //blockLeftMaterial.diffuseColor = colorB;
                            //blockRightMaterial.diffuseColor = colorB;
                            ball.position = new BABYLON.Vector3(0, 0, 100);
                            playerLeftState.zPosition = 0
                            playerRightState.zPosition = 0

                        } else {
                            // console.log(`Game in progress, queue position ${state.data.queuePosition}`);
                            title.text = `${state.nickname}`;
                            subTitle.text = `Game in progress`;
                            extraTitle.text = `queue position ${state.queuePosition}`;

                            extraTitle.alpha = 1;
                        }

                        title.alpha = 1;
                        subTitle.alpha = 1;
                        ball.visibility = 1

                    } else {
                        // console.log(`onPlayerEvent not is Lobby`);
                    }

                    if (state.playerAction == PlayerAction.StartServe ||
                        state.playerAction == PlayerAction.AwaitServe) {
                        console.log(`Start Game MySide:${PlayerSide[state.playerSide]} , MyPosition:${state.playerPosition}`)
                        myPlayerState = state;

                        myPlayerObj = myPlayerState.playerSide == PlayerSide.Left ? blockLeft : blockRight;
                        otherPlayerObj = myPlayerState.playerSide == PlayerSide.Left ? blockRight : blockLeft;
                    }
                })

            this.frontEndApi.onPublicEvent<IGameState>()
                .subscribe((state) => {

                    console.log('onPublicEvent', state);

                    if (state.gameAction && currentGameAction != state.gameAction) {
                        currentGameAction = state.gameAction;

                        // console.log(`GameAction: ${state.gameAction}`);

                        //blockLeftMaterial.diffuseColor = colorB;
                        //blockRightMaterial.diffuseColor = colorB;
                        ball.position = new BABYLON.Vector3(0, 0, 100);
                        playerLeftState.zPosition = 0
                        playerRightState.zPosition = 0


                        if (currentGameAction == GameAction.StartPoint) {

                            game?.play();
                            var totalScore = state.playerLeft.score +
                                state.playerRight.score;

                            var winner = state.playerLeft.playerAction == PlayerAction.WinPoint ?
                                state.playerLeft :
                                state.playerRight;

                            playerLeftTitle.text = `${state.playerLeft.nickname}`;
                            playerRightTitle.text = `${state.playerRight.nickname}`;
                            playerLeftScore.text = `${state.playerLeft.score}`;
                            playerRightScore.text = `${state.playerRight.score}`;


                            if (myPlayerState) {
                                title.alpha = 1;
                                subTitle.alpha = 1;
                                extraTitle.alpha = 0;

                                subTitle.text = `Round ${totalScore + 1}`;
                                if (totalScore == 0) {
                                    title.text = "Best of 5";
                                } else if (state.playerLeft.score == 2 ||
                                    state.playerRight.score == 2) {
                                    title.text = "Match point";
                                } else {
                                    title.text = `Point ${winner.nickname}`;
                                }
                            }
                        }

                        if (currentGameAction == GameAction.InServe) {
                            if (myPlayerState) {
                                title.alpha = 0;
                                subTitle.alpha = 0;
                                extraTitle.alpha = 0;
                            }

                            playerLeftState.playerAction = state.playerLeft.playerAction;
                            playerRightState.playerAction = state.playerRight.playerAction;
                        }

                        if (currentGameAction == GameAction.FinishGame) {

                            match?.play();
                            var winner = state.playerLeft.playerAction == PlayerAction.WinGame ?
                                state.playerLeft :
                                state.playerRight;

                            if (myPlayerState) {
                                title.text = `${winner.nickname} wins!!`

                                if (winner.playerPosition == myPlayerState.playerPosition) {
                                    button.textBlock!!.text = `Stay on?`;
                                } else {
                                    button.textBlock!!.text = `Play next?`;
                                }

                                title.alpha = 1;
                                subTitle.alpha = 0;
                                button.alpha = 1;
                                button.top = "300px";

                                myPlayerState = null;
                            }
                        }

                        if (currentGameAction == GameAction.Terminate) {

                            match?.play();
                            var exitSide = state.playerLeft.playerAction == PlayerAction.Exit ?
                                playerLeftState :
                                playerRightState;

                            if (myPlayerState) {
                                title.text = `${exitSide.nickname} exited`
                                button.textBlock!!.text = `Play Next?`;

                                title.alpha = 1;
                                subTitle.alpha = 0;
                                button.alpha = 1;
                                button.top = "300px";

                                myPlayerState = null;
                            }
                        }
                    }

                    playerLeftState = state.playerLeft;
                    playerRightState = state.playerRight

                    if (state?.playerLeft?.isHit) {
                        blockLeftMaterial.diffuseColor = colorY;

                        if (shoulPlayLeftHit) {
                            shoulPlayLeftHit = false;
                            footHit?.play();
                        }
                    } else {
                        shoulPlayLeftHit = true;
                        blockLeftMaterial.diffuseColor = colorW;
                    }

                    if (state?.playerRight?.isHit) {
                        blockRightMaterial.diffuseColor = colorY;

                        if (shoulPlayRightHit) {
                            shoulPlayRightHit = false;
                            footHit?.play();
                        }
                    } else {
                        shoulPlayRightHit = true;
                        blockRightMaterial.diffuseColor = colorW;
                    }

                    if (state.gameAction == GameAction.InServe &&
                        myPlayerState &&
                        myPlayerState.playerAction == PlayerAction.StartServe) {

                        // console.log("my serve");
                    } else {

                        // console.log("not my serve");

                        if (state.ballPosition && hasEntered) {
                            ball.position = state.ballPosition;

                            if (state.ballDirection * ballPrevDirection < 0) {
                                bounce?.play();
                            }

                            if (state.gameAction != GameAction.InServe) {

                                // console.log(`Ball spin: ${state.ballSpin}`);
                            }
                        }

                    }

                    // ball.rotate(new BABYLON.Vector3(0, 0, 1), 0.05);


                    if (myPlayerObj) {
                        otherPlayerObj.position.y = myPlayerState?.playerSide == PlayerSide.Left ? playerRightState.zPosition : playerLeftState.zPosition;
                    } else if (hasEntered) {
                        blockLeft.position.y = playerLeftState.zPosition;
                        blockRight.position.y = playerRightState.zPosition;
                    }

                    ballPrevDirection = state.ballDirection;
                });

            this.frontEndApi.onGameStop()
                .then(() => {
                    // console.log(`From onStopState`, state);

                    //nextSceneType = GameScene.Outro;
                });



            scene.registerBeforeRender(() => {

                camera.position = new BABYLON.Vector3(0, y, z);

                if (myPlayerState) {
                    if (keyUp) {
                        myPlayerObj.position.y += 50;
                    } else if (keyDown) {
                        myPlayerObj.position.y -= 50;
                    }

                    if (myPlayerObj.position.y > playAreaHeight) {
                        myPlayerObj.position.y = playAreaHeight;
                    } else if (myPlayerObj.position.z < -playAreaHeight) {
                        myPlayerObj.position.y = -playAreaHeight;
                    }

                    if (currentGameAction == GameAction.InServe) {
                        if (myPlayerState.playerAction == PlayerAction.StartServe) {
                            if (myPlayerState.playerSide == PlayerSide.Left) {
                                ball.position = new BABYLON.Vector3(1000, myPlayerObj.position.y, 100);
                            } else {
                                ball.position = new BABYLON.Vector3(-1000, myPlayerObj.position.y, 100);
                            }
                        }
                    }

                    this.frontEndApi.sendToBackend<IPlayerState>({
                        playerAction: PlayerAction.SetPosition,
                        zPosition: +myPlayerObj.position.y
                    } as IPlayerState);
                }

            });

            var i = 0

            scene.onPointerObservable.add((pointerInfo) => {

                //console.log(pointerInfo.type);

                switch (pointerInfo.type) {
                    case PointerEventTypes.POINTERDOWN:
                        break;
                    case PointerEventTypes.POINTERUP:
                        break;
                    case PointerEventTypes.POINTERMOVE:
                        break;
                    case PointerEventTypes.POINTERWHEEL:
                        break;
                    case PointerEventTypes.POINTERPICK:
                        break;
                    case PointerEventTypes.POINTERTAP:
                        if (myPlayerState) {
                            startServe();
                        } else if (myNickname) {
                            enterGame()
                        } else {
                            setEnter()
                        }

                        break;
                    case PointerEventTypes.POINTERDOUBLETAP:
                        break;
                }

                if (myPlayerState) {
                    var offset = (this._shouldRotate) ? pointerInfo.event.target.width - pointerInfo.event.offsetX : pointerInfo.event.offsetY;
                    var innerSize = this._shouldRotate ? pointerInfo.event.target.width : pointerInfo.event.target.height;
                    var playerPosH = ((0.5 - (offset / innerSize)) * 2) * playAreaHeight;
                    myPlayerObj.position.y = playerPosH;
                }
            });

            scene.onKeyboardObservable.add((kbInfo) => {
                switch (kbInfo.type) {
                    case KeyboardEventTypes.KEYDOWN:
                        // console.log("KEY DOWN: ", kbInfo.event.key);
                        if (kbInfo.event.key == "ArrowUp") {
                            keyUp = true;
                            z += 10;

                        } else if (kbInfo.event.key == "ArrowDown") {
                            keyDown = true;
                            z -= 10;

                        } else if (kbInfo.event.key == "ArrowLeft") {
                            //keyLeft = true;
                            y += 10;

                        } else if (kbInfo.event.key == "ArrowRight") {
                            //keyRight = true;
                            y -= 10;

                        }
                        break;
                    case KeyboardEventTypes.KEYUP:
                        // console.log("KEY UP: ", kbInfo.event);
                        if (kbInfo.event.key == "ArrowUp") {
                            keyUp = false;
                        } else if (kbInfo.event.key == "ArrowDown") {
                            keyDown = false;
                        } else if (kbInfo.event.key == "ArrowLeft") {
                            //keyLeft = false;
                        } else if (kbInfo.event.key == "ArrowRight") {
                            //keyRight = false;
                        } else if (kbInfo.event.key == "Space") {
                            startServe();
                        }
                        break;
                }

                console.log(`y:${y},z:${z}`);
            });

        }

        var shoe = await new Promise<BABYLON.AbstractMesh>((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(null, `${this.frontEndApi.assetsRoot}/`, "shoe.obj", scene, function (meshes, particleSystems, skeletons) {
                resolve(meshes[0]);
            });
        });

        var ball = await new Promise<BABYLON.AbstractMesh>((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(null, `${this.frontEndApi.assetsRoot}/`, "ball.obj", scene, function (meshes, particleSystems, skeletons) {
                resolve(meshes[0]);
            });
        });

        startGame(shoe, ball);

        this._engine.runRenderLoop(() => {
            scene?.render();
        });

        window.addEventListener('orientationchange', () => {
            reize();

            setTimeout(() => this._engine.resize(), 5000);
        });

        // the canvas/window resize event handler
        window.addEventListener('resize', () => {
            reize();
        });

        reize();
    }

    openFullscreen() {
        document.getElementsByTagName("BODY")[0].requestFullscreen();
    }

    private _resizeCanvasRatio() {

        var screenRatio: number = 2;
        var offsetW = 5;
        var offsetH = 5;

        //console.log(`offsetHeight: ${canvasHolderEl?.offsetHeight}, offsetWidth: ${canvasHolderEl?.offsetWidth}, shouldRotate: ${shouldRotate}`);

        var width = this._shouldRotate ? this._canvasHolderEl?.offsetHeight - offsetH : this._canvasHolderEl?.offsetWidth - offsetW;
        var height = this._shouldRotate ? this._canvasHolderEl?.offsetWidth - offsetW : this._canvasHolderEl?.offsetHeight - offsetH;

        var maxHeight = height * (1 / screenRatio);
        var maxWidth = width * screenRatio;

        var [widthNew, heightNew] = this._calculateDimentions(width, height, maxWidth, maxHeight, screenRatio);

        if (this._shouldRotate) {
            this._canvasEl?.setAttribute('style', `width: ${heightNew}px; height: ${widthNew}px;`);
            console.log(`canvas width: ${heightNew}px; height: ${widthNew}px; ratio: ${widthNew / heightNew}`);
        } else {
            this._canvasEl?.setAttribute('style', `width: ${widthNew}px; height: ${heightNew}px;`);
            console.log(`canvas width: ${widthNew}px; height: ${heightNew}px; ratio: ${widthNew / heightNew}`)
        }
    }

    private _calculateDimentions(width: number, height: number, maxWidth: number, maxHeight: number, screenRatio: number): [number, number] {
        if (maxHeight > height) {
            width = (height) * screenRatio;
            height = height;
        } else if (maxWidth > width) {
            width = (width);
            height = (width) / screenRatio;
        }
        return [width, height]
    }
}


interface IPlayer {
    obj: Mesh
}