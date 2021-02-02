import {wLogger} from "../application";
import Application = wLogger.Application;
/**
 * Created by Amine on 09/11/2017.
 */

const {createLogger, format, transports} = require('winston');
const {combine, timestamp, label, printf} = format;
export class systemLogger {
    private name: string;
    private logger: any;

    constructor(_name: string = 'Application') {

        this.name = _name;
        const myFormat = printf((info: any) => {
            return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
        });
        this.logger = createLogger({
            level: 'debug',
            format: combine(
                format.splat(),
                label({label: this.name}),
                timestamp(),
                myFormat
            ),
            transports: [
                new transports.Console(),
                new transports.File({filename: 'application.log'}),
            ],
            exceptionHandlers: [
                new transports.File({filename: 'exceptions.log'})
            ]
        });
    }

    debug(format: string, ...params: any[]) {
        this.logger.log('debug', format, ...params);
    }

    info(format: string, ...params: any[]) {
        this.logger.log('info', format, ...params);

    }

    warn(format: string, ...params: any[]) {
        this.logger.log('warn', format, ...params);
    }

    error(format: string, ...params: any[]) {
        this.logger.log('error', format, ...params);
    }

}