import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

export default class RunState {
    public onEditorClick: (eventData: GUI.Vector2WithInfo, eventState: BABYLON.EventState) => void;
    public onSpectatorClick: (eventData: GUI.Vector2WithInfo, eventState: BABYLON.EventState) => void;
    public onResetCameraClick: (eventData: GUI.Vector2WithInfo, eventState: BABYLON.EventState) => void;
    public onInputTextChange: (eventData: GUI.InputText, eventState: BABYLON.EventState) => void;
    public onColorValueChanged: (eventData: BABYLON.Color3, eventState: BABYLON.EventState) => void;

    private advancedDynamicTexture: GUI.AdvancedDynamicTexture;
    private colorPicker: GUI.ColorPicker;
    private userNamePanel: GUI.StackPanel;
    private spectatorButton: GUI.Button;
    private editorButton: GUI.Button;
    private instructionsPanel: GUI.StackPanel;
    private spectatorControlInstructions: GUI.StackPanel;
    private editorControlInstructions: GUI.StackPanel;

    public dispose() {
        this.advancedDynamicTexture.dispose();
    }

    public set initialColorPickerColor(value: BABYLON.Color3) {
        this.colorPicker.value = value;
    }

    public enableSpectatorButton(): void {
        this.spectatorButton.background = "blue";
        this.editorButton.background = "grey";
    }

    public enableEditorButton(): void {
        this.spectatorButton.background = "grey";
        this.editorButton.background = "blue";
    }

    public updateUserNamePanel(userNames: string[]) {
        this.userNamePanel.dispose();
        this.userNamePanel = this.createUserNamePanelUI(userNames);
        this.advancedDynamicTexture.addControl(this.userNamePanel);
    }

    public create(
        canvas: HTMLCanvasElement,
        babylonScene: BABYLON.Scene
    ): void {
        this.advancedDynamicTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
        this.colorPicker = this.createColorPicker(babylonScene);
        this.advancedDynamicTexture.addControl(this.colorPicker);

        const panel = new GUI.StackPanel();
        panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.advancedDynamicTexture.addControl(panel);

        const resetCamera = GUI.Button.CreateSimpleButton("resetCamera", "Reset Camera");
        resetCamera.width = "150px";
        resetCamera.height = "40px";
        resetCamera.fontSize = "15";
        resetCamera.cornerRadius = 20;
        resetCamera.background = "blue";
        resetCamera.color = "white";
        resetCamera.paddingBottom = "10px";
        resetCamera.onPointerClickObservable.add(this.onResetCameraClick);
        panel.addControl(resetCamera);

        this.editorButton = GUI.Button.CreateSimpleButton("editorCamera", "Editor Camera");
        this.spectatorButton = GUI.Button.CreateSimpleButton("spectatorButton", "Spectator Camera");

        this.editorButton.width = "150px";
        this.editorButton.height = "40px"
        this.editorButton.fontSize = "15";
        this.editorButton.cornerRadius = 20;
        this.editorButton.background = "grey";
        this.editorButton.color = "white";
        this.editorButton.paddingBottom = "10px";
        this.editorButton.onPointerClickObservable.add(this.onEditorClick);
        panel.addControl(this.editorButton);

        this.spectatorButton.width = "150px";
        this.spectatorButton.height = "40px"
        this.spectatorButton.fontSize = "15";
        this.spectatorButton.cornerRadius = 20;
        this.spectatorButton.background = "blue";
        this.spectatorButton.color = "white";
        this.spectatorButton.paddingBottom = "10px";
        this.spectatorButton.onPointerClickObservable.add(this.onSpectatorClick);
        panel.addControl(this.spectatorButton);

        this.spectatorControlInstructions = this.createSpectatorControlInstructions();
        this.editorControlInstructions = this.createEditorControlInstructions();

        this.instructionsPanel = new GUI.StackPanel();
        panel.addControl(this.instructionsPanel);

        this.showEditorControlInstructions();

        this.userNamePanel = this.createUserNamePanelUI([]);
        this.advancedDynamicTexture.addControl(this.userNamePanel);
    }

    public showSpectatorControlInstructions() {
        const controls = this.instructionsPanel.children;
        controls.forEach(control => this.instructionsPanel.removeControl(control));
        this.instructionsPanel.addControl(this.spectatorControlInstructions);
    }

    public showEditorControlInstructions() {
        const controls = this.instructionsPanel.children;
        controls.forEach(control => this.instructionsPanel.removeControl(control));
        this.instructionsPanel.addControl(this.editorControlInstructions);
    }

    private createSpectatorControlInstructions(): GUI.StackPanel {
        const panel = new GUI.StackPanel();
        const mouseLeftImage = new BABYLON.GUI.Image("mouse-left", "mouse-left.png");
        mouseLeftImage.width = "64px";
        mouseLeftImage.height = "64px";
        panel.addControl(mouseLeftImage);

        const addTextBlock = new GUI.TextBlock();
        addTextBlock.text = 'rotate';
        addTextBlock.width = "100px";
        addTextBlock.height = "40px";
        addTextBlock.color = 'white';
        addTextBlock.outlineColor = 'black';
        addTextBlock.outlineWidth = 3;
        addTextBlock.textWrapping = true;
        panel.addControl(addTextBlock);

        const mouseRightImage = new BABYLON.GUI.Image("arrowKeys", "arrow.png");
        mouseRightImage.width = "64px";
        mouseRightImage.height = "64px";
        panel.addControl(mouseRightImage);

        const textBlock = new GUI.TextBlock();
        textBlock.text = 'move';
        textBlock.width = "100px";
        textBlock.height = "40px";
        textBlock.color = 'white';
        textBlock.outlineColor = 'black';
        textBlock.outlineWidth = 3;
        textBlock.textWrapping = true;
        panel.addControl(textBlock);

        return panel;
    }

    private createEditorControlInstructions(): GUI.StackPanel {
        const panel = new GUI.StackPanel();
        const mouseLeftImage = new BABYLON.GUI.Image("mouse-left", "mouse-left.png");
        mouseLeftImage.width = "64px";
        mouseLeftImage.height = "64px";
        panel.addControl(mouseLeftImage);

        const addTextBlock = new GUI.TextBlock();
        addTextBlock.text = 'add/rotate';
        addTextBlock.width = "100px";
        addTextBlock.height = "40px";
        addTextBlock.color = 'white';
        addTextBlock.outlineColor = 'black';
        addTextBlock.outlineWidth = 3;
        addTextBlock.textWrapping = true;
        panel.addControl(addTextBlock);

        const mouseRightImage = new BABYLON.GUI.Image("mouse-left", "mouse-right.png");
        mouseRightImage.width = "64px";
        mouseRightImage.height = "64px";
        panel.addControl(mouseRightImage);

        const textBlock = new GUI.TextBlock();
        textBlock.text = 'remove';
        textBlock.width = "100px";
        textBlock.height = "40px";
        textBlock.color = 'white';
        textBlock.outlineColor = 'black';
        textBlock.outlineWidth = 3;
        textBlock.textWrapping = true;
        panel.addControl(textBlock);

        return panel;
    }

    private createUserNamePanelUI(userNames: string[]): GUI.StackPanel {
        const panel = new GUI.StackPanel();
        panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

        const onlineTextBlock = new GUI.TextBlock();
        onlineTextBlock.text = `Users Online: ${userNames.length}`;
        onlineTextBlock.width = "150px";
        onlineTextBlock.height = "40px";
        onlineTextBlock.color = "green";
        onlineTextBlock.outlineColor = 'black';
        onlineTextBlock.outlineWidth = 2;
        panel.addControl(onlineTextBlock);
        // userNames.forEach(name => {
        //     const textBlock = new GUI.TextBlock();
        //     textBlock.text = name;
        //     textBlock.width = "150px";
        //     textBlock.height = "40px";
        //     textBlock.color = "green";
        //     panel.addControl(textBlock);
        // });

        return panel;
    }

    private createColorPicker(babylonScene: BABYLON.Scene): GUI.ColorPicker {
        const colorPicker = new GUI.ColorPicker();
        colorPicker.height = "150px";
        colorPicker.width = "150px";
        colorPicker.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        colorPicker.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        colorPicker.onValueChangedObservable.add(this.onColorValueChanged);

        return colorPicker;
    }
}