const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
    if (!decoded.isAdmin) {
      return res
        .status(403)
        .send("Access denied. You are not authorized to access this content.");
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(400).send("Invalid token.");
  }
};
