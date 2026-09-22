// RBAC middleware factory (PRD Section 100/145)
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "FINANCE_ADMIN", "TRADING_ADMIN", "CONTENT_ADMIN", "AFFILIATE_ADMIN", "SUPPORT_ADMIN"];

const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized");
  }
  if (!roles.includes(req.user.role)) {
    res.status(403);
    throw new Error("Forbidden: insufficient permissions");
  }
  next();
};

const requireAnyAdmin = (req, res, next) => {
  if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
    res.status(403);
    throw new Error("Forbidden: admin access required");
  }
  next();
};

const requireSuperAdmin = requireRoles("SUPER_ADMIN");

module.exports = { requireRoles, requireAnyAdmin, requireSuperAdmin, ADMIN_ROLES };
