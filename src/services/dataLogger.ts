import {DataBaseDriver} from "./database.serivce";
import {Service} from "./service";
import {sensorService} from "./sensor.service";
import {DbMigratory} from "./database.migrator.service";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import Timer = NodeJS.Timer;

/**
 * Created by Amine on 29/10/2017.
 *
 */
const dataBaseVersion: number = 1;

export class DataLoggerService extends Service {

    private _minuteInterval: Timer;
    private _minuteDataSubject: Subject<any>;
    public db: DataBaseDriver;
    public sensorService: sensorService;

    public liveData: Observable<any>;
    public minuteData: Observable<any>;

    /*public towMinutesData: Observable<any>;
    public tenMinutesData: Observable<any>;*/

    init() {
        this.initSensors();
        this.initDataObservables();
        this.initDB().then(() => {
            this.startWatchers();
        });
    }

    initSensors() {
        this.sensorService = new sensorService(this.app);
    }

    private startWatchers() {
        this.minuteData.subscribe((data) => {
            this.saveToDataBase(data)
        });
    }

    async stopLogger() {
        await this.sensorService.end();
        await this.db.close();
    }

    async initDB() {
        this.db = new DataBaseDriver(this.app.config.get('db', {path: './data_logger.db'}).path);
        try {
            this.app.logger.info('database start using sqlite3 driver');
            await this.db.open();
            //SELECT name FROM sqlite_master WHERE type='table' AND name='table_name';
            const migratory = new DbMigratory(this.app);
            await migratory.checkDb(this.db, dataBaseVersion).then((init) => {
                if (init) {
                    this.app.logger.info('database OK!');
                }
            }).catch((e) => {
                this.app.logger.error('database init error:' + e);
            })
        } catch (e) {
            this.app.logger.error('database init error:' + e);
            return false;
        }

        //check

    }

    startLogger() {

    }

    /* private initSensors() {
         this.sensorService = new sensorService(this.app);
         this.sensorService.startData();
         //@todo fix events
         /!*this.sensorService.sensorStarted((error: Error) => {
          if (error == null)
          this.app.logger.info('all sensors started and ready to use!');
          else {
          this.app.logger.error(error.message);
          }
          });*!/
     }*/

    private saveToDataBase(data: any) {
        this.db.insert(data, 'measurements').catch((e) => {
            this.app.logger.error(e);
        }).then(() => {
            this.app.logger.debug('Data inserted to db');
        });
    }

    private initDataObservables() {
        //live data
        this.liveData = Observable.interval(this.app.config.get('Real_Time_Sensor_Interval', 3000)).map(() => {
            return {
                'measurements': this.sensorService.getMeasurements(),
                'calculated': this.sensorService.getCalculated()
            };
        });
        this._minuteDataSubject = new Subject();
        this.minuteData = this._minuteDataSubject.asObservable();
        const startDelay: number = (60 - (new Date().getSeconds()));
        this.app.logger.debug('Starting minute data in %d seconds', startDelay);
        setTimeout(() => {
            this.app.logger.debug('minute data started');
            this.sendMinuteData();
            this._minuteInterval = setInterval(this.sendMinuteData, 60 * 1000);
        }, startDelay * 1000);
    }

    /**
     *
     */
    sendMinuteData = () => {
        this.app.logger.debug('sending minute data');
        this._minuteDataSubject.next(this.sensorService.getMeasurements());
    };
}