package com.beanlinked.repository;

import com.beanlinked.entity.*;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BaseDrinkRepository extends JpaRepository<BaseDrink, Long> {

	List<BaseDrink> findByCategory(String category);
	List<BaseDrink> findByAvailableTrue();
	
}


