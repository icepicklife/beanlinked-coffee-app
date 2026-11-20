package com.beanlinked.config;

import com.beanlinked.controller.BeanLinkedController;
import org.glassfish.jersey.server.ResourceConfig;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JerseyConfig extends ResourceConfig {

    public JerseyConfig() {
        register(BeanLinkedController.class);
    }
}