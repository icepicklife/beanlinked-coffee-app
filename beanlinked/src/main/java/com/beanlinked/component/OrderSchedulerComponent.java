// Periodically scans active orders in the background to clean up abandoned carts 
// and send pickup reminders. Auto-cancels PENDING carts older than N minutes (default 30).
// Sends ONE reminder SMS for READY orders unclaimed for M minutes (default 15).

package com.beanlinked.component;

import com.beanlinked.entity.CoffeeOrder;
import com.beanlinked.repository.CoffeeOrderRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
 
@Component
public class OrderSchedulerComponent {

    @Autowired 
    private CoffeeOrderRepository orderRepo;
    
    @Autowired 
    private SMSNotificationComponent smsComponent;

    @Value("${beanlinked.scheduler.pending-timeout-minutes:30}") 
    private long pendingTimeoutMinutes;
    
    @Value("${beanlinked.scheduler.ready-reminder-minutes:15}")  
    private long readyReminderMinutes;

    @Scheduled(fixedRateString = "${beanlinked.scheduler.rate-ms:60000}",
               initialDelayString = "${beanlinked.scheduler.rate-ms:60000}")
    public void processStaleAndUnclaimedOrders() {
        int cancelled = cancelStalePendingOrders();
        int reminded = remindUnclaimedReadyOrders();
        if (cancelled > 0 || reminded > 0) {
            System.out.println("[Scheduler] cancelled=" + cancelled + " reminded=" + reminded);
        }
    }

    private int cancelStalePendingOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(pendingTimeoutMinutes);
        List<CoffeeOrder> stale = orderRepo.findByStatusAndCreatedAtBefore("PENDING", cutoff);
        for (CoffeeOrder order : stale) {
            order.setStatus("CANCELLED");
            orderRepo.save(order);
            System.out.println("[Scheduler] Auto-cancelled PENDING order #" + order.getId()
                    + " (older than " + pendingTimeoutMinutes + " min)");
        }
        return stale.size();
    }

    private int remindUnclaimedReadyOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(readyReminderMinutes);
        List<CoffeeOrder> unclaimed =
                orderRepo.findByStatusAndReadyAtBeforeAndReminderSentFalse("READY", cutoff);
        int sent = 0;
        for (CoffeeOrder order : unclaimed) {
            String msg = "[BeanLinked Ateneo Reminder] Hi " + order.getCustomer().getName()
                    + "! Order #" + order.getId() + " is still waiting for you at the "
                    + order.getPickupLocation() + " stall.";
            // mark as sent only if FakeTwilio accepts
            if (smsComponent.sendSms(order.getCustomer().getPhoneNumber(), msg)) {
                order.setReminderSent(true);
                orderRepo.save(order);
                sent++;
            }
        }
        return sent;
    }
}