package com.beanlinked.exception;

/** Base for all expected business errors. The HTTP status travels with the exception. */
public class ApiException extends RuntimeException {
    private final int status;

    public ApiException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int getStatus() { return status; }
}
