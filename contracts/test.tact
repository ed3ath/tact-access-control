import "@stdlib/deploy";
import "./access_control.tact";

const TESTER_ROLE: Int = 2;

contract TestAccessControl with Deployable, AccessControl {
    admin_initialized: Bool = false;
    roles_length: Int = 0;
    user_roles: map<Address, UserRoles> = emptyMap();

    init() {
        self._initAdmin(sender());
    }

    receive("only admin") {
        self._onlyRole(DEFAULT_ADMIN_ROLE, sender());
    }

    receive("only tester") {
        self._onlyRole(TESTER_ROLE, sender());
    }

    receive("only tester or admin") {
        let allowed: map<Int, Int> = emptyMap();
        allowed.set(0, DEFAULT_ADMIN_ROLE);
        allowed.set(1, TESTER_ROLE);
        self._onlyRoles(allowed, sender());
    }
}