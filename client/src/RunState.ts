import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import * as Pusher from 'pusher-js';
import * as uuid from 'uuid';
import IContext from './IContext';
import IState from './IState';
import {
    IAddBoxData,
    IBoxData,
    ICreateChannelResponseData,
    IMemberData,
    PusherEvent
} from './NetworkInterfaces'
import RunGui from './RunGui';

enum CameraState {
    Editor,
    Spectator
}

enum MouseButton {
    Left = 0,
    Right = 2
}

export default class RunState implements IState {
    private appContext: IContext;
    private editorCamera: BABYLON.ArcRotateCamera;
    private spectatorCamera: BABYLON.UniversalCamera;
    private cameraState: CameraState;
    private shadowGenerator: BABYLON.ShadowGenerator;
    private blockColor: BABYLON.Color3 = BABYLON.Color3.Red();
    private pointerDownPosition: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private otherUserNames: string[] = [];
    private runGui: RunGui = new RunGui();

    constructor(appContext: IContext) {
        this.appContext = appContext
    }

    public enter(): void {
        this.createCameras(this.appContext.canvas, this.appContext.babylonScene);
        this.createLights(this.appContext.babylonScene);
        this.createInput(
            this.appContext.babylonScene,
            this.appContext.createChannelResponseData.positionIndex,
            this.appContext.userName,
            this.appContext.createChannelResponseData.channelName)

        this.runGui.onEditorClick = this.onEditorClick;
        this.runGui.onSpectatorClick = this.onSpectatorClick;
        this.runGui.onResetCameraClick = this.onResetCameraClick;
        this.runGui.onColorValueChanged = this.onColorValueChanged;
        this.runGui.create(this.appContext.canvas, this.appContext.babylonScene);
        this.runGui.initialColorPickerColor = this.blockColor;
        this.runGui.updateUserNamePanel([this.appContext.userName]);

        const positionIndex = this.appContext.createChannelResponseData.positionIndex;
        this.updateEditorCamera(positionIndex, this.appContext.babylonScene);
        this.createGround(positionIndex, this.appContext.userName, this.appContext.babylonScene);
        this.createNamePlate(positionIndex, this.appContext.babylonScene, this.appContext.userName);
        this.subscribeToChannel(
            this.appContext.createChannelResponseData,
            this.appContext.pusher,
            this.appContext.babylonScene,
            this.appContext.userName,
            this.runGui);
    }

    public exit(): void {
        this.runGui.dispose();
        this.editorCamera.dispose();
        this.spectatorCamera.dispose();
    }

    private onColorValueChanged = (eventData: BABYLON.Color3, eventState: BABYLON.EventState) => {
        this.blockColor.copyFrom(eventData);
    };

    private onResetCameraClick = (eventData: GUI.Vector2WithInfo, eventState: BABYLON.EventState) => {
        const positionIndex = this.appContext.createChannelResponseData.positionIndex;
        if (this.cameraState === CameraState.Editor) {
            this.updateEditorCamera(positionIndex, this.appContext.babylonScene);
        } else if (this.cameraState === CameraState.Spectator) {
            this.updateSpectatorCamera(positionIndex, this.appContext.babylonScene);
        }
    };

    private onEditorClick = (eventData: GUI.Vector2WithInfo, eventState: BABYLON.EventState) => {
        const positionIndex = this.appContext.createChannelResponseData.positionIndex;
        if (this.cameraState === CameraState.Spectator) {
            this.runGui.enableSpectatorButton();
            this.runGui.showEditorControlInstructions();
            this.cameraState = CameraState.Editor;
            this.changeToCamera(
                this.cameraState,
                this.appContext.babylonScene,
                positionIndex,
                this.appContext.canvas);
        }
    };

    private onSpectatorClick = (eventData: GUI.Vector2WithInfo, eventState: BABYLON.EventState) => {
        const positionIndex = this.appContext.createChannelResponseData.positionIndex;
        if (this.cameraState === CameraState.Editor) {
            this.runGui.enableEditorButton();
            this.runGui.showSpectatorControlInstructions();
            this.cameraState = CameraState.Spectator
            this.changeToCamera(
                this.cameraState,
                this.appContext.babylonScene,
                positionIndex,
                this.appContext.canvas);
        }
    };

    private subscribeToChannel(
        createChannelResponseData: ICreateChannelResponseData,
        pusher: Pusher.Pusher,
        babylonScene: BABYLON.Scene,
        userName: string,
        runGui: RunGui
    ): void {
        const channel = pusher.subscribe(createChannelResponseData.channelName);
        createChannelResponseData.otherMemberData.forEach((otherPlayers: { memberData: IMemberData, boxesData: IBoxData[] }) => {
            const memberData = otherPlayers.memberData
            const boxesData = otherPlayers.boxesData
            this.createGround(memberData.positionIndex, memberData.userName, babylonScene);
            this.createNamePlate(memberData.positionIndex, babylonScene, memberData.userName);
            this.otherUserNames.push(memberData.userName);
            boxesData.forEach(box => {
                const position = new BABYLON.Vector3(box.position.x, box.position.y, box.position.z);
                const color = new BABYLON.Color3(box.color.r, box.color.g, box.color.b);
                this.createBox(babylonScene, box.id, memberData.userName, position, color);
            });
        });
        this.runGui.updateUserNamePanel([userName].concat(this.otherUserNames));

        channel.bind(PusherEvent.AddBox, (addboxData: IAddBoxData) => {
            const boxData = addboxData.boxData;
            const position = new BABYLON.Vector3(boxData.position.x, boxData.position.y, boxData.position.z);
            const color = new BABYLON.Color3(boxData.color.r, boxData.color.g, boxData.color.b);
            this.createBox(babylonScene, boxData.id, addboxData.userName, position, color);
        });

        channel.bind(PusherEvent.RemoveBox, (data: IBoxData) => {
            const mesh = babylonScene.getMeshByID(data.id);
            if (mesh) {
                mesh.dispose();
            }
        });

        channel.bind(PusherEvent.NewMember, (data: IMemberData) => {
            this.createGround(data.positionIndex, data.userName, babylonScene);
            this.createNamePlate(data.positionIndex, babylonScene, data.userName);

            this.otherUserNames.push(data.userName);
            this.runGui.updateUserNamePanel([userName].concat(this.otherUserNames));
        });

        channel.bind(PusherEvent.RemoveMember, (data: IMemberData) => {
            this.otherUserNames = this.otherUserNames.filter((otherUserName: string) => otherUserName !== data.userName);
            babylonScene.meshes
                .filter(mesh => BABYLON.Tags.MatchesQuery(mesh, data.userName))
                .forEach(mesh => {
                    mesh.dispose();
                })
            this.runGui.updateUserNamePanel([userName].concat(this.otherUserNames));
        });
    }

    private createCameras(canvas: HTMLCanvasElement, babylonScene: BABYLON.Scene): void {
        this.editorCamera = new BABYLON.ArcRotateCamera(
            "EditorCamera",
            0,
            Math.PI / 4,
            50,
            BABYLON.Vector3.Zero(),
            babylonScene);

        this.spectatorCamera = new BABYLON.UniversalCamera(
            'SpectatorCamera',
            BABYLON.Vector3.Zero(),
            babylonScene
        );

        this.cameraState = CameraState.Editor;
        this.editorCamera.attachControl(canvas, true);
    }

    private createLights(babylonScene: BABYLON.Scene): void {
        const light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(-1, 1, 0), babylonScene);
        light1.name = '';
        const light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(0, -1, 0), babylonScene);
        light2.name = '';
        light2.position = new BABYLON.Vector3(0, 100, 0);
        light2.intensity = 0.2;
        this.shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);
    }

    private changeToCamera(
        cameraSate: CameraState,
        babylonScene: BABYLON.Scene,
        positionIndex: number,
        canvas: HTMLCanvasElement
    ): void {
        if (cameraSate === CameraState.Spectator) {
            babylonScene.setActiveCameraByID(this.spectatorCamera.id);
            this.spectatorCamera.position = this.editorCamera.position;
            this.spectatorCamera.setTarget(this.editorCamera.target);
            this.editorCamera.detachControl(canvas);
            this.spectatorCamera.attachControl(canvas, true);
        } else if (cameraSate === CameraState.Editor) {
            babylonScene.setActiveCameraByID(this.editorCamera.id);
            this.updateEditorCamera(positionIndex, babylonScene);
            this.spectatorCamera.detachControl(canvas);
            this.editorCamera.attachControl(canvas, true);
        }
    }

    private updateEditorCamera(positionIndex: number, babylonScene: BABYLON.Scene): void {
        this.editorCamera.setPosition(this.getLocation(positionIndex).add(new BABYLON.Vector3(0, 50, 1)));
        this.editorCamera.setTarget(this.getLocation(positionIndex));
    }

    private updateSpectatorCamera(positionIndex: number, babylonScene: BABYLON.Scene): void {
        this.spectatorCamera.position = this.getLocation(positionIndex).add(new BABYLON.Vector3(0, 50, 50));
        this.spectatorCamera.setTarget(this.getLocation(positionIndex));
    }

    private getLocation(positionIndex: number): BABYLON.Vector3 {
        const spiralLocation = this.spiral(positionIndex + 1);
        return new BABYLON.Vector3(spiralLocation.x * 100, 0, spiralLocation.y * 100);
    }

    private createGround(positionIndex: number, tag: string, babylonScene: BABYLON.Scene): void {
        const newGround = BABYLON.MeshBuilder.CreateBox(
            'groundBox',
            {
                depth: 30,
                height: 5,
                width: 30
            },
            babylonScene);
        newGround.position = this.getLocation(positionIndex);
        newGround.receiveShadows = true;
        BABYLON.Tags.AddTagsTo(newGround, `${tag}`);
    }

    private createBox(
        babylonScene: BABYLON.Scene,
        id: string,
        tag: string,
        position: BABYLON.Vector3,
        color: BABYLON.Color3
    ): BABYLON.Mesh {
        const box = BABYLON.MeshBuilder.CreateBox('box', { size: 1 });
        BABYLON.Tags.AddTagsTo(box, `object ${tag}`);
        box.position = position;
        box.id = id;
        const material = new BABYLON.StandardMaterial('', babylonScene);
        material.diffuseColor = color;
        box.material = material;
        box.actionManager = new BABYLON.ActionManager(babylonScene);
        box.actionManager.registerAction(new BABYLON.SetValueAction(
            BABYLON.ActionManager.OnPointerOverTrigger,
            box.material,
            'diffuseColor',
            BABYLON.Color3.Blue()
        ));
        box.actionManager.registerAction(new BABYLON.SetValueAction(
            BABYLON.ActionManager.OnPointerOutTrigger,
            box.material,
            'diffuseColor',
            color
        ));

        const shadowMap = this.shadowGenerator.getShadowMap();
        if (shadowMap && shadowMap.renderList) {
            shadowMap.renderList.push(box);
            box.receiveShadows = true;
        }

        return box;
    }

    private createInput(
        babylonScene: BABYLON.Scene,
        positionIndex: number,
        userName: string,
        channelName: string
    ): void {
        babylonScene.onKeyboardObservable.add((eventData: BABYLON.KeyboardInfo, eventState: BABYLON.EventState) => {
            if (eventData.event.keyCode === 68) {
                babylonScene.debugLayer.show();
            }
        })
        babylonScene.onPointerObservable.add((eventData: BABYLON.PointerInfo, eventState: BABYLON.EventState) => {
            const pickInfo: BABYLON.Nullable<BABYLON.PickingInfo> = babylonScene.pick(eventData.event.x, eventData.event.y);
            if (pickInfo && pickInfo.hit) {
                const pointerUpPosition = new BABYLON.Vector2(eventData.event.x, eventData.event.y);
                if (eventData.event.button === MouseButton.Left && this.pointerDownPosition.equals(pointerUpPosition)) {
                    let position = pickInfo.pickedPoint || BABYLON.Vector3.Zero();
                    const groundPosition = this.getLocation(positionIndex);
                    if (
                        position.x >= groundPosition.x - 15 + 0.5 &&
                        position.x <= groundPosition.x + 15 - 0.5 &&
                        position.z >= groundPosition.z - 15 + 0.5 &&
                        position.z <= groundPosition.z + 15 - 0.5 &&
                        position.y >= -1 &&
                        position.y <= 500
                    ) {
                        const boxColor = this.blockColor.clone();
                        const normal = pickInfo.getNormal() || BABYLON.Vector3.Zero();
                        position = position.add(normal.multiplyByFloats(0.5, 0.5, 0.5));
                        const box = this.createBox(babylonScene, uuid.v4().toString(), userName, position, boxColor);
                        const boxData: IBoxData = { id: box.id, position: box.position, color: boxColor }
                        const addBoxData: IAddBoxData = {
                            boxData,
                            userName
                        };
                        this.sendAddBoxEvent(channelName, addBoxData);
                    }
                } else if (eventData.event.button === MouseButton.Right) {
                    if (pickInfo.pickedMesh && BABYLON.Tags.MatchesQuery(pickInfo.pickedMesh, 'object')) {
                        const position = pickInfo.pickedPoint || BABYLON.Vector3.Zero();
                        const groundPosition = this.getLocation(positionIndex);
                        if (
                            position.x >= groundPosition.x - 15 + 0.5 &&
                            position.x <= groundPosition.x + 15 - 0.5 &&
                            position.z >= groundPosition.z - 15 + 0.5 &&
                            position.z <= groundPosition.z + 15 - 0.5 &&
                            position.y >= -1 &&
                            position.y <= 500
                        ) {
                            const boxData: IBoxData = {
                                color: BABYLON.Color3.White(),
                                id: pickInfo.pickedMesh.id,
                                position: BABYLON.Vector3.Zero()
                            }
                            this.sendRemoveBoxEvent(channelName, boxData);
                            pickInfo.pickedMesh.dispose();
                        }
                    }
                }
            }
        }, BABYLON.PointerEventTypes.POINTERUP);

        babylonScene.onPointerObservable.add((eventData: BABYLON.PointerInfo, eventState: BABYLON.EventState) => {
            this.pointerDownPosition = new BABYLON.Vector2(eventData.event.x, eventData.event.y);
        }, BABYLON.PointerEventTypes.POINTERDOWN);
    }

    private createNamePlate(positionIndex: number, babylonScene: BABYLON.Scene, userName: string): void {
        const namePlateMesh = BABYLON.MeshBuilder.CreatePlane(
            'namePlatMesh',
            {
                height: 30,
                width: 30
            },
            babylonScene
        );
        namePlateMesh.position = this.getLocation(positionIndex).add(new BABYLON.Vector3(0, 0, 15.5));
        namePlateMesh.rotate(BABYLON.Vector3.Up(), Math.PI);
        namePlateMesh.isPickable = false;
        BABYLON.Tags.AddTagsTo(namePlateMesh, `${userName}`);
        const advancedDynamicTexture = GUI.AdvancedDynamicTexture.CreateForMesh(namePlateMesh);
        const textBlock = new GUI.TextBlock('nameText');
        textBlock.text = userName;
        textBlock.fontSize = 72;
        textBlock.resizeToFit = true
        textBlock.color = "white";
        advancedDynamicTexture.addControl(textBlock);
    }

    private sendAddBoxEvent(channelName: string, addBoxData: IAddBoxData): void {
        this.sendEvent(
            channelName,
            '/api/addbox',
            JSON.stringify(
                {
                    addBoxData,
                    channelName
                })
        );
    }

    private sendRemoveBoxEvent(channelName: string, boxData: IBoxData): void {
        console.log(boxData.id)
        this.sendEvent(
            channelName,
            '/api/removebox',
            JSON.stringify(
                {
                    channelName,
                    id: boxData.id
                })
        );
    }

    private sendEvent(channelName: string, url: string, data: string): void {
        fetch(url, {
            body: data,
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            method: 'post'
        });
    }

    private spiral(n: number): { x: number, y: number } {
        const k = Math.ceil((Math.sqrt(n) - 1) / 2);
        let t = 2 * k + 1;
        let m = Math.pow(t, 2);
        t = t - 1;
        if (n >= m - t) {
            return { x: k - (m - n), y: -k };
        } else {
            m = m - t;
        }
        if (n >= m - t) {
            return { x: -k, y: -k + (m - n) };
        } else {
            m = m - t;
        }

        if (n >= m - t) {
            return { x: -k + (m - n), y: k };
        } else {
            return { x: k, y: k - (m - n - t) };
        }
    }
}