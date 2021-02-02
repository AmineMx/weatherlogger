import {wLogger} from "../application";
import {Subscription} from "rxjs/Subscription";
import {DataRequest} from "../models/data-request";

export class RequestHandler {
    [key: string]: any;
    private app: wLogger.Application;
    private socket: SocketIO.Socket;
    private _liveDataSubscription: Subscription = null;

    constructor(_app: wLogger.Application, socket: any) {
        this.app = _app;
        this.socket = socket;
        this.initEvents();
    }

    destroy() {
        if (this._liveDataSubscription !== null) {
            this._liveDataSubscription.unsubscribe();
        }
    }

    /**
     * init some events here
     */
    private initEvents() {

        this.socket.on('subscribe_to_live_data', () => {
            this._liveDataSubscription = this.app.dataLogger.liveData.subscribe((data) => {
                this.socket.emit('real_time_data', data);
            }, this.error);
        });
        this.socket.on('request', (data: DataRequest) => {

            const method = `action_${data.action}`;

            if (typeof this[method] === 'function') {
                this[method](data.data);
            }
        });
        this.socket.on('action_data_history',this.action_data_history)
    }

    error(err: any) {
        this.app.logger.error(err);
    }

    action_data_history=(data: any) =>{

         this.app.dataLogger.db.all(`SELECT * FROM \`measurements\` where strftime('%Y:%m',m_date)='${data.year}:${data.month}'`).then((d)=>{
             this.socket.emit('history_data',d);
         }).catch(()=>{

         })
    };

    private action_Settings(data: DataRequest) {

    }
}