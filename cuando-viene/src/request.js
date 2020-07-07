const http = require('http');

/**
 * Alguien nos dejó esta implementación de un GET en node.
 * ¡No cambiar interfaz!
 */
function get(url, cb) {
    const req = http.request(url, res => {
        if (res.statusCode !== 200) {
            return cb(new Error(`Request a ${url} respondió ${res.statusCode}`));
        }
        let body = '';
        res
            .on('data', chunk => {
                body += chunk;
            })
            .on('end', () => {
                try {
                    cb(null, JSON.parse(body));
                } catch (e) {
                    cb(e);
                }
            });
    });
    req.on('error', error => {
        cb(error);
    });
    req.end();
}

module.exports = {
    get,
};
