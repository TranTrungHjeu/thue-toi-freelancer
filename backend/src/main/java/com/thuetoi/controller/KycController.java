package com.thuetoi.controller;

import java.security.Principal;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.entity.KycRequest;
import com.thuetoi.exception.BusinessException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thuetoi.entity.User;
import com.thuetoi.repository.KycRequestRepository;
import com.thuetoi.repository.UserRepository;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.AdminService;
import com.thuetoi.service.FptAiService;
import com.thuetoi.service.NotificationService;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/kyc")
public class KycController {

    @Autowired
    private CurrentUserProvider currentUserProvider;

    @Autowired
    private KycRequestRepository kycRequestRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private FptAiService fptAiService;

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/auto-verify")
    public ApiResponse<KycRequest> autoVerify(
            @RequestParam("image") MultipartFile image,
            Principal principal) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("ERR_AUTH_01", "Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        try {
            // 1. Gọi FPT AI để quét CCCD
            String ocrResult = fptAiService.recognizeIdCard(image);

            // 2. Parse kết quả JSON
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(ocrResult);

            if (!root.has("data") || root.get("data").isEmpty()) {
                throw new BusinessException("ERR_KYC_01", "Không thể nhận diện được CCCD. Vui lòng chụp rõ nét hơn.");
            }

            JsonNode data = root.get("data").get(0);
            String idNumber = data.path("id").asText();
            String fullName = data.path("name").asText();
            String birthday = data.path("dob").asText();

            // 3. Kiểm tra logic (So sánh tên quét được với tên trong profile)
            // Chuẩn hóa tên để so sánh (bỏ dấu hoặc viết hoa)
            boolean nameMatches = user.getFullName().equalsIgnoreCase(fullName);

            // 4. Lưu hoặc cập nhật KycRequest
            KycRequest request = kycRequestRepository.findByUserId(userId).orElse(new KycRequest());
            request.setUserId(userId);
            request.setIdNumber(idNumber);
            request.setFullName(fullName);
            request.setBirthday(birthday);

            if (nameMatches) {
                request.setStatus("APPROVED");
                request.setNote("Tự động xác thực thành công qua FPT AI");
                kycRequestRepository.save(request);

                // Cập nhật tích xanh cho User
                adminService.approveKyc(request.getId());

                return ApiResponse.success("Xác thực danh tính tự động thành công!", request);
            } else {
                request.setStatus("PENDING");
                request.setNote("Thông tin không khớp hoàn toàn (Tên quét được: " + fullName + "). Chờ Admin duyệt thủ công.");
                kycRequestRepository.save(request);

                return ApiResponse.success("Thông tin đã được gửi. Chờ Quản trị viên đối chiếu tên khớp với hồ sơ.", request);
            }

        } catch (Exception e) {
            throw new BusinessException("ERR_KYC_02", "Lỗi trong quá trình xử lý xác thực: " + e.getMessage());
        }
    }

    @PostMapping("/request")
    public ApiResponse<KycRequest> requestVerification(Principal principal) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        Optional<KycRequest> existing = kycRequestRepository.findByUserId(userId);
        if (existing.isPresent() && "PENDING".equalsIgnoreCase(existing.get().getStatus())) {
            throw new BusinessException("ERR_SYS_02", "Yêu cầu xác thực đang chờ xử lý", HttpStatus.CONFLICT);
        }

        KycRequest request = existing.orElse(new KycRequest());
        request.setUserId(userId);
        request.setStatus("PENDING");
        request.setNote(null);

        KycRequest saved;
        try {
            saved = kycRequestRepository.save(request);
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException("ERR_SYS_02", "Yêu cầu xác thực đang chờ xử lý", HttpStatus.CONFLICT, ex);
        }
        notificationService.broadcastNotification(
            "admin",
            "system",
            "Có yêu cầu KYC mới",
            "Một người dùng vừa gửi yêu cầu xác thực danh tính.",
            "/workspace/admin/kyc",
            null
        );
        return ApiResponse.success("Đã gửi yêu cầu xác thực tới Quản trị viên", saved);
    }

    @GetMapping("/my-status")
    public ApiResponse<KycRequest> getMyStatus(Principal principal) {
        Long userId = currentUserProvider.requireCurrentUserId(principal);
        return kycRequestRepository.findByUserId(userId)
            .map(req -> ApiResponse.success("Trạng thái KYC", req))
            .orElse(ApiResponse.success("Chưa có yêu cầu KYC", null));
    }
}
