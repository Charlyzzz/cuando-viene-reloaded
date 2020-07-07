const fs = require('fs');

function actualizarUbicaciones() {
    fs.readFile('lineas.db.json', (err, contenido) => {
        if (err) {
            return console.error(err);
        }
        const lineas = JSON.parse(contenido);
        Object.entries(lineas).forEach(([, detalle]) => {
            detalle.colectivos.forEach(colectivo => {
                let ubicacion = colectivo.ubicacion;
                ubicacion += Math.min(3 + Math.round(Math.random() * 5), 110);
                if (ubicacion >= 110) {
                    ubicacion = 0;
                }
                colectivo.ubicacion = ubicacion;
            });
        });
        fs.writeFile('lineas.db.json', JSON.stringify(lineas, undefined, 2), (err) => {
            if (err) {
                console.error(err);
            } else {
                setTimeout(actualizarUbicaciones, 2000);
            }
        });
    });
}

module.exports = {
    actualizarUbicaciones,
};
