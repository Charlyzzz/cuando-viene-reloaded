const express = require('express');
const { colectivoMasCercano } = require('./ubicacion');
const { get } = require('./request');
const { healthCheck } = require('./middleware');

const PARADAS_URL = process.env.PARADAS_URL;
const LINEAS_URL = process.env.LINEAS_URL;

const app = new express();

app.use(healthCheck);

app.get('/cuando-viene/:parada', (req, res) => {
    const parada = req.params.parada;


    get(PARADAS_URL + `/paradas/${parada}`, (err, detalleParada) => {
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }

        const { lineas, ubicacion: ubicacionDeLaParada } = detalleParada;

        const tiemposDeLlegada = lineas.map(linea => {
            return new Promise((resolve, reject) => {
                get(LINEAS_URL + `/lineas/${linea}`, (err, detalleDeLaLinea) => {
                    if (err) {
                        return reject(err);
                    } else {
                        resolve(detalleDeLaLinea);
                    }
                });
            }).then(detalleDeLaLinea => colectivoMasCercano(detalleDeLaLinea, ubicacionDeLaParada));
        });
        Promise.all(tiemposDeLlegada).then(tiempos => tiempos.sort())
            .then(estados => {
                res.json({ estados });
            })
            .catch((err) => {
                console.error(err);
                res.sendStatus(500);
            });
    });
});

module.exports = {
    app,
};
