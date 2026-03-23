package com.thuetoi.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO tạo hợp đồng từ bid đã chọn.
 */
@Data
public class ContractCreateRequest {
    @NotNull(message = "Bid không được để trống")
    private Long bidId;
}
