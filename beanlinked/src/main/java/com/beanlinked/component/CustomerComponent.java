package com.beanlinked.component;

import com.beanlinked.entity.Customer;
import com.beanlinked.exception.ConflictException;
import com.beanlinked.exception.ResourceNotFoundException;
import com.beanlinked.repository.CoffeeOrderRepository;
import com.beanlinked.repository.CustomerRepository;
import java.util.Collections;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class CustomerComponent {

    @Autowired private CustomerRepository customerRepo;
    @Autowired private CoffeeOrderRepository orderRepo;

    /** With memberCode: exactly that customer or 404 (the UI uses the 404 to show "Register"). */
    public List<Customer> getCustomers(String memberCode) {
        if (memberCode != null && !memberCode.trim().isEmpty()) {
            String code = memberCode.trim();
            Customer c = customerRepo.findByMemberCode(code)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "No customer registered with memberCode " + code));
            return Collections.singletonList(c);
        }
        return customerRepo.findAll();
    }

    public Customer registerCustomer(Customer customer) {
        customer.setId(null); // POST always creates; never overwrite an existing row by id
        if (customerRepo.existsByMemberCode(customer.getMemberCode())) {
            throw new ConflictException("memberCode " + customer.getMemberCode() + " is already registered");
        }
        return customerRepo.save(customer);
    }

    public void deleteCustomer(Long id) {
        Customer c = customerRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer #" + id + " not found"));
        int orders = orderRepo.findByCustomer_MemberCode(c.getMemberCode()).size();
        if (orders > 0) {
            throw new ConflictException("Customer #" + id + " still has " + orders
                    + " order(s). Delete those orders first");
        }
        customerRepo.delete(c);
    }
}
