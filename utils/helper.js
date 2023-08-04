const { sign } = require('jsonwebtoken');

const createJSONToken = (payload, key, time) => {
    return sign(payload, key, { expiresIn: time });
};

const escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

module.exports = {
    createJSONToken,
    escapeRegex,
};
