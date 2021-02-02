/**
 * Created by Amine on 19/12/2017.
 */
import {Sensor} from "../interfaces/sensor.class";
import * as SerialPort from "serialport";
import {OpenOptions} from "serialport";
import Delimiter = SerialPort.parsers.Delimiter;
import Timer = NodeJS.Timer;

export type WindData = {
    wind_force: number;
    wind_direction: number;
    wind_unit: string
}
export type CalculatedWindData = { received_at: number, value: number };

const defaultSerialConfig: OpenOptions = {
    autoOpen: false,
    baudRate: 9600
};
type calculatedData = {
    max_force: CalculatedWindData;
    min_force: CalculatedWindData;
    max_direction: CalculatedWindData;
    min_direction: CalculatedWindData;
    avg_force: number;
    avg_direction: number;
}

class WindSensor extends Sensor {

    private port: SerialPort;
    private _2min_data: Array<{ received_at: number, data: WindData }> = [];
    private _10min_data: Array<{ received_at: number, data: WindData }> = [];
    private _2_min_timer: Timer;
    private _10_min_timer: Timer;
    private calculated = {
        _2min: {} as calculatedData,
        _10min: {}as calculatedData
    };

    async init(): Promise<boolean> {
        this.app.logger.info('Wind sensor start init!');
        const open = await this.openSerialPort();
        if (!open) {
            return false;
        }
        this.app.logger.debug('Wind sensor:waiting Output Format: GILL_POLAR_TWO_AXIS');
        //const parser: events.EventEmitter = this.port.pipe(new Delimiter({delimiter: Buffer.from('\x0d\x0a')}));
        //const parser = new Delimiter({delimiter: Buffer.from('\x0d\x0a')});
        const parser = new Delimiter({delimiter: Buffer.from('\x02')});

        this.port.pipe(parser);
        //const parser: events.EventEmitter = this.port.pipe(new ByteLength({length: 8}));
        parser.on('data', this.dataReceived);
        //star the calculated data
        this.app.logger.debug('start calculated values timers');
        this._2_min_timer = setInterval(this.calcTowMinutes, 2 * 60 * 1000);
        this._10_min_timer = setInterval(this.calcTenMinutes, 10 * 60 * 1000);
        return true;
    }

    dataReceived = (data: Buffer) => {

        const t: string = data.toString('ascii');
        const parts = t.split(',');
        if (parts.length !== 6) {
            this.app.logger.error('Wind sensor:value :' + t + ' discarded for invalid format waiting length =6');
            return;

        }
        //get checksumXOR
        let sum = 0;
        let checksum: number = parseInt('0x' + parts[5].replace('\x03', ''));

        for (let i = 0; i < data.length; i++) {
            if (data[i] === 0x02) {
                sum = data[i + 1];
                continue;
            }
            if (data[i] === 0x03) {
                break;
            }
            sum = sum ^ data[i];
        }
        if (sum !== checksum) {
            this.app.logger.error(`Wind sensor:Checksum error ${t}`);
            return;
        }
        if (parseInt(parts[4]) !== 0) {
            this.app.logger.error(`Wind sensor:Status invalid ${t}`);
            return;
        }

        //parsing data
        const v: WindData = {
            wind_force: parseFloat(parts[2]),
            wind_direction: parseInt(parts[1]),
            wind_unit: parts[3]
        };
        if(isNaN(v.wind_direction)){
            v.wind_direction=null;
        }
        if(isNaN(v.wind_force)){
            v.wind_force=null;
        }
        this.app.logger.debug(`packet received from sensor F=${v.wind_force},D=${v.wind_direction}`);
        this.setCurrentData(v);
    };

    protected setCurrentData(v: any) {
        super.setCurrentData(v);
        this._2min_data.push({data: this.currentValue, received_at: this.lastReceivedTime});
        this._10min_data.push({data: this.currentValue, received_at: this.lastReceivedTime});
    }

    /**
     *
     * @returns {boolean}
     */
    protected validateValue(): boolean {
        if (!super.validateValue()) {
            this._2min_data = [];
            this._10min_data = [];

            return false;
        }
        return true;
    }

    /**
     *
     * @returns {Promise<boolean>}
     */
    protected openSerialPort(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const open = Object.assign(defaultSerialConfig, this.config.openOptions);
            this.port = new SerialPort(this.config.path, open);
            this.port.open((error: Error) => {
                if (error === null) {

                    this.app.logger.info(`Wind sensor:port opened!:${this.config.path}`);
                    resolve(true);
                } else {
                    this.app.logger.error(`Wind sensor:${error.message}`);
                    resolve(false);
                }
            });
        });
    }

    read(): WindData {
        if ((!this.validateValue())) {
            //invalidate all previous data

            return {wind_direction: null, wind_force: null, wind_unit: null};
        }

        return this.currentValue;
    }

    close(): Promise<boolean> {
        this._2_min_timer.unref();
        this._10_min_timer.unref();
        return new Promise((resolve) => {
            this.port.close((error: Error) => {
                if (null == error) {

                    resolve(true);
                } else {
                    this.app.logger.error(`Error closing ${this.sensorId}:${error.message}`);
                    resolve(false);
                }
            });
        });
    }


    calcTowMinutes = () => {
        if (this._2min_data.length === 0) {
            this.app.logger.debug('Nothing to calculate about tow minutes data');
            return;
        }
        this.app.logger.debug('calculate tow min data on wind sensor');
        this.calculated._2min = this.valuesCalc(this._2min_data);
        this._2min_data = [];
    };

    private valuesCalc(data: any): any {
        let _c: calculatedData = {
            min_force: {
                received_at: data[0].received_at, value: data[0].data.wind_force
            },
            max_force: {
                received_at: data[0].received_at, value: 0
            },
            min_direction: {
                received_at: data[0].received_at, value: data[0].data.wind_direction
            },
            max_direction: {
                received_at: data[0].received_at, value: 0
            },
            avg_direction: 0,
            avg_force: 0,
        };
        for (let c of data) {
            //max force
            if (c.data.wind_force > _c.max_force.value) {
                _c.max_force.value = c.data.wind_force;
                _c.max_force.received_at = c.received_at;
            }
            //max direction
            if (c.data.wind_direction > _c.max_direction.value) {
                _c.max_direction.value = c.data.wind_direction;
                _c.max_direction.received_at = c.received_at;
            }
            //min force
            if (c.data.wind_force < _c.min_force.value) {
                _c.min_force.value = c.data.wind_force;
                _c.min_force.received_at = c.received_at;
            }
            //min direction
            if (c.data.wind_direction < _c.max_direction.value) {
                _c.min_direction.value = c.data.wind_direction;
                _c.min_direction.received_at = c.received_at;
            }
        }
        return _c;
    }

    calcTenMinutes = () => {
        if (this._10min_data.length === 0) {
            this.app.logger.debug('Nothing to calculate about 10 minutes data');
            return;
        }
        this.app.logger.debug('calculate 10 min data on wind sensor');
        this.calculated._10min = this.valuesCalc(this._10min_data);
        this._10min_data = [];
    };
    readCalculated(): any {
        return this.calculated;
    }
}

export default WindSensor;