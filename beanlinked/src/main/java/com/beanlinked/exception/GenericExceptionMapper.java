package com.beanlinked.exception;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

// 500 JSON: Unexpected errors 
@Provider
public class GenericExceptionMapper implements ExceptionMapper<Exception> {
    @Override
    public Response toResponse(Exception e) {
        // IMPORTANT: pass Jersey's own exceptions (404 unknown path, 405, 415...) through UNCHANGED.
        // With spring.jersey.type=filter + forwardOn404, Jersey only forwards a 404 to Spring
        // (to serve static/index.html) when that 404 has NO body. Wrapping it in JSON would break the UI.
        if (e instanceof WebApplicationException) {
            return ((WebApplicationException) e).getResponse();
        }
        e.printStackTrace();
        return ErrorResponse.build(500, "Unexpected server error: " + e.getClass().getSimpleName());
    }
}
