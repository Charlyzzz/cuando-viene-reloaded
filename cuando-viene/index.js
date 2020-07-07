const { app } = require('./src/app');

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`[CUANDO-VIENE] escuchando en el puerto ${PORT}`);
});

