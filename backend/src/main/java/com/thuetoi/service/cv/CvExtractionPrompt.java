package com.thuetoi.service.cv;

public final class CvExtractionPrompt {

    private static final String ROLE_AND_OUTPUT = """
        Bạn là hệ thống trích xuất dữ liệu từ CV của freelancer.
        Trả về đúng 1 JSON object thuần túy, không markdown, không giải thích, không code block.

        Quy tắc:
        - Chỉ trả về JSON.
        - Nếu không tìm thấy dữ liệu của field nào thì để null.
        - skills là mảng chuỗi, không trùng lặp.
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

    /**
     * Prompt khi đã có văn bản trích từ PDF (PDF có lớp chữ).
     */
    public static String buildForPlainText(String cvText) {
        String safeText = cvText == null ? "" : cvText.trim();
        return ROLE_AND_OUTPUT
            + """

            Dưới đây là nội dung văn bản đã trích xuất từ file PDF (có thể thiếu định dạng). Hãy trích xuất JSON theo quy tắc trên.

            CV Content:
            """
            + safeText;
    }

    /**
     * Prompt khi gửi kèm file PDF cho mô hình đọc trực tiếp (scan / chỉ hình / PDF không có lớp text).
     */
    public static String buildForPdfAttachment() {
        return ROLE_AND_OUTPUT
            + """

            File PDF CV được đính kèm trong tin nhắn này (inline). Hãy mở và đọc toàn bộ các trang PDF, kể cả trang chỉ có ảnh hoặc scan, rồi trích xuất JSON theo quy tắc trên.
            """;
    }
}
