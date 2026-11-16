package com.beanlinked.repository;

import com.beanlinked.entity.*;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoffeeOrderRepository extends JpaRepository<CoffeeOrder, Long> {
	
	List<CoffeeOrder> findByStatus(String status);
	List<CoffeeOrder> findByCustomer_MemberCode(String memberCode);
	List<CoffeeOrder> findByStatusAndCustomer_MemberCode(String status, String memberCode);
	List<CoffeeOrder> findByStatusAndCreatedAtBefore(String status, LocalDateTime cutoff);
	List<CoffeeOrder> findByStatusAndReadyAtBeforeAndReminderSentFalse(String status, LocalDateTime cutoff);
	
}
