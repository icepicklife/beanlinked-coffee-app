package com.beanlinked.retrofit;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.Field;
import retrofit2.http.FormUrlEncoded;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.Url;


public interface FakeTwilioAPI {

    @FormUrlEncoded
    @POST
    Call<ResponseBody> sendMessage(
            @Url String url,
            @Header("Authorization") String authHeader,
            @Field("To") String to,
            @Field("MessagingServiceSid") String messagingServiceSid,
            @Field("Body") String body);
}