import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

export default class LoginGui {
    public onLoginClick: (eventData: GUI.Vector2WithInfo, eventState: BABYLON.EventState) => void;
    public onInputTextChange: (eventData: GUI.InputText, eventState: BABYLON.EventState) => void;

    private advancedDynamicTexture: GUI.AdvancedDynamicTexture;
    private errorTextBlock: GUI.TextBlock;

    public dispose() {
        this.advancedDynamicTexture.dispose();
    }

    public showErrorMessage(): void {
        this.errorTextBlock.isVisible = true;
    }

    public hideErrorMessage(): void {
        this.errorTextBlock.isVisible = false;
    }

    public create(canvas: HTMLCanvasElement, babylonScene: BABYLON.Scene): void {
        this.advancedDynamicTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');

        const panel = new BABYLON.GUI.StackPanel();
        panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.advancedDynamicTexture.addControl(panel);

        const loginButton = this.createLoginButton(babylonScene, this.onLoginClick);
        panel.addControl(loginButton);

        const input = new GUI.InputText();
        input.width = "200px";
        input.height = "60px";
        input.paddingTop = "10px";
        input.paddingBottom = "10px";
        input.text = "Enter username";
        input.color = "white";
        input.background = "blue";
        input.onTextChangedObservable.add(this.onInputTextChange);
        input.onFocusObservable.add((eventData: GUI.InputText, eventState: BABYLON.EventState) => {
            if (eventData.text === "Enter username") {
                eventData.text = "";
            }
        });
        panel.addControl(input);

        const textBlock = new GUI.TextBlock();
        textBlock.text = 'Username already being used.';
        textBlock.color = 'red';
        textBlock.width = "250px";
        textBlock.height = "40px";
        textBlock.isVisible = false;
        this.errorTextBlock = textBlock;
        panel.addControl(textBlock);
    }

    private createLoginButton(
        babylonScene: BABYLON.Scene,
        onClick: (eventData: GUI.Vector2WithInfo, eventState: BABYLON.EventState) => void
    ): GUI.Button {
        const loginButton = GUI.Button.CreateSimpleButton("login", "Login");
        loginButton.width = "150px";
        loginButton.height = "40px"
        loginButton.cornerRadius = 20;
        loginButton.background = "blue";
        loginButton.color = "white";

        loginButton.onPointerClickObservable.add(onClick);

        return loginButton;
    }
}