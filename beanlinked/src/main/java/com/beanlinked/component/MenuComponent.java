package com.beanlinked.component;

import com.beanlinked.entity.*;
import com.beanlinked.exception.ConflictException;
import com.beanlinked.exception.InvalidRequestException;
import com.beanlinked.exception.ResourceNotFoundException;
import com.beanlinked.repository.*;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import javax.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MenuComponent {

    private static final Set<String> CATEGORIES = Set.of("COFFEE", "TEA", "NON_COFFEE");
    private static final Set<String> MODIFIER_TYPES = Set.of("MILK", "SYRUP", "TOPPING", "SHOT");

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
            Customer c2 = customerRepo.save(new Customer("214882", "Mikaela Santos", "+639178880921"));

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

            // Second sample order at MVP for Mikaela: Matcha REGULAR + Vanilla syrup = 145 + 20 = 165
            BaseDrink matcha = drinkRepo.findAll().get(2);
            Modifier vanilla = modifierRepo.findAll().get(3);

            CoffeeOrder mvpOrder = new CoffeeOrder(c2, "MVP");
            mvpOrder.setStatus("PREPARING");
            mvpOrder.setTotalAmount(new BigDecimal("165.00"));
            mvpOrder = orderRepo.save(mvpOrder);

            OrderItem mvpItem = new OrderItem();
            mvpItem.setCoffeeOrder(mvpOrder);
            mvpItem.setBaseDrink(matcha);
            mvpItem.setModifiers(Arrays.asList(vanilla));
            mvpItem.setSize("REGULAR");
            mvpItem.setIceLevel("NORMAL");
            mvpItem.setSugarLevel("50%");
            mvpItem.setCupNotes("Pickup after my 1:30 class at MVP");
            mvpItem.setSubtotal(new BigDecimal("165.00"));
            itemRepo.save(mvpItem);
        }
    }

    // ---------------------------------------------------------------- Drinks

    public List<BaseDrink> getBaseDrinks(String category) {
        if (category != null && !category.trim().isEmpty()) {
            String c = category.trim().toUpperCase();
            if (!CATEGORIES.contains(c)) {
                throw new InvalidRequestException("Invalid category '" + category + "'. Allowed: COFFEE, TEA, NON_COFFEE");
            }
            return drinkRepo.findByCategory(c);
        }
        return drinkRepo.findByAvailableTrue();
    }

    public BaseDrink createBaseDrink(BaseDrink drink) {
        drink.setId(null);
        boolean duplicate = drinkRepo.findAll().stream()
                .anyMatch(d -> d.getName().equalsIgnoreCase(drink.getName().trim()));
        if (duplicate) throw new ConflictException("A drink named '" + drink.getName() + "' already exists");
        drink.setName(drink.getName().trim());
        return drinkRepo.save(drink);
    }

    public void deleteBaseDrink(Long id) {
        BaseDrink drink = drinkRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Base drink #" + id + " not found"));
        boolean inUse = itemRepo.findAll().stream()
                .anyMatch(i -> i.getBaseDrink().getId().equals(id));
        if (inUse) {
            throw new ConflictException("'" + drink.getName()
                    + "' is used in existing orders. Mark it unavailable instead of deleting");
        }
        drinkRepo.delete(drink);
    }

    // ------------------------------------------------------------- Modifiers

    public List<Modifier> getModifiers(String type) {
        if (type != null && !type.trim().isEmpty()) {
            String t = type.trim().toUpperCase();
            if (!MODIFIER_TYPES.contains(t)) {
                throw new InvalidRequestException("Invalid modifier type '" + type + "'. Allowed: MILK, SYRUP, TOPPING, SHOT");
            }
            return modifierRepo.findByType(t);
        }
        return modifierRepo.findByInStockTrue();
    }

    public Modifier createModifier(Modifier modifier) {
        modifier.setId(null);
        boolean duplicate = modifierRepo.findAll().stream()
                .anyMatch(m -> m.getName().equalsIgnoreCase(modifier.getName().trim()));
        if (duplicate) throw new ConflictException("A modifier named '" + modifier.getName() + "' already exists");
        modifier.setName(modifier.getName().trim());
        return modifierRepo.save(modifier);
    }

    public void deleteModifier(Long id) {
        Modifier modifier = modifierRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Modifier #" + id + " not found"));
        boolean inUse = itemRepo.findAll().stream()
                .anyMatch(i -> i.getModifiers() != null
                        && i.getModifiers().stream().anyMatch(m -> m.getId().equals(id)));
        if (inUse) {
            throw new ConflictException("Modifier '" + modifier.getName() + "' is used in existing orders");
        }
        modifierRepo.delete(modifier);
    }
}
