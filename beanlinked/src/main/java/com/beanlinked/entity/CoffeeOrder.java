package com.beanlinked.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import javax.persistence.*;
import javax.validation.constraints.*;

@Entity
public class CoffeeOrder {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@ManyToOne(optional = false)
	@NotNull
	private Customer customer;
	
	@NotBlank
	@Pattern(regexp = "JSEC|GONZAGA|MVP|ISO|ARETE")
	@Column(nullable = false)
	private String pickupLocation;
	
	@NotBlank
	@Pattern(regexp = "PENDING|PREPARING|READY|COMPLETED|CANCELLED")
	@Column(nullable = false)
	private String status;
	
	@NotNull
	@DecimalMin("0.00")
	@Column(nullable = false)
	private BigDecimal totalAmount;
	
	@NotNull
	@Column(nullable = false)
	private LocalDateTime createdAt;
	
	private LocalDateTime readyAt;
	
	@NotNull
	@Column(nullable = false)
	private Boolean reminderSent = false;
	
	public CoffeeOrder() {}
	
	public CoffeeOrder(Customer customer, String pickupLocation) {
		
		this.customer = customer;
		this.pickupLocation = pickupLocation;
		this.status = "PENDING";
		this.totalAmount = new BigDecimal("0.00");
		this.createdAt = LocalDateTime.now();
		this.reminderSent = false;
		
	}
	
	public Long getId() {
		
		return id;
		
	}
	
	public void setId(Long id) {
		
		this.id = id;
		
	}
	
	public Customer getCustomer() {
		
		return customer;
		
	}
	
	public void setCustomer(Customer customer) {
		
		this.customer = customer;
		
	}
	
	public String getPickupLocation() {
		
		return pickupLocation;
		
	}
	
	public void setPickupLocation(String pickupLocation) {
		
		this.pickupLocation = pickupLocation;
		
	}
	
	public String getStatus() {
		
		return status;
		
	}
	
	public void setStatus(String status) {
		
		this.status = status;
		
	}
	
	public BigDecimal getTotalAmount() {
		
		return totalAmount;
		
	}
	
	public void setTotalAmount(BigDecimal totalAmount) {
		
		this.totalAmount = totalAmount;
		
	}
	
	public LocalDateTime getCreatedAt() {
		
		return createdAt;
		
	}
	
	public void setCreatedAt(LocalDateTime createdAt) {
		
		this.createdAt = createdAt;
		
	}
	
	public LocalDateTime getReadyAt() {
		
		return readyAt;
		
	}
	
	public void setReadyAt(LocalDateTime readyAt) {
		
		this.readyAt = readyAt;
		
	}
	
	public Boolean getReminderSent() {
		
		return reminderSent;
		
	}
	
	public void setReminderSent(Boolean reminderSent) {
		
		this.reminderSent = reminderSent;
		
	}
}
