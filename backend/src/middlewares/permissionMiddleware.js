/**
 * Permission middleware. Checks if the user has the given permission.
 * If not, returns 403 status with 'You do not have permission to perform this action.' message.
 * @function
 * @param {string | string[]} permission - The permission to check.
 * @param {boolean} [checkAdmin=false] - Whether to check if the user is an admin.
 * @returns {function} The middleware function.
 */
const permissionMiddleware = (permission, checkAdmin = false) => {
    const validator = (req, res, next) => {
        const hasPermission = (typeof permission === 'string' ? [permission] : permission).some((p) => !req.user.permissions.includes(p));

        if ((checkAdmin && req.user.role == 'admin') || (hasPermission && req.user.role === 'moderator')) {
            return next();
        }
        
        res.status(403).json({ message: 'You do not have permission to perform this action2.' });
    }

    return validator
};

export default permissionMiddleware;