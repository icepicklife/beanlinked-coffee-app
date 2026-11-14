package com.beanlinked.entity;

import java.math.BigDecimal;
import javax.persistence.*;
import javax.validation.constraints.*;

@Entity
public class BaseDrink {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@NotBlank
	@Column(unique = true, nullable = false)
	private String name;
	
	@NotBlank
	@Pattern(regexp = "COFFEE|TEA|NON_COFFEE")
	@Column(nullable = false)
	private String category;
	
	@NotNull
	@DecimalMin("50.00")
	@Column(nullable = false)
	private BigDecimal basePrice;
	
	@NotNull
	@Column(nullable = false)
	private Boolean available;
	
	public BaseDrink() {}
	
	public BaseDrink(String name, String category, BigDecimal basePrice, Boolean available) {
		
		this.name = name;
		this.category = category;
		this.basePrice = basePrice;
		this.available = available;
		
	}
	
	public Long getId() {
		
		return id;
		
	}
	
	public void setId(Long id) {
		
		this.id = id;
		
	}
	
	public String getName() {
		
		return name;
		
	}
	
	public void setName(String name) {
		
		this.name = name;
		
	}
	
	public String getCategory() {
		
		return category;
		
	}
	
	public void setCategory(String category) {
		
		this.category = category;
		
	}
	
	public BigDecimal getBasePrice() {
		
		return basePrice;
		
	}
	
	public void setBasePrice(BigDecimal basePrice) {
		
		this.basePrice = basePrice;
		
	}
	
	public Boolean getAvailable() {
		
		return available;
		
	}
	
	public void setAvailable(Boolean available) {
		
		this.available = available;
		
	}
}

