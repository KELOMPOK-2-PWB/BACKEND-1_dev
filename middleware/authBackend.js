const authBackend = (req, res, next) => {
  const token = req.header('x-api-key'); // isi ini di postman bagian header
  const serverToken = process.env.BACKEND_TOKEN;
  if (!token) {
    return res.status(401).json({ message: 'Akses Ditolak. Token Header tidak ditemukan.' });
  }
  if (token !== serverToken) {
    return res.status(403).json({ message: 'Token Header tidak valid.' });
  }
  next();
};

module.exports = authBackend;