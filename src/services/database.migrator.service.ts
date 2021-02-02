import {Service} from "./service";
import {DataBaseDriver} from "./database.serivce";
import {ApplicationDbMigrations} from "../db/migration";
import {isNullOrUndefined} from "util";

/**
 * Created by Amine on 20/12/2017.
 */
export class DbMigratory extends Service {

    async checkDb(db: DataBaseDriver, version: number) {

        const row = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'");
        if (!row) {
            this.app.logger.warn('Empty db, i will create new tables');
            if (!await this.createMigrationTable()) return false;
        }
        return this.migrateUntilVersion(db, version);
    }

    createMigrationTable() {
        const db = this.app.dataLogger.db;

        const sql = `CREATE TABLE
migrations (
 id integer PRIMARY KEY,
 version integer NOT NULL,
 apply_date integer NOT NULL
);`;
        return db.run(sql);
    }

    async migrateUntilVersion(db: DataBaseDriver, version: number) {
        //get current version

        const row = await db.get('SELECT version FROM migrations ORDER BY apply_date DESC LIMIT 1');
        let i = 0;
        if (!isNullOrUndefined(row)) {
            //migrate all
            i = row.version + 1;
        }

        for (; i < ApplicationDbMigrations.length; i++) {
            this.app.logger.info('application of migration ' + i);
            await ApplicationDbMigrations[i].apply(this, [db]);
            await db.insert({
                'version': i,
                'apply_date': (new Date()).getTime()
            }, 'migrations')
        }
        return true;


    }
}