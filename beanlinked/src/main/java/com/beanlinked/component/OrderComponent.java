package com.beanlinked.component;

import com.beanlinked.dto.OrderItemRequestDTO;
import com.beanlinked.entity.BaseDrink;
import com.beanlinked.entity.CoffeeOrder;
import com.beanlinked.entity.Customer;
import com.beanlinked.entity.Modifier;
import com.beanlinked.entity.OrderItem;
import com.beanlinked.exception.ConflictException;
import com.beanlinked.exception.InvalidRequestException;
import com.beanlinked.exception.ResourceNotFoundException;
import com.beanlinked.repository.BaseDrinkRepository;
import com.beanlinked.repository.CoffeeOrderRepository;
import com.beanlinked.repository.CustomerRepository;
import com.beanlinked.repository.ModifierRepository;
import com.beanlinked.repository.OrderItemRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional
public class OrderComponent {

    public static final BigDecimal LARGE_UPCHARGE = new BigDecimal("20.00");

    public static final Set<String> STATUSES =
            Set.of("PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED");

    // allowed next statuses for each current status
    private static final Map<String, Set<String>> TRANSITIONS = Map.of(
            "PENDING",   Set.of("PREPARING", "CANCELLED"),
            "PREPARING", Set.of("READY", "CANCELLED"),
            "READY",     Set.of("COMPLETED", "CANCELLED"),
            "COMPLETED", Collections.emptySet(),
            "CANCELLED", Collections.emptySet());

    @Autowired 
    private CoffeeOrderRepository orderRepo;
    
    @Autowired 
    private OrderItemRepository itemRepo;
    
    @Autowired 
    private CustomerRepository customerRepo;
    
    @Autowired 
    private BaseDrinkRepository drinkRepo;
    
    @Autowired 
    private ModifierRepository modifierRepo;
    
    @Autowired 
    private SMSNotificationComponent smsComponent;

    // ------------------------------------------------------------------ Orders

    @Transactional(readOnly = true)
    public List<CoffeeOrder> getOrders(String status, String memberCode) {
        String s = blankToNull(status);
        String m = blankToNull(memberCode);
        if (s != null) {
            s = s.toUpperCase();
            if (!STATUSES.contains(s)) {
                throw new InvalidRequestException("Invalid status filter '" + status
                        + "'. Allowed: PENDING, PREPARING, READY, COMPLETED, CANCELLED");
            }
        }
        if (s != null && m != null) return orderRepo.findByStatusAndCustomer_MemberCode(s, m);
        if (s != null)              return orderRepo.findByStatus(s);
        if (m != null)              return orderRepo.findByCustomer_MemberCode(m);
        return orderRepo.findAll();
    }

    public CoffeeOrder createOrder(String memberCode, String pickupLocation) {
        Customer customer = customerRepo.findByMemberCode(memberCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No customer registered with memberCode " + memberCode));
        return orderRepo.save(new CoffeeOrder(customer, pickupLocation.trim().toUpperCase()));
    }

    public CoffeeOrder updateOrderStatus(Long orderId, String newStatus) {
        CoffeeOrder order = findOrder(orderId);
        String target = newStatus == null ? "" : newStatus.trim().toUpperCase();
        if (!STATUSES.contains(target)) {
            throw new InvalidRequestException("Invalid status '" + newStatus
                    + "'. Allowed: PENDING, PREPARING, READY, COMPLETED, CANCELLED");
        }

        String current = order.getStatus();
        Set<String> allowed = TRANSITIONS.getOrDefault(current, Collections.emptySet());
        if (!allowed.contains(target)) {
            throw new ConflictException("Order #" + orderId + " cannot go from " + current + " to " + target
                    + (allowed.isEmpty() ? " (" + current + " is final)" : ". Allowed next: " + allowed));
        }
        if ("PREPARING".equals(target) && itemRepo.findByCoffeeOrder_Id(orderId).isEmpty()) {
            throw new ConflictException("Order #" + orderId + " has no items yet. Add a drink before placing it");
        }

        order.setStatus(target);
        if ("READY".equals(target)) {
            order.setReadyAt(LocalDateTime.now());
            order.setReminderSent(false);
        }
        CoffeeOrder saved = orderRepo.save(order);

        if ("READY".equals(target)) {
            smsComponent.sendSms(saved.getCustomer().getPhoneNumber(), readyMessage(saved));
        }
        return saved;
    }

    public void deleteOrder(Long orderId) {
        CoffeeOrder order = findOrder(orderId);
        itemRepo.deleteAll(itemRepo.findByCoffeeOrder_Id(orderId));
        orderRepo.delete(order);
    }

    // order items

    @Transactional(readOnly = true)
    public List<OrderItem> getOrderItems(Long orderId) {
        if (orderId == null) return itemRepo.findAll();
        if (!orderRepo.existsById(orderId)) {
            throw new ResourceNotFoundException("Order #" + orderId + " not found");
        }
        return itemRepo.findByCoffeeOrder_Id(orderId);
    }

    public OrderItem addOrderItem(OrderItemRequestDTO dto) {
        CoffeeOrder order = findOrder(dto.getOrderId());
        requirePending(order, "add items to");

        BaseDrink drink = drinkRepo.findById(dto.getBaseDrinkId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Base drink #" + dto.getBaseDrinkId() + " not found"));
        if (!Boolean.TRUE.equals(drink.getAvailable())) {
            throw new ConflictException("'" + drink.getName() + "' is currently unavailable");
        }

        List<Modifier> mods = loadModifiers(dto.getModifierIds());

        OrderItem item = new OrderItem();
        item.setCoffeeOrder(order);
        item.setBaseDrink(drink);
        item.setModifiers(mods);
        item.setSize(dto.getSize().toUpperCase());
        item.setIceLevel(dto.getIceLevel().toUpperCase());
        item.setSugarLevel(dto.getSugarLevel());
        item.setCupNotes(dto.getCupNotes());
        item.setSubtotal(calculateSubtotal(drink, dto.getSize(), mods));

        OrderItem saved = itemRepo.save(item);
        recalculateOrderTotal(order);
        return saved;
    }

    public void removeOrderItem(Long itemId) {
        OrderItem item = itemRepo.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item #" + itemId + " not found"));
        CoffeeOrder order = item.getCoffeeOrder();
        requirePending(order, "remove items from");
        itemRepo.delete(item);
        recalculateOrderTotal(order);
    }

    // helper functions

    /** subtotal = basePrice + (LARGE ? 20.00 : 0) + sum(modifier.extraCost) */
    public static BigDecimal calculateSubtotal(BaseDrink drink, String size, List<Modifier> mods) {
        BigDecimal subtotal = drink.getBasePrice();
        if ("LARGE".equalsIgnoreCase(size)) subtotal = subtotal.add(LARGE_UPCHARGE);
        for (Modifier m : mods) {
        	subtotal = subtotal.add(m.getExtraCost());
        }
        return subtotal.setScale(2, RoundingMode.HALF_UP);
    }

    private List<Modifier> loadModifiers(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();
        Set<Long> unique = new LinkedHashSet<>(ids);          // [1,1,3] -> {1,3}
        if (unique.contains(null)) throw new InvalidRequestException("modifierIds must not contain null");

        List<Modifier> found = modifierRepo.findAllById(unique);
        if (found.size() != unique.size()) {
            Set<Long> missing = new HashSet<>(unique);
            missing.removeAll(found.stream().map(Modifier::getId).collect(Collectors.toSet()));
            throw new ResourceNotFoundException("Modifier(s) not found: " + missing);
        }
        for (Modifier m : found) {
            if (!Boolean.TRUE.equals(m.getInStock())) {
                throw new ConflictException("Modifier '" + m.getName() + "' is out of stock");
            }
        }
        return new ArrayList<>(found);
    }

    private void recalculateOrderTotal(CoffeeOrder order) {
        BigDecimal total = itemRepo.findByCoffeeOrder_Id(order.getId()).stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setTotalAmount(total.setScale(2, RoundingMode.HALF_UP));
        orderRepo.save(order);
    }

    private CoffeeOrder findOrder(Long orderId) {
        if (orderId == null) throw new InvalidRequestException("orderId is required");
        return orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order #" + orderId + " not found"));
    }

    private void requirePending(CoffeeOrder order, String action) {
        if (!"PENDING".equals(order.getStatus())) {
            throw new ConflictException("Cannot " + action + " order #" + order.getId()
                    + " because it is already " + order.getStatus());
        }
    }

    private static String blankToNull(String s) {
        return (s == null || s.trim().isEmpty()) ? null : s.trim();
    }

    private static String readyMessage(CoffeeOrder o) {
        return "[BeanLinked Ateneo] Hi " + o.getCustomer().getName()
                + "! Order #" + o.getId() + " (PHP " + o.getTotalAmount()
                + ") is READY for pickup at the " + o.getPickupLocation() + " stall.";
    }
}