package com.thuetoi.service;

import com.thuetoi.entity.Skill;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.SkillRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class SkillService {

    private final SkillRepository skillRepository;

    public SkillService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    public List<Skill> getAllSkills() {
        return skillRepository.findAllByOrderByNameAsc();
    }

    public Set<Skill> resolveSkills(List<String> requestedSkillNames) {
        if (requestedSkillNames == null || requestedSkillNames.isEmpty()) {
            return new LinkedHashSet<>();
        }

        List<String> normalizedSkillNames = requestedSkillNames.stream()
            .map(this::normalizeSkillName)
            .filter(skillName -> !skillName.isBlank())
            .distinct()
            .toList();

        if (normalizedSkillNames.isEmpty()) {
            return new LinkedHashSet<>();
        }

        Map<String, Skill> availableSkills = new LinkedHashMap<>();
        skillRepository.findAllByOrderByNameAsc().forEach(skill ->
            availableSkills.put(normalizeSkillName(skill.getName()), skill)
        );

        LinkedHashSet<Skill> resolvedSkills = new LinkedHashSet<>();
        List<String> unknownSkills = normalizedSkillNames.stream()
            .filter(skillName -> {
                Skill skill = availableSkills.get(skillName);
                if (skill != null) {
                    resolvedSkills.add(skill);
                    return false;
                }
                return true;
            })
            .toList();

        if (!unknownSkills.isEmpty()) {
            throw new BusinessException(
                "ERR_SYS_02",
                "Một hoặc nhiều kỹ năng không tồn tại trong danh mục chuẩn: " + String.join(", ", unknownSkills),
                HttpStatus.BAD_REQUEST
            );
        }

        return resolvedSkills;
    }

    private String normalizeSkillName(String skillName) {
        return skillName == null ? "" : skillName.trim().toLowerCase(Locale.ROOT);
    }
}
