const { app, trackearEstadoDeLineas } = require('./src/app');

const servicios = [
    {
        url: process.env.CUANDO_VIENE_URL,
        nombre: 'CUANDO-VIENE',
    },
    {
        url: process.env.LINEAS_URL,
        nombre: 'LINEAS',
    },
    {
        url: process.env.PARADAS_URL,
        nombre: 'PARADAS',
    },
];

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`[MONITOREO] escuchando en el puerto ${PORT}`);
    trackearEstadoDeLineas(servicios);
});

