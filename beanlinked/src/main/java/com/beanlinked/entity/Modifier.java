package com.beanlinked.entity;

import java.math.BigDecimal;
import javax.persistence.*;
import javax.validation.constraints.*;

@Entity
public class Modifier {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@NotBlank
	@Column(unique = true, nullable = false)
	private String name;
	
	@NotBlank
	@Pattern(regexp = "MILK|SYRUP|TOPPING|SHOT")
	@Column(nullable = false)
	private String type;
	
	@NotNull
	@DecimalMin("0.00")
	@Column(nullable = false)
	private BigDecimal extraCost;
	
	@NotNull
	@Column(nullable = false)
	private Boolean inStock;
	
	public Modifier() {}
	
	public Modifier(String name, String type, BigDecimal extraCost, Boolean inStock) {
		
		this.name = name;
		this.type = type;
		this.extraCost = extraCost;
		this.inStock = inStock;
		
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
	
	public String getType() {
		
		return type;
		
	}
	
	public void setType(String type) {
		
		this.type = type;
		
	}
	
	public BigDecimal getExtraCost() {
		
		return extraCost;
		
	}
	
	public void setExtraCost(BigDecimal extraCost) {
		
		this.extraCost = extraCost;
		
	}
	
	public Boolean getInStock() {
		
		return inStock;
		
	}
	
	public void setInStock(Boolean inStock) {
		
		this.inStock = inStock;
		
	}

}
