package com.thuetoi.security;

import com.thuetoi.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.security.Principal;

@Component
public class CurrentUserProvider {

    public Long requireCurrentUserId(Principal principal) {
        if (principal == null) {
            throw new BusinessException("ERR_AUTH_01", "Người dùng chưa đăng nhập", HttpStatus.UNAUTHORIZED);
        }
        try {
            return Long.parseLong(principal.getName());
        } catch (NumberFormatException ex) {
            throw new BusinessException("ERR_AUTH_12", "Access token không hợp lệ", HttpStatus.UNAUTHORIZED, ex);
        }
    }
}
