package com.beanlinked.component;

import com.beanlinked.retrofit.FakeTwilioAPI;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import javax.annotation.PostConstruct;
import okhttp3.Credentials;
import okhttp3.OkHttpClient;
import okhttp3.ResponseBody;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import retrofit2.Response;
import retrofit2.Retrofit;

// Sends order SMS notifications to FakeTwilio through Retrofit.
@Component
public class SMSNotificationComponent {

    @Value("${faketwilio.url}")                   private String url;
    @Value("${faketwilio.messaging-service-sid}") private String messagingServiceSid;
    @Value("${faketwilio.account-sid}")           private String accountSid;
    @Value("${faketwilio.auth-token}")            private String authToken;

    private final ObjectMapper mapper = new ObjectMapper();
    private FakeTwilioAPI api;
    private String authHeader;

    @PostConstruct
    public void init() {
        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(3, TimeUnit.SECONDS)   // fail fast if fakeTwilio isn't running
                .readTimeout(5, TimeUnit.SECONDS)
                .build();
        api = new Retrofit.Builder()
                .baseUrl("http://localhost/")
                .client(client)
                .build()
                .create(FakeTwilioAPI.class);
        authHeader = Credentials.basic(accountSid, authToken);
        System.out.println("[SMS] Retrofit client ready -> " + url);
    }

    /**
     * @return true if fakeTwilio accepted the message (HTTP 2xx). Never throws: an SMS failure
     *         must not roll back or crash the order request.
     */
    public boolean sendSms(String toPhone, String messageBody) {
        try {
            Response<ResponseBody> res =
                    api.sendMessage(url, authHeader, toPhone, messagingServiceSid, messageBody).execute();

            if (res.isSuccessful() && res.body() != null) {
                String raw = res.body().string();
                String status = "";
                try { status = mapper.readTree(raw).path("status").asText(""); } catch (Exception ignored) { }
                System.out.println("[SMS] SENT " + res.code() + " status=" + status
                        + " to " + toPhone + " | " + messageBody);
                return true;
            }
            String err = res.errorBody() == null ? "" : res.errorBody().string();
            System.err.println("[SMS] REJECTED " + res.code() + " to " + toPhone + " | " + err);
            return false;
        } catch (IOException e) {
            System.err.println("[SMS] fakeTwilio unreachable at " + url + " (" + e.getMessage()
                    + "). Is the fakeTwilio project running?");
            return false;
        }
    }
}