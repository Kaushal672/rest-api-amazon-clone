const jwt = require('jsonwebtoken');
const ExpressError = require('../utils/ExpressError');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) throw new ExpressError('Not Authenticated', 401);

    const token = authHeader.split(' ')[1] || null;
    if (!token) throw new ExpressError('Not Authenticated', 401);

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_ACCESS_KEY);
    } catch (e) {
        throw new ExpressError('Not Authenticated', 401);
    }

    if (!decodedToken) {
        throw new ExpressError('Not Authenticated', 401);
    }
    req.userId = decodedToken.userId;
    next();
};
