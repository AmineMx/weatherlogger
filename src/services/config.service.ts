import {Service} from "./service";
import * as fs from "fs";
/**
 * Created by Amine on 06/11/2017.
 */

export class ConfigService extends Service {

    private config: any = {};
    private _configPath: string;

    constructor(_app: any) {
        super(_app);
    }

    public set configPath(path: string) {
        this._configPath = require('path').resolve(path);
    }

    public set(key: string, value: any) {
        this.config[key] = value;
        return this;
    }

    public setWithCommit(key: string, value: any) {
        this.set(key, value);
        this.commitChanges();
    }

    public exist(key: string):boolean {
        return this.config.hasOwnProperty(key)
    }

    public get(key: string, defaultValue: any = null): any {
        if (this.config.hasOwnProperty(key))
            return this.config[key];
        else
            return defaultValue;
    }

    public commitChanges() {
        try {
            fs.writeFileSync(this._configPath, JSON.stringify(this.config, null, " "));
            this.app.logger.info('Saving new configuration');
        } catch (e) {
            this.app.logger.error(`Can't save configuration file :${e.message}`);
        }
    }

    public load(): boolean {
        this.app.logger.info('Loading configuration');
        try {

            if (!fs.existsSync(this._configPath)) {
                fs.writeFileSync(this._configPath, '{}');
            }
            this.config = require(this._configPath);
            this.app.logger.info(`Configuration loaded from file:${this._configPath}`);
            return true
        } catch (e) {
            this.app.logger.error(`Can't load configuration file :%s`, e.message);
            return false;
        }
    }
}
