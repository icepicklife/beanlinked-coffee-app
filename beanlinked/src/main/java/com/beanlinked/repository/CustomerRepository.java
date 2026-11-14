package com.beanlinked.repository;

import com.beanlinked.entity.*;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long>{

	Optional<Customer> findByMemberCode(String memberCode);
	boolean existsByMemberCode(String memberCode);
	
}
