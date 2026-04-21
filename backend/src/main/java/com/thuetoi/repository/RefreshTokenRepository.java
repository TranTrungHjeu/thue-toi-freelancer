package com.thuetoi.repository;

import com.thuetoi.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findByUser_IdAndRevokedFalse(Long userId);

    /**
     * Thu hồi toàn bộ refresh token đang hoạt động của một user.
     * Dùng khi đổi email hoặc khi phát hiện tài khoản bị xâm phạm.
     */
    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.user.id = :userId AND r.revoked = false")
    int revokeAllByUserId(@Param("userId") Long userId);

    /**
     * Thu hồi tất cả refresh token của user ngoại trừ token của session hiện tại.
     * Dùng khi đổi mật khẩu để vô hiệu hoá các thiết bị khác mà không ảnh hưởng phiên đang dùng.
     */
    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.user.id = :userId AND r.revoked = false AND r.tokenHash != :currentTokenHash")
    int revokeOtherSessionsByUserId(@Param("userId") Long userId, @Param("currentTokenHash") String currentTokenHash);
}
