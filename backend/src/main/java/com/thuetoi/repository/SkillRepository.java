package com.thuetoi.repository;

import com.thuetoi.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository Skill: Quản lý truy vấn dữ liệu kỹ năng
 */
@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    Skill findByName(String name);
    boolean existsByName(String name);
    List<Skill> findAllByOrderByNameAsc();
}
