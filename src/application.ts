import {systemLogger} from "./services/systemLogger";
import {ConfigService} from "./services/config.service";
import {DataLoggerService} from "./services/dataLogger";
import {NetworkService} from "./services/network.service";

/**
 * Created by Amine on 15/12/2017.
 */

const winston = require("winston");
export namespace wLogger {

    export class Application {
        private _ConfigurationPath: string = '';
        public logger: systemLogger;
        public config: ConfigService;
        public dataLogger: DataLoggerService;
        public networkService: NetworkService;


        setConfigurationPath(configurationPath: string) {
            this._ConfigurationPath = configurationPath;
        }

        start() {
            //init logger
            this.logger = new systemLogger();
            this.logger.info('Server started!');
            /*  global.logger=this.logger;*/
            this.config = new ConfigService(this);
            this.config.configPath = this._ConfigurationPath;
            this.config.load();
            this.logger.info('loading data logger service');
            this.initDataLoggerService();
            this.logger.info('loading socket service');
            this.initNetworkService();
        }

        private initDataLoggerService() {
            this.dataLogger = new DataLoggerService(this);
        }

        private initNetworkService() {
            this.networkService = new NetworkService(this);
        }

        async close(code: number) {
            await this.dataLogger.stopLogger();
            this.logger.info(`server ended with ${code}`)
        }
    }

    /**
     *
     * @param configurationPath
     * @returns {wLogger.Application}
     */
    export function create(configurationPath: string = './application.json') {
        const app = new Application();
        app.setConfigurationPath(configurationPath);
        process.on('exit', (code) => {
            app.close(code);
        });
        return app;
    }


}
