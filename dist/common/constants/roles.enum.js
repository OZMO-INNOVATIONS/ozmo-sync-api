"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStatus = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "SUPER_ADMIN";
    Role["ADMIN"] = "ADMIN";
    Role["HR"] = "HR";
    Role["MANAGER"] = "MANAGER";
    Role["TEAM_LEAD"] = "TEAM_LEAD";
    Role["STAFF"] = "STAFF";
    Role["GUEST"] = "GUEST";
})(Role || (exports.Role = Role = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
    UserStatus["RESIGNED"] = "RESIGNED";
    UserStatus["TERMINATED"] = "TERMINATED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
//# sourceMappingURL=roles.enum.js.map