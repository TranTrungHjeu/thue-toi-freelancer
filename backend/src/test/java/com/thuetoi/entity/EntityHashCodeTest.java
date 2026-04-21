package com.thuetoi.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;

class EntityHashCodeTest {

    @Test
    void hashCodeDoesNotRecurseAcrossProjectSkillAndUserRelationships() {
        User user = new User();
        user.setId(1L);
        user.setEmail("user@thuetoi.test");
        user.setFullName("Test User");
        user.setPasswordHash("hashed");
        user.setRole("customer");

        Skill skill = new Skill();
        skill.setId(2L);
        skill.setName("Java");

        Project project = new Project();
        project.setId(3L);
        project.setTitle("Marketplace API");
        project.setStatus("open");
        project.setUser(user);

        user.getSkills().add(skill);
        skill.getUsers().add(user);
        skill.getProjects().add(project);
        project.getSkills().add(skill);

        assertThatCode(project::hashCode).doesNotThrowAnyException();
        assertThatCode(skill::hashCode).doesNotThrowAnyException();
        assertThatCode(user::hashCode).doesNotThrowAnyException();
    }
}
