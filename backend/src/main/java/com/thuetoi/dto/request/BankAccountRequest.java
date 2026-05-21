package com.thuetoi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO tạo / cập nhật tài khoản ngân hàng đã lưu của user.
 */
@Data
public class BankAccountRequest {

    @NotBlank(message = "Tên ngân hàng không được để trống")
    @Size(max = 120, message = "Tên ngân hàng tối đa 120 ký tự")
    private String bankName;

    @Size(max = 32, message = "Mã ngân hàng tối đa 32 ký tự")
    private String bankCode;

    @NotBlank(message = "Số tài khoản không được để trống")
    @Size(max = 64, message = "Số tài khoản tối đa 64 ký tự")
    private String accountNumber;

    @NotBlank(message = "Tên chủ tài khoản không được để trống")
    @Size(max = 200, message = "Tên chủ tài khoản tối đa 200 ký tự")
    private String accountHolder;

    @Size(max = 512, message = "Đường dẫn QR tối đa 512 ký tự")
    private String qrImageUrl;

    private Boolean isDefault;
}
