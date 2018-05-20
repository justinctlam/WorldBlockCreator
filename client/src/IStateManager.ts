import { AppState } from "./AppState";

export default interface IStateManager {
    changeToState(state: AppState): void
}