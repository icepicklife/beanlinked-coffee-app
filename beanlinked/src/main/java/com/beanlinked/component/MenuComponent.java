package com.beanlinked.component;

import com.beanlinked.entity.*;
import com.beanlinked.repository.*;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import javax.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MenuComponent {

    @Autowired private BaseDrinkRepository drinkRepo;
    @Autowired private ModifierRepository modifierRepo;
    @Autowired private CustomerRepository customerRepo;
    @Autowired private CoffeeOrderRepository orderRepo;
    @Autowired private OrderItemRepository itemRepo;

    @PostConstruct
    public void seedDatabase() {
        if (drinkRepo.count() == 0) {
            drinkRepo.save(new BaseDrink("Signature Spanish Latte", "COFFEE", new BigDecimal("130.00"), true));
            drinkRepo.save(new BaseDrink("JSEC Rush Cold Brew", "COFFEE", new BigDecimal("120.00"), true));
            drinkRepo.save(new BaseDrink("Gonzaga Uji Matcha Cloud", "TEA", new BigDecimal("145.00"), true));
            drinkRepo.save(new BaseDrink("Blue Eagle Dark Cocoa", "NON_COFFEE", new BigDecimal("125.00"), true));
        }
        if (modifierRepo.count() == 0) {
            modifierRepo.save(new Modifier("Sub Oat Milk", "MILK", new BigDecimal("35.00"), true));
            modifierRepo.save(new Modifier("Sub Soy Milk", "MILK", new BigDecimal("25.00"), true));
            modifierRepo.save(new Modifier("Extra Espresso Shot", "SHOT", new BigDecimal("30.00"), true));
            modifierRepo.save(new Modifier("Vanilla Bean Syrup", "SYRUP", new BigDecimal("20.00"), true));
            modifierRepo.save(new Modifier("Sea Salt Cream Foam", "TOPPING", new BigDecimal("30.00"), true));
        }
        if (customerRepo.count() == 0) {
            Customer c1 = customerRepo.save(new Customer("221409", "Lorenzo Reyes", "+639175550142"));
            customerRepo.save(new Customer("214882", "Mikaela Santos", "+639178880921"));

            BaseDrink spanishLatte = drinkRepo.findAll().get(0);
            Modifier oatMilk = modifierRepo.findAll().get(0);

            CoffeeOrder sampleOrder = new CoffeeOrder(c1, "JSEC");
            sampleOrder.setStatus("PREPARING");
            sampleOrder.setTotalAmount(new BigDecimal("185.00"));
            sampleOrder = orderRepo.save(sampleOrder);

            OrderItem sampleItem = new OrderItem();
            sampleItem.setCoffeeOrder(sampleOrder);
            sampleItem.setBaseDrink(spanishLatte);
            sampleItem.setModifiers(Arrays.asList(oatMilk));
            sampleItem.setSize("LARGE");
            sampleItem.setIceLevel("LESS");
            sampleItem.setSugarLevel("75%");
            sampleItem.setCupNotes("Extra cold please, rushing to CTC!");
            sampleItem.setSubtotal(new BigDecimal("185.00"));
            itemRepo.save(sampleItem);
        }
    }

    public List<BaseDrink> getBaseDrinks(String category) {
        if (category != null && !category.isEmpty()) {
            return drinkRepo.findByCategory(category.toUpperCase());
        }
        return drinkRepo.findByAvailableTrue();
    }

    public BaseDrink createBaseDrink(BaseDrink drink) {
        return drinkRepo.save(drink);
    }

    public void deleteBaseDrink(Long id) {
        drinkRepo.deleteById(id);
    }

    public List<Modifier> getModifiers(String type) {
        if (type != null && !type.isEmpty()) {
            return modifierRepo.findByType(type.toUpperCase());
        }
        return modifierRepo.findByInStockTrue();
    }

    public Modifier createModifier(Modifier modifier) {
        return modifierRepo.save(modifier);
    }

    public void deleteModifier(Long id) {
        modifierRepo.deleteById(id);
    }
}
