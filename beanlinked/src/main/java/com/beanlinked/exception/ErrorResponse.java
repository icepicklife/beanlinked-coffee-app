package com.beanlinked.exception;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/** The single JSON error shape documented in 00 §3.3. */
public class ErrorResponse {
    private final int status;
    private final String error;
    private final String message;
    private final List<String> details;
    private final String timestamp = LocalDateTime.now().toString();

    public ErrorResponse(int status, String message, List<String> details) {
        this.status = status;
        Response.Status s = Response.Status.fromStatusCode(status);
        this.error = s != null ? s.getReasonPhrase() : "Error";
        this.message = message;
        this.details = details == null ? Collections.emptyList() : details;
    }

    public static Response build(int status, String message) {
        return build(status, message, null);
    }

    public static Response build(int status, String message, List<String> details) {
        return Response.status(status)
                .type(MediaType.APPLICATION_JSON)
                .entity(new ErrorResponse(status, message, details))
                .build();
    }

    public int getStatus() { return status; }
    public String getError() { return error; }
    public String getMessage() { return message; }
    public List<String> getDetails() { return details; }
    public String getTimestamp() { return timestamp; }
}
