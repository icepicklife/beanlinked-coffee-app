package com.beanlinked.exception;

import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;
import org.springframework.dao.DataIntegrityViolationException;

/** Safety net for DB unique/foreign-key violations we didn't pre-check -> 409 instead of 500. */
@Provider
public class DataIntegrityExceptionMapper implements ExceptionMapper<DataIntegrityViolationException> {
    @Override
    public Response toResponse(DataIntegrityViolationException e) {
        return ErrorResponse.build(409,
                "Request conflicts with existing data (duplicate value, or record still used by an order)");
    }
}
