import {wLogger} from "../application";
/**
 * Created by Amine on 06/11/2017.
 */
export class Service {
    protected app: wLogger.Application;

    init() {
    }

    constructor(_app: wLogger.Application) {
        this.app = _app;
        this.init();
    }
}