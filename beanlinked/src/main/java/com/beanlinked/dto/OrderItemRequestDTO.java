package com.beanlinked.dto;

import java.util.List;
import javax.validation.constraints.*;

public class OrderItemRequestDTO {
    @NotNull 
    private Long orderId;

    @NotNull 
    private Long baseDrinkId;

    private List<Long> modifierIds;

    @NotBlank 
    @Pattern(regexp = "REGULAR|LARGE") 
    private String size;

    @NotBlank 
    @Pattern(regexp = "NONE|LESS|NORMAL|EXTRA") 
    private String iceLevel;

    @NotBlank 
    @Pattern(regexp = "0%|25%|50%|75%|100%") 
    private String sugarLevel;

    @Size(max = 120) 
    private String cupNotes;

    public Long getOrderId() { 
        return orderId; 
    }

    public void setOrderId(Long orderId) { 
        this.orderId = orderId; 
    }
   
    public Long getBaseDrinkId() { 
        return baseDrinkId; 
    }

    public void setBaseDrinkId(Long baseDrinkId) { 
        this.baseDrinkId = baseDrinkId; 
    }
   
    public List<Long> getModifierIds() { 
        return modifierIds; 
    }
    
    public void setModifierIds(List<Long> modifierIds) { 
        this.modifierIds = modifierIds; 
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
}