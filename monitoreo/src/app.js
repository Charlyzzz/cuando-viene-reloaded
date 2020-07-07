const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { get } = require('./request');
const MongoClient = require('mongodb').MongoClient;

let estado;
const TIME_RESOLUTION = 2000;

function reportarEstados(estados) {
    const status = estados.every(_ => _.status === 'UP');
    const timeSlot = Math.round(Date.now() / TIME_RESOLUTION);
    estado = { timeSlot, status };
}

const MONGO_URL = 'mongodb://localhost:27017';
const client = new MongoClient(MONGO_URL, { useUnifiedTopology: true });

client.connect(function (err, client) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('Connected successfully to server');

    const statusCollection = client.db('monitor').collection('status');

    setInterval(() => {
        if (estado) {
            const { timeSlot, status } = estado;
            statusCollection.updateOne({ timeSlot }, {
                $set: {
                    status,
                    timeSlot,
                },
            }, { upsert: true }, (err, res) => {
                if (err) {
                    console.error(err);
                }
            });
        }
    }, TIME_RESOLUTION);
});
const statusCollection = client.db('monitor').collection('status');

const app = new express();
const websocketsConnected = [];

function formatoWsFriendly(contenido, estado) {
    return JSON.stringify({ msg: contenido, type: estado });
}

function textoWsFriendly(texto) {
    return JSON.stringify({ msg: texto, type: 'string' });
}

function broadcast(payload, estado = 'estados') {
    let msg = formatoWsFriendly(payload, estado);
    websocketsConnected.forEach(_ => _.send(msg));
}

app.get('/', (res, req) => {
    req.sendFile('index.html', { root: __dirname });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.send(textoWsFriendly('¡Conectado al monitoreo de servicios!'));
    websocketsConnected.push(ws);

    ws.on('close', () => {
        const i = websocketsConnected.indexOf(ws);
        if (i !== -1) {
            websocketsConnected.splice(i, 1);
        }
    });
});

function trackearReportes() {
    setInterval(() => {
        statusCollection.find().sort([['timeSlot', -1]]).limit(200).toArray((err, reportes) => {
            if (err) {
                console.error(err);
                return;
            }
            broadcast({ reportes }, 'reportes');
        });
    }, TIME_RESOLUTION);
}

function trackearEstadoDeLineas(servicios) {
    const estados = servicios.map(servicio => {
        return new Promise((resolve, reject) => {
            get(servicio.url + '/health', (err, respuesta) => {
                if (err) {
                    return reject({ servicio: servicio.nombre, err });
                }
                const { status } = respuesta;
                resolve({ servicio: servicio.nombre, status });
            });
        });
    });
    Promise.allSettled(estados)
        .then(rs => {
            const estados = rs.reduce((estadosHastaAhora, resultado) => {
                if (resultado.status === 'fulfilled') {
                    estadosHastaAhora.push(resultado.value);
                    return estadosHastaAhora;
                } else {
                    const { servicio } = resultado.reason;
                    estadosHastaAhora.push({ servicio, status: 'DOWN' });
                    return estadosHastaAhora;
                }
            }, []);
            broadcast({ estados });
            reportarEstados(estados);
            setTimeout(trackearEstadoDeLineas.bind(undefined, servicios), 1000);
        });
}

module.exports = {
    app: server,
    trackearEstadoDeLineas,
    trackearReportes,
};
