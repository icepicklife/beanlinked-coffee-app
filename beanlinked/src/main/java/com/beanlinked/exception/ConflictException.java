package com.beanlinked.exception;

/** 409: duplicates, out-of-stock, invalid status transition, record still in use. */
public class ConflictException extends ApiException {
    public ConflictException(String message) { super(409, message); }
}
