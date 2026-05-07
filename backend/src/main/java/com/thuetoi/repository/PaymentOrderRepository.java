package com.thuetoi.repository;

import com.thuetoi.entity.PaymentOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {

    @Query("SELECT p FROM PaymentOrder p JOIN FETCH p.bid b JOIN FETCH b.project bp JOIN FETCH bp.user "
        + "JOIN FETCH b.freelancer JOIN FETCH p.customer WHERE p.orderCode = :code")
    Optional<PaymentOrder> findDetailedByOrderCode(@Param("code") String orderCode);

    Optional<PaymentOrder> findByOrderCode(String orderCode);

    @Query("SELECT p FROM PaymentOrder p JOIN FETCH p.bid WHERE p.projectId = :pid AND p.status IN :st")
    List<PaymentOrder> findWithBidByProjectIdAndStatusIn(@Param("pid") Long projectId, @Param("st") List<String> statuses);

    List<PaymentOrder> findByProjectIdAndStatusIn(Long projectId, List<String> statuses);

    @EntityGraph(attributePaths = { "customer" })
    Optional<PaymentOrder> findByOrderCodeAndCustomerId(String orderCode, Long customerId);
}
