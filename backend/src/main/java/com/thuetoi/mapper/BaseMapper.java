package com.thuetoi.mapper;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Lớp Mapper cơ sở cung cấp các phương thức tiện ích để map dữ liệu giữa các Object.
 * Các Mapper cụ thể (như UserMapper, ServiceMapper) nên kế thừa lớp này để tái sử dụng mã nguồn.
 * 
 * @param <E> Loại Entity
 * @param <D> Loại DTO
 */
public abstract class BaseMapper<E, D> {

    @Autowired
    protected ModelMapper modelMapper;

    /**
     * Chuyển đổi từ Entity sang DTO.
     * Cần được Override bởi các lớp con để chỉ định rõ Class DTO mục tiêu.
     */
    public abstract D toDto(E entity);

    /**
     * Chuyển đổi từ DTO sang Entity.
     * Cần được Override bởi các lớp con để chỉ định rõ Class Entity mục tiêu.
     */
    public abstract E toEntity(D dto);

    /**
     * Tiện ích map một danh sách (List) các Entity sang danh sách DTO.
     */
    public List<D> toDtoList(List<E> entities) {
        if (entities == null) return null;
        return entities.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Tiện ích map một danh sách (List) các DTO sang danh sách Entity.
     */
    public List<E> toEntityList(List<D> dtos) {
        if (dtos == null) return null;
        return dtos.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
    }

    /**
     * Tiện ích map đối tượng Phân trang (Page) từ Entity sang Phân trang DTO.
     */
    public Page<D> toDtoPage(Page<E> entityPage) {
        if (entityPage == null) return null;
        List<D> dtoList = toDtoList(entityPage.getContent());
        return new PageImpl<>(dtoList, entityPage.getPageable(), entityPage.getTotalElements());
    }
}
