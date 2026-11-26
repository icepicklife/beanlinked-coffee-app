package com.beanlinked.exception;

/** 400: input is syntactically fine but not acceptable (bad filter value, etc.). */
public class InvalidRequestException extends ApiException {
    public InvalidRequestException(String message) { super(400, message); }
}
