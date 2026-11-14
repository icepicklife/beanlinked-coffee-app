package com.beanlinked.component;

import com.beanlinked.dto.OrderItemRequestDTO;
import com.beanlinked.entity.*;
import com.beanlinked.repository.*;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import javax.ws.rs.NotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional
public class OrderComponent {

    @Autowired private CoffeeOrderRepository orderRepo;
    @Autowired private OrderItemRepository itemRepo;
    @Autowired private CustomerRepository customerRepo;
    @Autowired private BaseDrinkRepository drinkRepo;
    @Autowired private ModifierRepository modifierRepo;
    @Autowired private SMSNotificationComponent smsComponent;

    public List<CoffeeOrder> getOrders(String status, String memberCode) {
        if (status != null && !status.isEmpty() && memberCode != null && !memberCode.isEmpty()) {
            return orderRepo.findByStatusAndCustomer_MemberCode(status.toUpperCase(), memberCode);
        } else if (status != null && !status.isEmpty()) {
            return orderRepo.findByStatus(status.toUpperCase());
        } else if (memberCode != null && !memberCode.isEmpty()) {
            return orderRepo.findByCustomer_MemberCode(memberCode);
        }
        return orderRepo.findAll();
    }

    public CoffeeOrder createOrder(String memberCode, String pickupLocation) {
        Customer customer = customerRepo.findByMemberCode(memberCode)
                .orElseThrow(() -> new NotFoundException("Customer member code not found: " + memberCode));
        CoffeeOrder order = new CoffeeOrder(customer, pickupLocation.toUpperCase());
        return orderRepo.save(order);
    }

    public OrderItem addOrderItem(OrderItemRequestDTO dto) {
        CoffeeOrder order = orderRepo.findById(dto.getOrderId())
                .orElseThrow(() -> new NotFoundException("Order not found: " + dto.getOrderId()));
        BaseDrink drink = drinkRepo.findById(dto.getBaseDrinkId())
                .orElseThrow(() -> new NotFoundException("Base drink not found: " + dto.getBaseDrinkId()));
        List<Modifier> mods = (dto.getModifierIds() != null && !dto.getModifierIds().isEmpty())
                ? modifierRepo.findAllById(dto.getModifierIds())
                : Collections.emptyList();
        if (dto.getModifierIds() != null && dto.getModifierIds().stream()
                .anyMatch(id -> mods.stream().noneMatch(mod -> mod.getId().equals(id)))) {
            throw new NotFoundException("One or more modifiers do not exist");
        }

        OrderItem item = new OrderItem();
        item.setCoffeeOrder(order);
        item.setBaseDrink(drink);
        item.setModifiers(mods);
        item.setSize(dto.getSize());
        item.setIceLevel(dto.getIceLevel());
        item.setSugarLevel(dto.getSugarLevel());
        item.setCupNotes(dto.getCupNotes());
        item.setSubtotal(drink.getBasePrice()); // Simple skeleton subtotal; full math in Part III
        return itemRepo.save(item);
    }

    public void removeOrderItem(Long itemId) {
        itemRepo.deleteById(itemId);
    }

    public CoffeeOrder updateOrderStatus(Long orderId, String newStatus) {
        CoffeeOrder order = orderRepo.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        order.setStatus(newStatus.toUpperCase());
        if ("READY".equalsIgnoreCase(newStatus)) {
            order.setReadyAt(LocalDateTime.now());
            smsComponent.sendSms(order.getCustomer().getPhoneNumber(),
                    "Skeleton Test SMS: Order #" + order.getId() + " is READY at " + order.getPickupLocation());
        }
        return orderRepo.save(order);
    }

    public void deleteOrder(Long orderId) {
        List<OrderItem> items = itemRepo.findByCoffeeOrder_Id(orderId);
        itemRepo.deleteAll(items);
        orderRepo.deleteById(orderId);
    }

    public List<OrderItem> getOrderItems(Long orderId) {
        if (orderId != null) {
            return itemRepo.findByCoffeeOrder_Id(orderId);
        }
        return itemRepo.findAll();
    }
}
