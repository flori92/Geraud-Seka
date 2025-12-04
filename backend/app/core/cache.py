"""
Simple in-memory cache for API responses
Helps reduce database load and improve response times
"""
from functools import wraps
from typing import Any, Callable, Optional
import hashlib
import json
import time

# Simple in-memory cache
_cache = {}
_cache_timestamps = {}

# Default TTL: 5 minutes
DEFAULT_TTL = 300


def cache_key(*args, **kwargs) -> str:
    """Generate a cache key from function arguments"""
    key_data = {
        "args": str(args),
        "kwargs": str(sorted(kwargs.items()))
    }
    key_string = json.dumps(key_data, sort_keys=True)
    return hashlib.md5(key_string.encode()).hexdigest()


def cached(ttl: int = DEFAULT_TTL):
    """
    Decorator to cache function results
    
    Args:
        ttl: Time to live in seconds (default: 300 = 5 minutes)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key
            key = f"{func.__module__}.{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Check if cached and not expired
            if key in _cache:
                timestamp = _cache_timestamps.get(key, 0)
                if time.time() - timestamp < ttl:
                    return _cache[key]
            
            # Call function and cache result
            result = await func(*args, **kwargs)
            _cache[key] = result
            _cache_timestamps[key] = time.time()
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Generate cache key
            key = f"{func.__module__}.{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Check if cached and not expired
            if key in _cache:
                timestamp = _cache_timestamps.get(key, 0)
                if time.time() - timestamp < ttl:
                    return _cache[key]
            
            # Call function and cache result
            result = func(*args, **kwargs)
            _cache[key] = result
            _cache_timestamps[key] = time.time()
            
            return result
        
        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


def clear_cache(pattern: Optional[str] = None):
    """
    Clear cache entries
    
    Args:
        pattern: Optional pattern to match keys (clears all if None)
    """
    if pattern is None:
        _cache.clear()
        _cache_timestamps.clear()
    else:
        keys_to_delete = [k for k in _cache.keys() if pattern in k]
        for key in keys_to_delete:
            del _cache[key]
            if key in _cache_timestamps:
                del _cache_timestamps[key]


def get_cache_stats() -> dict:
    """Get cache statistics"""
    return {
        "entries": len(_cache),
        "size_bytes": sum(len(str(v)) for v in _cache.values()),
        "oldest_entry": min(_cache_timestamps.values()) if _cache_timestamps else None,
        "newest_entry": max(_cache_timestamps.values()) if _cache_timestamps else None
    }
