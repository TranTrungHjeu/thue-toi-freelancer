package com.thuetoi.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@EqualsAndHashCode(callSuper = false, exclude = {"users", "projects"})
public class Skill extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @JsonIgnore
    @ManyToMany(mappedBy = "skills")
    private Set<User> users = new HashSet<>();

    @JsonIgnore
    @ManyToMany(mappedBy = "skills")
    private Set<Project> projects = new HashSet<>();

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Set<User> getUsers() { return users; }
    public void setUsers(Set<User> users) { this.users = users; }
    public Set<Project> getProjects() { return projects; }
    public void setProjects(Set<Project> projects) { this.projects = projects; }
}
