package com.thuetoi.config;

import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình toàn cục cho thư viện ModelMapper.
 * Thư viện này dùng để map dữ liệu tự động giữa Entity và DTO.
 */
@Configuration
public class MapperConfig {

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();
        
        // Cấu hình chiến lược map chặt chẽ (STRICT) để tránh lỗi map nhầm trường
        // khi Entity và DTO có các trường tên na ná nhau.
        modelMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setFieldMatchingEnabled(true)
                .setSkipNullEnabled(true)
                .setFieldAccessLevel(org.modelmapper.config.Configuration.AccessLevel.PRIVATE);
                
        return modelMapper;
    }
}
