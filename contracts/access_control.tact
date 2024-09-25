
struct UserRoles {
    roles: map<Int as uint16, Int as uint16>;
    length: Int;
}

message(0x7744d640) GrantRole {
    role: Int as uint16;
    user: Address;
}

message(0x7744d641) RevokeRole {
    role: Int as uint16;
    user: Address;
}

message(0x77541880) RoleGranted {
    role: Int as uint16;
    user: Address;
    timestamp: Int as uint32;
}

message(0x77541881) RoleRevoked {
    role: Int as uint16;
    user: Address;
    timestamp: Int as uint32;
}

const DEFAULT_ADMIN_ROLE: Int = 1;

trait AccessControl {
    admin_initialized: Bool;
    roles_length: Int;
    user_roles: map<Address, UserRoles>;

    receive(msg: GrantRole) {
        self._onlyRole(DEFAULT_ADMIN_ROLE, sender());
        self._grantRole(msg.role, msg.user);
    }

    receive(msg: RevokeRole) {
        self._onlyRole(DEFAULT_ADMIN_ROLE, sender());
        self._revokeRole(msg.role, msg.user);
    }

    fun _initAdmin(user: Address) {
        require(!self.admin_initialized, "Already initialized");
        let roles: map<Int as uint16, Int as uint16> = emptyMap();
        roles.set(0, DEFAULT_ADMIN_ROLE);
        let userRoles: UserRoles = UserRoles{
            roles: roles,
            length: 1
        };
        self.user_roles.set(user, userRoles);
        self.admin_initialized = true;
        emit(RoleGranted{role: DEFAULT_ADMIN_ROLE, user: user, timestamp: now()}.toCell());
    }

    fun _grantRole(role: Int, user: Address) {
        if (self.userExist(user)) {
            let userRoles: UserRoles = self.userRoles(user);
            require(!self.hasRole(role, user), "User role already granted");
            userRoles.length += 1;
            userRoles.roles.set(userRoles.length, role);
            self.user_roles.set(user, userRoles);
        } else {
            let roles: map<Int as uint16, Int as uint16> = emptyMap();
            roles.set(0, role);
            let userRoles: UserRoles = UserRoles{
                roles: roles,
                length: 1
            };
            self.user_roles.set(user, userRoles);
        }
        emit(RoleGranted{role: role, user: user, timestamp: now()}.toCell());
    }

    fun _revokeRole(role: Int, user: Address) {
        require(self.userExist(user), "No user roles granted");
        let userRoles: UserRoles = self.userRoles(user);
        require(self.hasRole(role, user), "User role not granted");
        let userRoleIndex: Int = self.userRoleIndex(role, user);
        require(userRoleIndex >= 0, "User role index not found");
        userRoles.length -= 1;
        userRoles.roles.del(userRoleIndex);
        emit(RoleRevoked{role: role, user: user, timestamp: now()}.toCell());
    }

    fun _onlyRole(role: Int, user: Address){
        require(self.hasRole(role, user), "Unauthorized user");
    }

    fun _onlyRoles(roles: map<Int, Int>, user: Address){
        let hasRole: Bool = false;

        foreach(key, role in roles) {
            if (self.hasRole(role, user)) {
                hasRole = true;
            }
        }
        require(hasRole, "Unauthorized user");
    }

    get fun userExist(user: Address): Bool {
        return self.user_roles.get(user) != null;
    }

    get fun userRoles(user: Address): UserRoles {
        return self.user_roles.get(user)!!;
    }

    get fun hasRole(role: Int, user: Address): Bool {
        if (!self.userExist(user)) { 
            return false;
        }
        let userRoles: UserRoles = self.userRoles(user);
        let userHasRole: Bool = false;
        foreach(key, data in userRoles.roles) {
            if (data == role) {
                userHasRole = true;
            }
        }
        return userHasRole;
    }

    get fun userRoleIndex(role: Int, user: Address): Int {
        if (!self.userExist(user)) { 
            return -1;
        }
        let userRoles: UserRoles = self.userRoles(user);
        let roleIndex: Int = -1;
        foreach(key, data in userRoles.roles) {
            if (data == role) {
                roleIndex = key;
            }
        }
        return roleIndex; 
    }
}