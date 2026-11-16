// Connects order results to the external Twilio REST API using Retrofit to send SMS alerts.

package com.beanlinked.component;

import org.springframework.stereotype.Component;

@Component
public class SMSNotificationComponent {
    public void sendSms(String toPhone, String messageBody) {
        // Skeleton
        System.out.println("[SMSNotificationComponent Skeleton] To: " + toPhone + " | Body: " + messageBody);
    }
}