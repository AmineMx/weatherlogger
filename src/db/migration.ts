import {DataBaseDriver} from "../services/database.serivce";

/**
 * Created by Amine on 20/11/2017.
 */
export const ApplicationDbMigrations = [
    (db: DataBaseDriver) => {
        const sql = `
            CREATE TABLE
measurements ( 
 m_date DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
 wind_force REAL  NULL,
 wind_direction REAL NULL,
 wind_unit CHAR(1) NULL
);
         `;
        return db.run(sql);
    }
];