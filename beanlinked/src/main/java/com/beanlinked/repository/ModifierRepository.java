package com.beanlinked.repository;

import com.beanlinked.entity.*;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModifierRepository extends JpaRepository<Modifier, Long> {

	List<Modifier> findByType(String type);
	List<Modifier> findByInStockTrue();
	
}
