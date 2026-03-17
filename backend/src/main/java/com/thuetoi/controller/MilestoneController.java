package com.thuetoi.controller;

import com.thuetoi.entity.Milestone;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.repository.MilestoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/milestones")
public class MilestoneController {
    @Autowired
    private MilestoneRepository milestoneRepository;

    /**
     * Lấy tất cả milestone
     */
    @GetMapping
    public ApiResponse<List<Milestone>> getAllMilestones() {
        List<Milestone> milestones = milestoneRepository.findAll();
        return ApiResponse.success("Lấy tất cả milestone", milestones);
    }
}
