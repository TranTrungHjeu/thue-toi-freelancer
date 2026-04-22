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

    public Skill createSkill(String name, String description) {
        String normalized = normalizeSkillName(name);
        if (normalized.isEmpty()) {
            throw new BusinessException("ERR_SYS_02", "Tên kỹ năng không được để trống", HttpStatus.BAD_REQUEST);
        }
        if (skillRepository.findByNameIgnoreCase(normalized).isPresent()) {
            throw new BusinessException("ERR_SYS_02", "Kỹ năng này đã tồn tại", HttpStatus.CONFLICT);
        }

        Skill skill = new Skill();
        skill.setName(name.trim());
        skill.setDescription(description);
        return skillRepository.save(skill);
    }

    public Skill updateSkill(Long id, String name, String description) {
        Skill skill = skillRepository.findById(id)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Không tìm thấy kỹ năng", HttpStatus.NOT_FOUND));

        String normalized = normalizeSkillName(name);
        if (!normalized.isEmpty() && !normalized.equals(normalizeSkillName(skill.getName()))) {
            if (skillRepository.findByNameIgnoreCase(normalized).isPresent()) {
                throw new BusinessException("ERR_SYS_02", "Tên kỹ năng mới đã tồn tại", HttpStatus.CONFLICT);
            }
            skill.setName(name.trim());
        }
        skill.setDescription(description);
        return skillRepository.save(skill);
    }

    public void deleteSkill(Long id) {
        Skill skill = skillRepository.findById(id)
            .orElseThrow(() -> new BusinessException("ERR_SYS_02", "Không tìm thấy kỹ năng", HttpStatus.NOT_FOUND));
        
        // Cần lưu ý: Nếu xóa skill, các bảng junction (projects_skills, users_skills) sẽ tự động bị ảnh hưởng tùy vào config JPA (thường là xóa các liên kết).
        skillRepository.delete(skill);
    }

    private String normalizeSkillName(String skillName) {
        return skillName == null ? "" : skillName.trim().toLowerCase(Locale.ROOT);
    }
}
