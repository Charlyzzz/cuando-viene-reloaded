const { app } = require('./src/app');
const { actualizarUbicaciones } = require('./src/actualizarUbicaciones');

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`[LINEAS] escuchando en el puerto ${PORT}`);
    actualizarUbicaciones();
});
