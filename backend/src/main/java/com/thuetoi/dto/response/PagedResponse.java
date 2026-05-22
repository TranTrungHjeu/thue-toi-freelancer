package com.thuetoi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Khung trả về cho các endpoint phân trang offset (page/limit) — xem
 * skill {@code api-pagination} để biết quy ước.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedResponse<T> {
    private List<T> data;
    private PageMeta pagination;

    public static <T> PagedResponse<T> from(List<T> items, int page, int limit, long total) {
        int safeLimit = Math.max(1, limit);
        int totalPages = (int) Math.max(1, Math.ceil((double) total / safeLimit));
        return PagedResponse.<T>builder()
            .data(items)
            .pagination(PageMeta.builder()
                .page(page)
                .limit(safeLimit)
                .total(total)
                .totalPages(totalPages)
                .build())
            .build();
    }

    public static <S, T> PagedResponse<T> from(Page<S> page, List<T> mapped) {
        return PagedResponse.<T>builder()
            .data(mapped)
            .pagination(PageMeta.builder()
                .page(page.getNumber() + 1)
                .limit(page.getSize())
                .total(page.getTotalElements())
                .totalPages(Math.max(1, page.getTotalPages()))
                .build())
            .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PageMeta {
        private int page;
        private int limit;
        private long total;
        private int totalPages;
    }
}
