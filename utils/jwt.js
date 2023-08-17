const jwt = require('jsonwebtoken');

exports.getToken = (info) => {
  return jwt.sign(info, process.env.JWT_SECRET, { expiresIn: '1y' } );
}