package com.beanlinked.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.util.List;
import javax.persistence.*;
import javax.validation.constraints.*;

@Entity
public class OrderItem {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@ManyToOne(optional = false)
	@NotNull
	@JsonIgnore
	private CoffeeOrder coffeeOrder;
	
	@ManyToOne(optional = false)
	@NotNull
	private BaseDrink baseDrink;
	
	@ManyToMany(fetch = FetchType.EAGER)
	private List<Modifier> modifiers;
	
	@NotBlank
	@Pattern(regexp = "REGULAR|MEDIUM|LARGE")
	private String size;
	
	@NotBlank
	@Pattern(regexp = "NONE|LESS|NORMAL|EXTRA")
	private String iceLevel;
	
	@NotBlank
	@Pattern(regexp = "0%|25%|50%|75%|100%")
	private String sugarLevel;
	
	@Size(max = 120)
	private String cupNotes;
	
	@NotNull
	@DecimalMin("0.00")
	private BigDecimal subtotal;
	
	public OrderItem() {}
	
	public Long getId() {
		
		return id;
		
	}
	
	public void setId(Long id) {
		
		this.id = id;
		
	}
	
	public CoffeeOrder getCoffeeOrder() {
		
		return coffeeOrder;
		
	}
	
	public void setCoffeeOrder(CoffeeOrder coffeeOrder) {
		
		this.coffeeOrder = coffeeOrder;
		
	}
	
	public BaseDrink getBaseDrink() {
		
		return baseDrink;
		
	}
	
	public void setBaseDrink(BaseDrink baseDrink) {
		
		this.baseDrink = baseDrink;
		
	}
	
	public List<Modifier> getModifiers() {
		
		return modifiers;
		
	}
	
	public void setModifiers(List<Modifier> modifiers) {
		
		this.modifiers = modifiers;
		
	}
	
	public String getSize() {
		
		return size;
		
	}
	
	public void setSize(String size) {
		
		this.size = size;
		
	}
	
	public String getIceLevel() {
		
		return iceLevel;
		
	}
	
	public void setIceLevel(String iceLevel) {
		
		this.iceLevel = iceLevel;
		
	}
	
	public String getSugarLevel() {
		
		return sugarLevel;
		
	}
	
	public void setSugarLevel(String sugarLevel) {
		
		this.sugarLevel = sugarLevel;
		
	}
	
	public String getCupNotes() {
		
		return cupNotes;
		
	}
	
	public void setCupNotes(String cupNotes) {
		
		this.cupNotes = cupNotes;
		
	}
	
	public BigDecimal getSubtotal() {
		
		return subtotal;
		
	}
	
	public void setSubtotal(BigDecimal subtotal) {
		
		this.subtotal = subtotal;
		
	}
	
}
