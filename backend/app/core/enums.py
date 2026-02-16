from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    SUPER_ADMIN = "super_admin"
    BUSINESS_ADMIN = "business_admin"
    ENTERPRISE_ADMIN = "enterprise_admin"
