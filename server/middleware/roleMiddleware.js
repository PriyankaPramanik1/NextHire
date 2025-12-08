const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }

    next();
  };
};
const adminOnly = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  req.flash('error', 'Please login as admin');
  res.redirect('/admin/login');
};

module.exports = { adminOnly };


module.exports = { authorize, adminOnly };