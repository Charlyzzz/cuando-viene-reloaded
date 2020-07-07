const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { get } = require('./request');

const app = new express();
const websocketsConnected = [];

function formatoWsFriendly(contenido) {
    const esTexto = typeof contenido === 'string';
    return JSON.stringify({ msg: contenido, type: esTexto ? 'texto' : 'estados' });
}

function broadcast(payload) {
    let msg = formatoWsFriendly(payload);
    websocketsConnected.forEach(_ => _.send(msg));
}

app.get('/', (res, req) => {
    req.sendFile('index.html', { root: __dirname });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.send(formatoWsFriendly('¡Conectado al monitoreo de servicios!'));
    websocketsConnected.push(ws);

    ws.on('close', () => {
        const i = websocketsConnected.indexOf(ws);
        if (i !== -1) {
            websocketsConnected.splice(i, 1);
        }
    });
});

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
            setTimeout(trackearEstadoDeLineas.bind(undefined, servicios), 1000);
        });
}

module.exports = {
    app: server,
    trackearEstadoDeLineas,
};
