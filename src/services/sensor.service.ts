import {Service} from "./service";
import sensorParameters from "../data/sonsors.configuration";
import {Sensor} from "../interfaces/sensor.class";
import WindSensor from "../sensors/wind.sensor";
import "rxjs/add/operator/map";
import "rxjs/add/observable/interval";

/**
 * Created by Amine on 29/10/2017.
 */


export class sensorService extends Service {


    public sensors: Sensor[];
    private sensorsConfig: any;

    init() {
        this.sensors = [];
        if (!this.app.config.exist('sensors')) {
            this.app.logger.warn('Using default config for sensors');
            this.app.config.setWithCommit('sensors', sensorParameters)
        }
        this.sensorsConfig = this.app.config.get('sensors');
        //init sensors

        //init first sensor
        const _wind = new WindSensor(this.app, this.sensorsConfig.wind);
        if (_wind.init())
            this.sensors.push(_wind);
        else {
            this.app.logger.error('Wind sensor not initialized! please check log files')
        }
        return this.sensors.length > 0;
    }

    getMeasurements(): any {
        const sensorsData = {};
        for (let sensor of this.sensors) {
            Object.assign(sensorsData, sensor.read());
        }
        return sensorsData;
    }

    getCalculated(): any {
        const sensorsData: any = {};
        for (let sensor of this.sensors) {
            Object.assign(sensorsData, sensor.readCalculated());
        }
        return sensorsData;
    }

    async end() {
        for (let sensor of this.sensors) {
            this.app.logger.info(`closing sensor "${sensor.sensorId}"`);
            await sensor.close();
        }
    }
}