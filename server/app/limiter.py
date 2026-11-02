from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Shared Limiter instance using client IP
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    storage_uri="memory://"
)
