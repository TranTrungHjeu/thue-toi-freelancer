package com.thuetoi.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Lớp tiện ích hỗ trợ định dạng Ngày và Giờ đồng nhất cho toàn dự án.
 */
public class DateUtil {

    private static final String DEFAULT_PATTERN = "dd/MM/yyyy HH:mm:ss";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern(DEFAULT_PATTERN);

    /**
     * Định dạng đối tượng LocalDateTime thành chuỗi văn bản theo chuẩn.
     * @param dateTime Đối tượng LocalDateTime cần định dạng
     * @return Chuỗi văn bản đã được định dạng (VD: 25/12/2026 14:30:00)
     */
    public static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(FORMATTER);
    }
    
    /**
     * Chuyển đổi một chuỗi văn bản định dạng chuẩn trở lại thành đối tượng LocalDateTime.
     * @param dateTimeStr Chuỗi văn bản chứa thông tin ngày giờ
     * @return Đối tượng LocalDateTime
     */
    public static LocalDateTime parseDateTime(String dateTimeStr) {
        if (StringUtil.isBlank(dateTimeStr)) {
            return null;
        }
        return LocalDateTime.parse(dateTimeStr, FORMATTER);
    }
}
