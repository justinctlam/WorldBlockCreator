import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { AppState } from './AppState';
import IContext from './IContext';
import IState from './IState';
import LoginGui from './LoginGui';
import {
    ICreateChannelBodyData,
    ICreateChannelResponseData
} from './NetworkInterfaces'

export default class LoginState implements IState {
    private appContext: IContext;
    private camera: BABYLON.ArcRotateCamera;
    private userName: string = '';
    private loginGui: LoginGui = new LoginGui();
    private createChannelResponseData: ICreateChannelResponseData;

    constructor(appContext: IContext) {
        this.appContext = appContext;
    }

    public enter(): void {
        this.camera = this.createCamera(this.appContext.canvas, this.appContext.babylonScene);
        this.loginGui.onLoginClick = this.onLoginClick;
        this.loginGui.onInputTextChange = this.onInputTextChange;
        this.loginGui.create(this.appContext.canvas, this.appContext.babylonScene);
    }

    public exit(): void {
        this.appContext.createChannelResponseData = this.createChannelResponseData;
        this.appContext.userName = this.userName;

        this.camera.dispose();
        this.loginGui.dispose();
    }

    private onLoginClick = (eventData: GUI.Vector2WithInfo, eventState: BABYLON.EventState) => {
        if (this.userName !== '') {
            this.createChannel(
                this.appContext.pusher,
                this.appContext.canvas,
                this.appContext.babylonScene,
                this.loginGui,
                this.userName
            ).then((channelData: ICreateChannelResponseData) => {
                if (channelData.status === 'succeed') {
                    this.createChannelResponseData = channelData;
                    this.appContext.stateManager.changeToState(AppState.Run);
                } else if (channelData.status === 'failed') {
                    this.loginGui.showErrorMessage();
                }
            });
        }
    }

    private onInputTextChange = (eventData: GUI.InputText, eventState: BABYLON.EventState) => {
        const maxInputCharacters = 15;
        if (eventData.text.length > maxInputCharacters) {
            eventData.text = eventData.text.substr(0, maxInputCharacters);
        } else {
            this.userName = eventData.text;
        }
    };

    private createCamera(canvas: HTMLCanvasElement, babylonScene: BABYLON.Scene): BABYLON.ArcRotateCamera {
        const camera = new BABYLON.ArcRotateCamera(
            "EditorCamera",
            0,
            Math.PI / 4,
            50,
            BABYLON.Vector3.Zero(),
            babylonScene);
        camera.attachControl(canvas, true);
        return camera;
    }

    private createChannel(
        pusher: Pusher.Pusher,
        canvas: HTMLCanvasElement,
        babylonScene: BABYLON.Scene,
        loginGui: LoginGui,
        userName: string
    ): Promise<ICreateChannelResponseData> {
        const createChannelBodyData: ICreateChannelBodyData = {
            userName
        };
        loginGui.hideErrorMessage();
        return fetch('/api/createchannel', {
            body: JSON.stringify(createChannelBodyData),
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            method: 'post'
        }).then(res => res.json())
    }
}