import {Service} from "./service";
import * as socketIo from 'socket.io';
import {createServer, Server} from "http";
import {RequestHandler} from "./request-handler.service";

export class NetworkService extends Service {
    private io: SocketIO.Server;
    private server: Server;
    private port: number;

    init() {
        this.server = createServer();
        this.io = socketIo(this.server);
        this.port = this.app.config.get('listen_port', 3000);

        this.server.listen(this.port, () => {
            this.app.logger.info('Running server on port %s', this.port);
        });
        this.io.on('connect', (socket: any) => {
            console.log('Connected client on port %s.', this.port);
            let handler = new RequestHandler(this.app, socket);

            socket.on('disconnect', () => {
                console.log('Client disconnected');
                handler.destroy();
            });
        });
       /* this.app.dataLogger.liveData.subscribe((data) => {
            console.log(data);
        });*/
    }
}