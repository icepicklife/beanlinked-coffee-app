package com.beanlinked.config;

import com.beanlinked.controller.BeanLinkedController;
import com.beanlinked.exception.ApiExceptionMapper;
import com.beanlinked.exception.DataIntegrityExceptionMapper;
import com.beanlinked.exception.GenericExceptionMapper;
import com.beanlinked.exception.ValidationExceptionMapper;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.servlet.ServletProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JerseyConfig extends ResourceConfig {

    public JerseyConfig() {
        register(BeanLinkedController.class);
        register(CorsFilter.class);
        register(ApiExceptionMapper.class);
        register(ValidationExceptionMapper.class);
        register(DataIntegrityExceptionMapper.class);
        register(GenericExceptionMapper.class);
        property(ServletProperties.FILTER_FORWARD_ON_404, true);
    }
}
