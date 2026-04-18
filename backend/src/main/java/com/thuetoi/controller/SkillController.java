package com.thuetoi.controller;

import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.marketplace.SkillResponse;
import com.thuetoi.mapper.MarketplaceResponseMapper;
import com.thuetoi.service.SkillService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/skills")
public class SkillController {

    private final SkillService skillService;
    private final MarketplaceResponseMapper marketplaceResponseMapper;

    public SkillController(SkillService skillService, MarketplaceResponseMapper marketplaceResponseMapper) {
        this.skillService = skillService;
        this.marketplaceResponseMapper = marketplaceResponseMapper;
    }

    @GetMapping
    public ApiResponse<List<SkillResponse>> getAllSkills() {
        return ApiResponse.success(
            "Lấy danh mục kỹ năng thành công",
            marketplaceResponseMapper.toSkillResponses(skillService.getAllSkills())
        );
    }
}
