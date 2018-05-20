import * as BABYLON from 'babylonjs';
import * as Pusher from 'pusher-js';
import IStateManager from './IStateManager';
import {
    ICreateChannelResponseData,
} from './NetworkInterfaces'

export default interface IContext {
    canvas: HTMLCanvasElement;
    babylonEngine: BABYLON.Engine;
    babylonScene: BABYLON.Scene;
    pusher: Pusher.Pusher;
    stateManager: IStateManager;
    userName: string;
    createChannelResponseData: ICreateChannelResponseData;
}
