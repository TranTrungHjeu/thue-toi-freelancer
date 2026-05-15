package com.thuetoi.dto.profile;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CvExtractedData {
    private String fullName;
    private String email;
    private String phone;
    private String location;
    private String bio;
    private List<String> skills;
    private Integer experienceYears;
    private String education;
}