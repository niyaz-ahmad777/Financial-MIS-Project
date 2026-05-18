BLOCKED_USERS = {"blocked_user"}


def is_login_allowed(username: str) -> bool:
    if not username:
        return False
    return username not in BLOCKED_USERS
