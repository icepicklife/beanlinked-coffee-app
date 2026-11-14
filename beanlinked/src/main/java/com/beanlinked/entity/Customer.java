package com.beanlinked.entity;

import com.fasterxml.jackson.annotation.JsonAlias;
import javax.persistence.*;
import javax.validation.constraints.*;

@Entity
public class Customer {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@NotBlank
	@Pattern(regexp = "^\\d{6}$", message = "memberCode (6-digit Ateneo ID) must be 6 digits")
	@Column(unique = true, nullable = false)
	@JsonAlias({"studentId", "ateneoId"})
	private String memberCode;
	
	@NotBlank
	@Size(min = 2, max = 100)
	@Column(nullable = false)
	private String name;
	
	@NotBlank
	@Pattern(regexp = "^\\+639\\d{9}$", message = "phoneNumber must match +639XXXXXXXXX")
	@Column(nullable = false)
	private String phoneNumber;
	
	public Customer() {}
	
	public Customer(String memberCode, String name, String phoneNumber) {
		
		this.memberCode = memberCode;
		this.name = name;
		this.phoneNumber = phoneNumber;
		
	}
	
	public Long getId() {
		
		return id;
		
	}
	
	public void setId(Long id) {
		
		this.id = id;
		
	}
	
	public String getMemberCode() {
		
		return memberCode;
		
	}
	
	public void setMemberCode(String memberCode) {
		
		this.memberCode = memberCode;
		
	}
	
	public String getName() {
		
		return name;
		
	}
	
	public void setName(String name) {
		
		this.name = name;
		
	}
	
	public String getPhoneNumber() {
		
		return phoneNumber;
		
	}
	
	public void setPhoneNumber(String phoneNumber) {
		
		this.phoneNumber = phoneNumber;
		
	}
	
	
	
}
