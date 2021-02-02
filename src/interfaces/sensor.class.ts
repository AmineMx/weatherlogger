import {wLogger} from "../application";
import Application = wLogger.Application;

/**
 * Created by Amine on 19/12/2017.
 */
export abstract class Sensor {
    protected lastReceivedTime: number;

    protected timeout: number = 5000;

    protected currentValue: any;

    protected app: wLogger.Application;
    protected config: any;
    public sensorId: string;

    constructor(app: Application, _config: any) {
        this.config = _config;
        this.app = app;
        this.sensorId = this.config.id;
    }

    abstract async init(): Promise<boolean>;

    read(): any {
        if (!this.validateValue())
            return undefined;
        return this.currentValue;
    }

    readCalculated(): any {
        return null;
    }

    protected validateValue(): boolean {
        const t: number = (new Date()).getTime();
        return (t - this.lastReceivedTime) <= this.timeout;
    }

    protected setCurrentData(v: any) {
        this.lastReceivedTime = (new Date()).getTime();
        this.currentValue = v;
    }

    abstract close(): Promise<boolean>;
}