package com.beanlinked.exception;

// 404: an ID or memberCode that doesn't exist.
public class ResourceNotFoundException extends ApiException {
    public ResourceNotFoundException(String message) { super(404, message); }
}
