package com.thuetoi.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.HashSet;
import java.util.Set;

/**
 * Entity Skill: Danh sách kỹ năng chuẩn hóa theo schema.sql
 */
@Entity
@Table(name = "skills")
@Data
@EqualsAndHashCode(callSuper = false)
public class Skill extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToMany(mappedBy = "skills")
    private Set<User> users = new HashSet<>();

    @ManyToMany(mappedBy = "skills")
    private Set<Project> projects = new HashSet<>();
}
