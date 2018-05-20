import * as BABYLON from 'babylonjs';
import * as Pusher from 'pusher-js';
import * as React from 'react';
import './App.css';
import { AppState } from './AppState';
import IContext from './IContext';
import IState from './IState';
import IStateManager from './IStateManager';
import LoginState from './LoginState';
import RunState from './RunState';

class App extends React.Component implements IStateManager {
  private appContext: IContext = {} as IContext;
  private currentState: IState;

  public componentDidMount() {
    this.appContext.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    this.appContext.babylonEngine = this.createBabylonEngine(this.appContext.canvas);
    this.appContext.babylonScene = this.createBabylonScene(this.appContext.babylonEngine);
    this.appContext.pusher = this.createPusher();
    this.appContext.stateManager = this;
    this.createSkyBox(this.appContext.babylonScene);
    this.changeToState(AppState.Login);

    this.appContext.babylonEngine.runRenderLoop(() => {
      this.appContext.babylonScene.render();
    });
    window.addEventListener("resize", () => {
      this.appContext.babylonEngine.resize();
    });
  }

  public render() {
    return (
      <div className="App" />
    );
  }

  public changeToState(appState: AppState) {
    if (this.currentState) {
      this.currentState.exit();
    }
    switch (appState) {
      case AppState.Login:
        this.currentState = new LoginState(this.appContext);
        break;
      case AppState.Run:
        this.currentState = new RunState(this.appContext);
        break;
    }
    if (this.currentState) {
      this.currentState.enter();
    }
  }

  private createSkyBox(babylonScene: BABYLON.Scene): void {
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 10000.0 }, babylonScene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", babylonScene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("skybox", babylonScene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
  }

  private createBabylonEngine(canvas: HTMLCanvasElement): BABYLON.Engine {
    const engine = new BABYLON.Engine(canvas, true);
    return engine;
  }

  private createBabylonScene(babylonEngine: BABYLON.Engine): BABYLON.Scene {
    const scene = new BABYLON.Scene(babylonEngine);
    return scene;
  }

  private createPusher(): Pusher.Pusher {
    // (Pusher as any).logToConsole = true;

    const pusher = new Pusher('9370f60e9387ec570c51', {
      cluster: 'us2',
      encrypted: true
    });
    return pusher;
  }
}

export default App;
