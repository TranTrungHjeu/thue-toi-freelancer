package com.thuetoi.util;

import java.text.Normalizer;
import java.util.regex.Pattern;

/**
 * Lớp tiện ích phục vụ các thao tác xử lý chuỗi phổ biến.
 * Được sử dụng xuyên suốt ứng dụng để chuẩn hoá văn bản, tạo đường dẫn (slug), v.v.
 */
public class StringUtil {

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    /**
     * Chuyển đổi một chuỗi văn bản thành định dạng đường dẫn URL (slug).
     * Ví dụ: "Thuê Web Design Giá Rẻ" -> "thue-web-design-gia-re"
     *
     * @param input Chuỗi tiêu đề gốc
     * @return Đường dẫn thân thiện với URL (slug)
     */
    public static String toSlug(String input) {
        if (input == null || input.trim().isEmpty()) {
            return "";
        }
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase().replaceAll("-{2,}", "-").replaceAll("^-|-$", "");
    }
    
    /**
     * Kiểm tra xem chuỗi có bị null, rỗng hoặc chỉ chứa khoảng trắng hay không.
     */
    public static boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }
}
