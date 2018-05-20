import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as uuid from 'uuid';
import * as dotenv from 'dotenv';
const Pusher = require('pusher');

enum PusherEvent {
  NewMember = 'NewMember',
  AddBox = 'AddBox',
  RemoveBox = 'RemoveBox',
  RemoveMember = 'RemoveMember'
}

interface IMemberData {
  positionIndex: number,
  userName: string
}

interface IAddBoxData {
  boxData: IBoxData,
  userName: string
}

interface IBoxData {
  id: string,
  position: { x: number, y: number, z: number },
  color: { r: number, g: number, b: number }
}

interface ICreateChannelBodyData {
  userName: string
}

interface ICreateChannelResponseData {
  status: string,
  channelName: string,
  positionIndex: number,
  otherMemberData: {
    memberData: IMemberData,
    boxesData: IBoxData[]
  }[]
}

class App {
  private availablePositions: number[] = [];
  private allChannels = new Map<string, IMemberData>();
  private maxPositions = 50;
  private pusher: any;
  private boxes = new Map<string, IBoxData[]>();
  private userNames = new Set<string>();

  constructor() {

    if (process.env.NODE_ENV !== 'production') {
      dotenv.load();
    }

    console.log(process.env);

    this.app = express();
    this.initializePusher();
    this.initializeApp();
    this.config();
    this.routes();
  }

  private initializePusher(): void {
    this.pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_APP_KEY,
      secret: process.env.PUSHER_APP_SECRET,
      cluster: process.env.PUSHER_APP_CLUSTER,
      encrypted: true
    });
  }

  private initializeApp(): void {
    for (let i = 0; i < this.maxPositions; ++i) {
      this.availablePositions.push(i);
    }
  }

  private config(): void {
    this.app.use(express.static(path.join(__dirname, 'client/build')));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  private routes(): void {
    const router = express.Router();

    router.post('/api/createchannel', (req, res) => {
      console.log('/api/createchannel');
      const createChannelBodyData: ICreateChannelBodyData = req.body;

      if (this.userNames.has(createChannelBodyData.userName)) {
        console.log("Duplicate user name: " + createChannelBodyData.userName);
        res.json({ status: 'failed' });
        return;
      }

      this.userNames.add(createChannelBodyData.userName)

      if (this.availablePositions.length > 0) {
        const positionIndex = this.availablePositions.shift();
        if (positionIndex !== undefined) {
          console.log('Position index: ' + positionIndex);
          console.log('User name: ' + createChannelBodyData.userName);
          const id = uuid.v4().toString();
          this.allChannels.set(id, { positionIndex: positionIndex, userName: createChannelBodyData.userName })
          this.boxes.set(id, []);

          const newMemberData: IMemberData = {
            positionIndex: positionIndex,
            userName: createChannelBodyData.userName
          };
          this.sendAllExcept(id, PusherEvent.NewMember, newMemberData);

          const otherMemberData: {
            memberData: IMemberData,
            boxesData: IBoxData[]
          }[] = Array.from(this.allChannels)
          .filter(channel => {
            return channel[0] !== id;
          }).map(channel => {
            return {
              memberData: {positionIndex: channel[1].positionIndex, userName: channel[1].userName},
              boxesData: this.boxes.get(channel[0]) || []
            }
          })

          const createChannelData: ICreateChannelResponseData = {
            status: 'succeed',
            channelName: id,
            positionIndex: positionIndex,
            otherMemberData: otherMemberData
          }
          res.json(createChannelData);
          return;
        }
      }

      res.json({ status: 'failed' });
    });

    router.post('/api/addbox', (req, res) => {
      console.log('/api/addbox');
      const reqBodyData: {
        channelName: string,
        addBoxData: IAddBoxData
      } = req.body;

      const boxes = this.boxes.get(reqBodyData.channelName);
      if (boxes) {
        boxes.push(reqBodyData.addBoxData.boxData);
      }

      this.sendAllExcept(
        reqBodyData.channelName,
        PusherEvent.AddBox,
        reqBodyData.addBoxData);

      res.end();
    });

    router.post('/api/removeBox', (req, res) => {
      console.log('/api/removeBox');
      const boxData: IBoxData = {
        id: req.body.id,
        position: req.body.position,
        color: req.body.color
      };

      const boxes = this.boxes.get(req.body.channelName);
      if (boxes) {
        const newBoxes = boxes.filter(data => data.id !== boxData.id);
        this.boxes.set(req.body.channelName, newBoxes);
      }

      this.sendAllExcept(
        req.body.channelName,
        PusherEvent.RemoveBox,
        boxData);

      res.end();
    });

    router.post("/webhook", (req, res) => {
      req.body.events.forEach((e: { name: string, channel: string }) => {
        if (e.name === 'channel_vacated') {
          const userData = this.allChannels.get(e.channel);
          if (userData !== undefined) {
            console.log('removed: ' + e.channel);
            const memberData: IMemberData = {
              positionIndex: userData.positionIndex,
              userName: userData.userName
            };
            this.sendAllExcept(e.channel, PusherEvent.RemoveMember, memberData);
            this.availablePositions.push(userData.positionIndex);
            this.availablePositions = this.availablePositions.sort();
            this.allChannels.delete(e.channel);
            this.boxes.delete(e.channel);
            this.userNames.delete(userData.userName)
          }
        }
      });

      res.end();
    });

    router.get('*', (req, res) => {
      res.sendFile(path.join(__dirname+'/client/build/index.html'));
    });

    this.app.use(router);
  }

  private sendAllExcept(channelName: string, event: PusherEvent, data: any): void {
    Array.from(this.allChannels.keys())
      .filter(channel => channel !== channelName)
      .forEach(channel => {
        this.pusher.trigger(
          channel,
          event,
          data);
      });
  }

  public app: express.Application;

}

export default new App().app;