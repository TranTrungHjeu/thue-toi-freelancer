package com.thuetoi.service.cv;

import java.util.ArrayList;
import java.util.List;

public final class CvExtractionPrompt {

    private static final String ROLE_AND_OUTPUT = """
        Bạn là hệ thống trích xuất dữ liệu từ CV của freelancer.
        Trả về đúng 1 JSON object thuần túy, không markdown, không giải thích, không code block.

        Quy tắc:
        - Chỉ trả về JSON.
        - Nếu không tìm thấy dữ liệu của field nào thì để null.
        - experienceYears là số nguyên ước lượng từ mục kinh nghiệm (nếu không suy ra được thì null).
        - bio: tóm tắt 2-3 câu ngắn gọn từ phần giới thiệu / tóm tắt nghề nghiệp trong CV.
        - fullName: ưu tiên tên đầy đủ của người sở hữu CV (header, phần thông tin liên hệ).
        - Với CV scan, ảnh chụp, hoặc PDF chủ yếu là hình: đọc chữ hiển thị trên từng trang như khi OCR; nếu mờ hoặc không đọc được thì để null thay vì bịa.

        Các field cần trả về:
        {
          "fullName": "string | null",
          "email": "string | null",
          "phone": "string | null",
          "location": "string | null",
          "bio": "string | null",
          "skills": ["string"] | null,
          "experienceYears": 3,
          "education": "string | null"
        }
        """;

    private CvExtractionPrompt() {
    }

    private static String formatCanonicalSkillCatalog(List<String> canonicalSkillNames) {
        if (canonicalSkillNames == null || canonicalSkillNames.isEmpty()) {
            return """
                (Hệ thống chưa có danh mục kỹ năng — trường skills hãy để null hoặc mảng rỗng [].)
                """;
        }
        List<String> lines = new ArrayList<>(canonicalSkillNames.size());
        for (String name : canonicalSkillNames) {
            if (name == null) {
                continue;
            }
            String trimmed = name.trim();
            if (!trimmed.isEmpty()) {
                lines.add("- " + trimmed);
            }
        }
        return String.join("\n", lines);
    }

    private static String skillCatalogConstraints(List<String> canonicalSkillNames) {
        String catalogBlock = formatCanonicalSkillCatalog(canonicalSkillNames);
        return """

            --- DANH MỤC KỸ NĂNG CHUẨN (bắt buộc tuân thủ) ---
            Trường "skills" CHỈ được là mảng các chuỗi, mỗi phần tử phải là một dòng trong danh sách dưới đây (copy đúng từng ký tự, kể cả hoa/thường và khoảng trắng như đã ghi).
            Không trùng lặp trong mảng. Không thêm kỹ năng không có trong danh sách; không tự đặt tên mới; không gộp nhiều kỹ năng thành một chuỗi dài kiểu "a, b, c".
            Nếu CV nêu công cụ hoặc kỹ năng không có trong danh mục, hãy chọn đúng một mục tương đương nhất trong danh sách hoặc bỏ qua (không đoán tên ngoài danh sách).

            """
            + catalogBlock
            + "\n";
    }

    /**
     * Prompt khi đã có văn bản trích từ PDF (PDF có lớp chữ).
     *
     * @param cvText                 nội dung text từ PDF
     * @param canonicalSkillNames    tên kỹ năng chuẩn từ DB (thứ tự đã sắp), dùng để model chỉ trả về skills hợp lệ
     */
    public static String buildForPlainText(String cvText, List<String> canonicalSkillNames) {
        String safeText = cvText == null ? "" : cvText.trim();
        return ROLE_AND_OUTPUT
            + skillCatalogConstraints(canonicalSkillNames)
            + """

            Dưới đây là nội dung văn bản đã trích xuất từ file PDF (có thể thiếu định dạng). Hãy trích xuất JSON theo quy tắc trên.

            CV Content:
            """
            + safeText;
    }

    /**
     * Prompt khi gửi kèm file PDF cho mô hình đọc trực tiếp (scan / chỉ hình / PDF không có lớp text).
     *
     * @param canonicalSkillNames tên kỹ năng chuẩn từ DB
     */
    public static String buildForPdfAttachment(List<String> canonicalSkillNames) {
        return ROLE_AND_OUTPUT
            + skillCatalogConstraints(canonicalSkillNames)
            + """

            File PDF CV được đính kèm trong tin nhắn này (inline). Hãy mở và đọc toàn bộ các trang PDF, kể cả trang chỉ có ảnh hoặc scan, rồi trích xuất JSON theo quy tắc trên.
            """;
    }
}
