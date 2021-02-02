/**
 * Created by Amine on 21/11/2017.
 */
import * as sqlite from "sqlite3";
import {OPEN_CREATE, OPEN_READWRITE, RunResult} from "sqlite3";

export class DataBaseDriver {

    private _dbFileName: string;
    private db: sqlite.Database = null;
    public lastSql: string;

    constructor(filename: string) {
        this._dbFileName = filename;
    }

    open(mode = OPEN_READWRITE | OPEN_CREATE): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db = new sqlite.Database(this._dbFileName, mode, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    async asycOpen(mode = OPEN_READWRITE | OPEN_CREATE): Promise<boolean> {
        try {
            await this.open(mode);
            return true;
        } catch (err) {
            return false;
        }
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db === null) {
                resolve();
            } else {
                //we have opened db
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else
                        resolve()
                });
            }
        });
    }


    all(sql: string, ...params: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, ...params, (err: any, rows: any) => {
                if (err) {
                    reject(err);
                } else
                    resolve(rows);
            });
        });
    }

    get(sql: string, ...params: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, ...params, (err: any, row: any) => {
                if (err) {
                    reject(err);
                } else
                    resolve(row);
            });
        });
    }

    /**
     *
     * @param sql
     * @param params
     * @returns {Promise<T>}
     */
    run(sql: string, ...params: any[]): Promise<RunResult> {
        return new Promise((resolve, reject) => {
            this.lastSql = sql;
            this.db.run(sql, ...params, function (err: any) {
                if (err) {
                    reject(err);
                } else
                    resolve(this);
            });
        });
    }

    /**
     *
     * @param sql
     * @param params
     * @returns {Promise<RunResult>}
     */
    async runAsync(sql: string, ...params: any[]) {
        return await this.run(sql, ...params);
    }


    insert(data: any, table: string) {
        return new Promise((resolve, reject) => {
            let fields = Object.keys(data).join(',');
            let keys = Object.keys(data).map(((value, index, array) => `?${index + 1}`)).join(',');
            const sql = `INSERT INTO ${table} (${fields}) VALUES (${keys})`;
            let __this = this;
            this.db.run(sql, Object.values(data), function (err) {
                if (err) {
                    reject(err);
                } else {
                    //return last changes
                    __this.lastSql = sql;
                    resolve(this);
                }
            })
        });

    }

}
