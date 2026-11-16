package com.beanlinked.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import javax.validation.constraints.*;

public class OrderCreateDTO {
    @NotBlank
    @Pattern(regexp = "^\\d{6}$", message = "Member code (your Student ID) must be exactly 6 digits")
    @JsonAlias({"studentId", "ateneoId"})
    private String memberCode;

    @NotBlank
    @Pattern(regexp = "JSEC|GONZAGA|MVP|ISO|ARETE", message = "Pickup location must be JSEC, GONZAGA, MVP, ISO, or ARETE")
    private String pickupLocation;

    public String getMemberCode() { 
        return memberCode; 
    }

    public void setMemberCode(String memberCode) { 
        this.memberCode = memberCode; 
    }

    public String getPickupLocation() { 
        return pickupLocation; 
    }

    public void setPickupLocation(String pickupLocation) { 
        this.pickupLocation = pickupLocation; 
    }
}