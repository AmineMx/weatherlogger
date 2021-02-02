import {wLogger} from "./application";


const app = wLogger.create();
try {
    app.start();
} catch (e) {
    console.log(e);
    app.logger.error(e);
}

