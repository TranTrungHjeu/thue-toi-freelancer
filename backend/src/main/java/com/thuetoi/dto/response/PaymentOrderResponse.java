package com.thuetoi.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentOrderResponse(
    String orderCode,
    String status,
    BigDecimal amount,
    String vaNumber,
    String vaHolderName,
    String bankName,
    String accountNumber,
    String qrCodeData,
    String qrCodeUrl,
    LocalDateTime expiredAt,
    LocalDateTime paidAt,
    Long projectId,
    String vietqrUrl
) {
}
