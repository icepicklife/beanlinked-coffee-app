package com.beanlinked.component;

import com.beanlinked.entity.Customer;
import com.beanlinked.repository.CustomerRepository;
import java.util.Collections;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class CustomerComponent {

    @Autowired private CustomerRepository customerRepo;

    public List<Customer> getCustomers(String memberCode) {
        if (memberCode != null && !memberCode.isEmpty()) {
            return customerRepo.findByMemberCode(memberCode)
                    .map(Collections::singletonList)
                    .orElse(Collections.emptyList());
        }
        return customerRepo.findAll();
    }

    public Customer registerCustomer(Customer customer) {
        return customerRepo.save(customer);
    }

    public void deleteCustomer(Long id) {
        customerRepo.deleteById(id);
    }
}
