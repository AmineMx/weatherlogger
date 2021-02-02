const sensorParameters = {
    'wind': {
        id: 'wind',
        active: true,
        timeout: 2000,
        path: 'COM1',
        'openOptions': {
            baudRate: 9600,
            dataBits: 8,
            stopBits: 1,
            parity: "none"
        }
    }
};
export default sensorParameters;