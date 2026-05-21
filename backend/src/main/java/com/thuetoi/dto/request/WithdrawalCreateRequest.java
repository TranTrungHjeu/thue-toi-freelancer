package com.thuetoi.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO user tạo yêu cầu rút tiền.
 *
 * Có 2 cách cung cấp thông tin ngân hàng:
 *   - Chọn từ tài khoản đã lưu: truyền {@code bankAccountId} (các trường còn lại sẽ bị bỏ qua / lấy snapshot).
 *   - Nhập thủ công: truyền đầy đủ {@code bankName}, {@code accountNumber}, {@code accountHolder}.
 *     Cờ {@code saveBankAccount} sẽ lưu lại vào danh sách tài khoản đã lưu của user.
 */
@Data
public class WithdrawalCreateRequest {

    @NotNull(message = "Số tiền rút không được để trống")
    @DecimalMin(value = "1000", inclusive = true, message = "Số tiền rút phải lớn hơn hoặc bằng 1.000 VND")
    private BigDecimal amount;

    private Long bankAccountId;

    @Size(max = 120, message = "Tên ngân hàng tối đa 120 ký tự")
    private String bankName;

    @Size(max = 32, message = "Mã ngân hàng tối đa 32 ký tự")
    private String bankCode;

    @Size(max = 64, message = "Số tài khoản tối đa 64 ký tự")
    private String accountNumber;

    @Size(max = 200, message = "Tên chủ tài khoản tối đa 200 ký tự")
    private String accountHolder;

    @Size(max = 512, message = "Đường dẫn QR tối đa 512 ký tự")
    private String qrImageUrl;

    private Boolean saveBankAccount;
}
