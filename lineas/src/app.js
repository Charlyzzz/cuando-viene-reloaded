const express = require('express');
const fs = require('fs');
const { healthCheck } = require('./middleware');

const lineasDb = {
    buscarPorLinea(linea, callback) {
        fs.readFile('lineas.db.json', 'utf8', (err, contenido) => {
            if (err) {
                return callback(err, null);
            }
            try {
                const lineas = JSON.parse(contenido);
                callback(null, lineas[linea]);
            } catch (e) {
                callback(e, null);
            }
        });
    },
};

const app = new express();

app.use(healthCheck);

app.get('/lineas/:linea', (req, res) => {
    const linea = req.params.linea;
    lineasDb.buscarPorLinea(linea, (err, estadoDeLinea) => {
        if (err) {
            return res.sendStatus(500);
        }
        if (estadoDeLinea === undefined) {
            res.sendStatus(404);
        } else {
            res.json({ linea, ...estadoDeLinea });
        }
    });
});

module.exports = {
    app,
};
