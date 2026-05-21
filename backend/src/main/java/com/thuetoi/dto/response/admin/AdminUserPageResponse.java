package com.thuetoi.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserPageResponse {
    public List<UserAdminResponse> getContent() { return content; }
    public void setContent(List<UserAdminResponse> content) { this.content = content; }
    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }
    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
    public AdminUserSummaryStatsResponse getSummary() { return summary; }
    public void setSummary(AdminUserSummaryStatsResponse summary) { this.summary = summary; }

    private List<UserAdminResponse> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private AdminUserSummaryStatsResponse summary;
}
