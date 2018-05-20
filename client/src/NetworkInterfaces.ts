export enum PusherEvent {
    NewMember = 'NewMember',
    AddBox = 'AddBox',
    RemoveBox = 'RemoveBox',
    RemoveMember = 'RemoveMember'
}

export interface IMemberData {
    positionIndex: number,
    userName: string
}

export interface IAddBoxData {
    boxData: IBoxData,
    userName: string
}

export interface IBoxData {
    id: string,
    position: { x: number, y: number, z: number },
    color: { r: number, g: number, b: number }
}

export interface ICreateChannelBodyData {
    userName: string
}

export interface ICreateChannelResponseData {
    status: string,
    channelName: string,
    positionIndex: number,
    otherMemberData: Array<{
        memberData: IMemberData,
        boxesData: IBoxData[]
    }>
}