package com.beanlinked.controller;

import com.beanlinked.component.*;
import com.beanlinked.dto.*;
import com.beanlinked.entity.*;
import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.util.Collections;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BeanLinkedController {

    @Autowired private MenuComponent menuComponent;
    @Autowired private CustomerComponent customerComponent;
    @Autowired private OrderComponent orderComponent;

    // 1. Customer Endpoints
    @GET @Path("/customers")
    public Response getCustomers(@QueryParam("memberCode") String memberCode) {
        return Response.ok(customerComponent.getCustomers(memberCode)).build();
    }

    @POST @Path("/customers")
    public Response registerCustomer(@Valid Customer customer) {
        return Response.ok(customerComponent.registerCustomer(customer)).build();
    }

    @POST @Path("/customers/delete")
    @Consumes(MediaType.WILDCARD)
    public Response deleteCustomer(@NotNull @QueryParam("id") Long id) {
        customerComponent.deleteCustomer(id);
        return Response.ok("{\"status\":\"DELETED\",\"entity\":\"Customer\",\"id\":" + id + "}").build();
    }

    // 2. BaseDrink Endpoints
    @GET @Path("/drinks")
    public Response getDrinks(@QueryParam("category") String category) {
        return Response.ok(menuComponent.getBaseDrinks(category)).build();
    }

    @POST @Path("/drinks")
    public Response createDrink(@Valid BaseDrink drink) {
        return Response.ok(menuComponent.createBaseDrink(drink)).build();
    }

    @POST @Path("/drinks/delete")
    @Consumes(MediaType.WILDCARD)
    public Response deleteDrink(@NotNull @QueryParam("id") Long id) {
        menuComponent.deleteBaseDrink(id);
        return Response.ok("{\"status\":\"DELETED\",\"entity\":\"BaseDrink\",\"id\":" + id + "}").build();
    }

    // 3. Modifier Endpoints
    @GET @Path("/modifiers")
    public Response getModifiers(@QueryParam("type") String type) {
        return Response.ok(menuComponent.getModifiers(type)).build();
    }

    @POST @Path("/modifiers")
    public Response createModifier(@Valid Modifier modifier) {
        return Response.ok(menuComponent.createModifier(modifier)).build();
    }

    @POST @Path("/modifiers/delete")
    @Consumes(MediaType.WILDCARD)
    public Response deleteModifier(@NotNull @QueryParam("id") Long id) {
        menuComponent.deleteModifier(id);
        return Response.ok("{\"status\":\"DELETED\",\"entity\":\"Modifier\",\"id\":" + id + "}").build();
    }

    // 4. CoffeeOrder Endpoints
    @GET @Path("/orders")
    public Response getOrders(@QueryParam("status") String status, @QueryParam("memberCode") String memberCode) {
        return Response.ok(orderComponent.getOrders(status, memberCode)).build();
    }

    @POST @Path("/orders")
    public Response createOrder(@Valid OrderCreateDTO dto) {
        return Response.ok(orderComponent.createOrder(dto.getMemberCode(), dto.getPickupLocation())).build();
    }

    @POST @Path("/orders/status")
    @Consumes(MediaType.WILDCARD)
    public Response updateOrderStatus(@QueryParam("orderId") Long orderId,
            @QueryParam("status") String status) {
        if (orderId == null || status == null
                || !status.matches("(?i)PENDING|PREPARING|READY|COMPLETED|CANCELLED")) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Collections.singletonMap("error", "orderId and a valid status are required"))
                    .build();
        }
        return Response.ok(orderComponent.updateOrderStatus(orderId, status)).build();
    }

    @POST @Path("/orders/delete")
    @Consumes(MediaType.WILDCARD)
    public Response deleteOrder(@NotNull @QueryParam("id") Long id) {
        orderComponent.deleteOrder(id);
        return Response.ok("{\"status\":\"DELETED\",\"entity\":\"CoffeeOrder\",\"id\":" + id + "}").build();
    }

    // 5. OrderItem Endpoints
    @GET @Path("/order-items")
    public Response getOrderItems(@QueryParam("orderId") Long orderId) {
        return Response.ok(orderComponent.getOrderItems(orderId)).build();
    }

    @POST @Path("/order-items")
    public Response addOrderItem(@Valid OrderItemRequestDTO dto) {
        return Response.ok(orderComponent.addOrderItem(dto)).build();
    }

    @POST @Path("/order-items/delete")
    @Consumes(MediaType.WILDCARD)
    public Response deleteOrderItem(@NotNull @QueryParam("id") Long id) {
        orderComponent.removeOrderItem(id);
        return Response.ok("{\"status\":\"DELETED\",\"entity\":\"OrderItem\",\"id\":" + id + "}").build();
    }
}
