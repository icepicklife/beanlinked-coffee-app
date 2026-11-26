package com.beanlinked.exception;

import java.util.List;
import java.util.stream.Collectors;
import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
import javax.validation.Path;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

/** @Valid / @NotNull failures -> 400 with one line per field, e.g. "memberCode: must be 6 digits". */
@Provider
public class ValidationExceptionMapper implements ExceptionMapper<ConstraintViolationException> {
    @Override
    public Response toResponse(ConstraintViolationException e) {
        List<String> details = e.getConstraintViolations().stream()
                .map(v -> fieldName(v) + ": " + v.getMessage())
                .sorted()
                .collect(Collectors.toList());
        return ErrorResponse.build(400, "Validation failed", details);
    }

    /** "registerCustomer.arg0.memberCode" -> "memberCode" */
    private static String fieldName(ConstraintViolation<?> v) {
        String last = "value";
        for (Path.Node node : v.getPropertyPath()) {
            if (node.getName() != null) last = node.getName();
        }
        return last.startsWith("arg") ? "parameter" : last;
    }
}
