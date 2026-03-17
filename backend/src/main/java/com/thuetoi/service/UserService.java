package com.thuetoi.service;

import com.thuetoi.entity.User;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.exception.BusinessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service User: Xử lý logic nghiệp vụ người dùng
 */
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Đăng ký tài khoản mới
     */
    public User register(String email, String password, String fullName, String role) {
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("ERR_AUTH_05", "Email đã tồn tại");
        }
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setRole(role);
        user.setIsActive(true);
        return userRepository.save(user);
    }

    /**
     * Đăng nhập
     */
    public User login(String email, String password) {
        User user = userRepository.findByEmail(email);
        if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessException("ERR_AUTH_02", "Sai email hoặc mật khẩu");
        }
        if (!user.getIsActive()) {
            throw new BusinessException("ERR_AUTH_03", "Tài khoản đã bị khoá");
        }
        return user;
    }

    /**
     * Lấy thông tin user
     */
    public Optional<User> getUser(Long id) {
        return userRepository.findById(id);
    }
}
