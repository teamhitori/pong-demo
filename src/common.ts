import { Vector3 } from "babylonjs";

export const __loop_speed = 100;

export interface IPlayerState {
    playerAction: PlayerAction;
    currentGameAction: GameAction;
    playerPosition: number;
    queuePosition: number;
    playerSide: PlayerSide;
    zPosition: number;
    score: number;
    isHit: boolean;
    speed: number;
    nickname: string;
}

export interface IGameState {
    gameAction: GameAction;
    playerLeft: IPlayerState;
    playerRight: IPlayerState;
    ballPosition: Vector3;
    ballSpin: number;
    ballDirection: number;
}

// export interface IPlayerEvent {
//     action: PlayerAction;
//     data: any;
// }

export enum GameScene {
    Intro,
    InGame
}

export enum GameAction {
    AwaitingGameStart = 0,
    StartGame = 1,
    StartPoint = 2,
    InServe = 3,
    InGame = 4,
    FinishGame = 5,
    Terminate = 6
};


export enum PlayerAction {
    AwaitingOpponent = 0,
    AwaitingChallenger = 1,
    StartServe = 2,
    CompleteServe = 3,
    AwaitServe = 4,
    SetPosition = 5,
    WinPoint = 6,
    LoosePoint = 7,
    WinGame = 8,
    LooseGame = 9,
    Enter = 10,
    Exit = 11,
    Queue = 12,
    InGame = 13,
    Lobby = 14,
    ImAlive = 15
};

export enum PlayerSide {
    Left,
    Right
};