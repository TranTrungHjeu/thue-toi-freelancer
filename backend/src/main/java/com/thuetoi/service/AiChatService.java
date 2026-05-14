package com.thuetoi.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.thuetoi.dto.ai.AiChatMessageDto;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.Skill;
import com.thuetoi.enums.ProjectStatus;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.ProjectRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AiChatService {

    private static final int MAX_MESSAGES = 40;
    private static final int MAX_OUTPUT_TOKENS = 2048;

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(20))
        .build();

    private final ObjectMapper objectMapper;

    private final ProjectRepository projectRepository;

    @Value("${app.ai.chat.project-context-max:40}")
    private int projectContextMax;

    @Value("${app.ai.chat.project-description-max:200}")
    private int projectDescriptionMax;

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    @Value("${gemini.model:}")
    private String geminiModel;

    @Value("${gemini.base-url:https://generativelanguage.googleapis.com}")
    private String geminiBaseUrl;

    @Value("${app.ai.chat.system-prompt:Bạn là trợ lý AI của nền tảng Thuê Tôi (freelancer marketplace). Trả lời ngắn gọn, thân thiện, tiếng Việt nếu người dùng dùng tiếng Việt; không bịa đặt tính năng không có; không yêu cầu mật khẩu hay OTP. Khi nói về dự án, chỉ dựa vào danh sách dự án được cung cấp trong system instruction (ID, tiêu đề, trạng thái, ngân sách, kỹ năng, mô tả rút gọn).}")
    private String systemPrompt;

    public AiChatService(ObjectMapper objectMapper, ProjectRepository projectRepository) {
        this.objectMapper = objectMapper;
        this.projectRepository = projectRepository;
    }

    public String reply(List<AiChatMessageDto> messages) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new BusinessException(
                "ERR_AI_01",
                "Chatbot chưa được cấu hình (thiếu GEMINI_API_KEY / gemini.api-key).",
                HttpStatus.SERVICE_UNAVAILABLE
            );
        }
        List<AiChatMessageDto> sanitized = sanitizeMessages(messages);
        if (sanitized.isEmpty()) {
            throw new BusinessException("ERR_AI_02", "Nội dung hội thoại không hợp lệ", HttpStatus.BAD_REQUEST);
        }

        String requestBody = buildGeminiChatBody(sanitized);
        return executeGeminiGenerate(requestBody);
    }

    private List<AiChatMessageDto> sanitizeMessages(List<AiChatMessageDto> messages) {
        if (messages == null || messages.isEmpty()) {
            return List.of();
        }
        List<AiChatMessageDto> out = new ArrayList<>();
        for (AiChatMessageDto m : messages) {
            if (m == null || m.getRole() == null || m.getContent() == null) {
                continue;
            }
            String role = m.getRole().trim().toLowerCase(Locale.ROOT);
            if (!"user".equals(role) && !"assistant".equals(role)) {
                continue;
            }
            String text = m.getContent().trim();
            if (text.isEmpty()) {
                continue;
            }
            if (text.length() > 8000) {
                text = text.substring(0, 8000);
            }
            AiChatMessageDto copy = new AiChatMessageDto();
            copy.setRole(role);
            copy.setContent(text);
            out.add(copy);
        }
        while (!out.isEmpty() && "assistant".equals(out.get(0).getRole())) {
            out.remove(0);
        }
        if (out.isEmpty()) {
            return List.of();
        }
        // Gemini generateContent yêu cầu vai trò user/model xen kẽ; gộp tin liền nhau cùng role
        // (ví dụ: gửi lại sau lỗi, hoặc bỏ qua assistant rỗng) để tránh 400 từ upstream.
        out = mergeConsecutiveSameRole(out);
        if (out.isEmpty()) {
            return List.of();
        }
        int from = Math.max(0, out.size() - MAX_MESSAGES);
        return out.subList(from, out.size());
    }

    /**
     * Gộp các tin nhắn liên tiếp cùng role thành một (nối bằng xuống dòng kép), giới hạn độ dài gộp.
     */
    private static List<AiChatMessageDto> mergeConsecutiveSameRole(List<AiChatMessageDto> messages) {
        List<AiChatMessageDto> merged = new ArrayList<>();
        for (AiChatMessageDto m : messages) {
            if (m == null || m.getRole() == null || m.getContent() == null) {
                continue;
            }
            if (merged.isEmpty()) {
                merged.add(cloneMessage(m));
                continue;
            }
            AiChatMessageDto last = merged.get(merged.size() - 1);
            if (last.getRole().equals(m.getRole())) {
                String combined = last.getContent() + "\n\n" + m.getContent().trim();
                if (combined.length() > 8000) {
                    combined = combined.substring(combined.length() - 8000);
                }
                last.setContent(combined);
            } else {
                merged.add(cloneMessage(m));
            }
        }
        return merged;
    }

    private static AiChatMessageDto cloneMessage(AiChatMessageDto m) {
        AiChatMessageDto c = new AiChatMessageDto();
        c.setRole(m.getRole());
        c.setContent(m.getContent());
        return c;
    }

    private String buildFullSystemInstructionText() {
        String base = systemPrompt == null ? "" : systemPrompt;
        return base + "\n\n---\nDữ liệu dự án đang có trên nền tảng (trạng thái open hoặc in_progress). "
            + "Chỉ được mô tả hoặc so sánh các dự án có trong danh sách sau; không bịa thêm ID hoặc tiêu đề.\n\n"
            + buildProjectsSnapshot();
    }

    private String buildProjectsSnapshot() {
        int cap = Math.min(80, Math.max(5, projectContextMax));
        int descMax = Math.min(500, Math.max(80, projectDescriptionMax));

        List<Project> open = projectRepository.findByStatusOrderByCreatedAtDesc(ProjectStatus.OPEN.getValue());
        List<Project> inProgress = projectRepository.findByStatusOrderByCreatedAtDesc(ProjectStatus.IN_PROGRESS.getValue());

        List<Project> merged = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        for (Project p : open) {
            if (p.getId() != null && seen.add(p.getId())) {
                merged.add(p);
            }
        }
        for (Project p : inProgress) {
            if (p.getId() != null && seen.add(p.getId())) {
                merged.add(p);
            }
        }

        merged.sort(Comparator.comparing(Project::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        List<Project> top = merged.stream().limit(cap).toList();

        if (top.isEmpty()) {
            return "(Hiện không có dự án open hoặc in_progress trong cơ sở dữ liệu.)";
        }

        StringBuilder sb = new StringBuilder();
        for (Project p : top) {
            sb.append("- [id=").append(p.getId()).append("] ");
            sb.append(safeTitle(p.getTitle()));
            sb.append(" | trạng_thái=").append(p.getStatus() == null ? "?" : p.getStatus().trim());
            sb.append(" | ngân_sách=").append(formatBudgetRange(p.getBudgetMin(), p.getBudgetMax()));
            if (p.getDeadline() != null) {
                sb.append(" | hạn=").append(p.getDeadline());
            }
            String skills = formatSkillNames(p);
            if (!skills.isEmpty()) {
                sb.append(" | kỹ_năng=").append(skills);
            }
            String desc = ellipsis(p.getDescription(), descMax);
            if (!desc.isEmpty()) {
                sb.append(" | mô_tả=").append(desc);
            }
            sb.append('\n');
        }
        return sb.toString().trim();
    }

    private static String safeTitle(String title) {
        if (title == null) {
            return "(Không tiêu đề)";
        }
        String t = title.replace('\n', ' ').trim();
        return t.isEmpty() ? "(Không tiêu đề)" : t;
    }

    private static String formatBudgetRange(BigDecimal min, BigDecimal max) {
        if (min == null && max == null) {
            return "không ghi";
        }
        if (min != null && max != null) {
            return min.stripTrailingZeros().toPlainString() + "–" + max.stripTrailingZeros().toPlainString();
        }
        if (min != null) {
            return "từ " + min.stripTrailingZeros().toPlainString();
        }
        return "đến " + max.stripTrailingZeros().toPlainString();
    }

    private static String formatSkillNames(Project p) {
        if (p.getSkills() == null || p.getSkills().isEmpty()) {
            return "";
        }
        return p.getSkills().stream()
            .map(Skill::getName)
            .filter(n -> n != null && !n.isBlank())
            .map(String::trim)
            .distinct()
            .collect(Collectors.joining(", "));
    }

    private static String ellipsis(String text, int maxLen) {
        if (text == null) {
            return "";
        }
        String t = text.replace('\r', ' ').replace('\n', ' ').trim();
        if (t.isEmpty()) {
            return "";
        }
        if (t.length() <= maxLen) {
            return t;
        }
        return t.substring(0, Math.max(0, maxLen - 1)) + "…";
    }

    private String buildGeminiChatBody(List<AiChatMessageDto> messages) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            ObjectNode systemInstruction = root.putObject("systemInstruction");
            ArrayNode sysParts = systemInstruction.putArray("parts");
            sysParts.addObject().put("text", buildFullSystemInstructionText());

            ObjectNode generationConfig = root.putObject("generationConfig");
            generationConfig.put("temperature", 0.65);
            generationConfig.put("maxOutputTokens", MAX_OUTPUT_TOKENS);

            ArrayNode contents = root.putArray("contents");
            for (AiChatMessageDto m : messages) {
                ObjectNode content = contents.addObject();
                content.put("role", "user".equals(m.getRole()) ? "user" : "model");
                ArrayNode parts = content.putArray("parts");
                parts.addObject().put("text", m.getContent());
            }
            return objectMapper.writeValueAsString(root);
        } catch (Exception ex) {
            throw new BusinessException("ERR_AI_02", "Không thể tạo yêu cầu chat", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String executeGeminiGenerate(String requestBody) {
        try {
            String modelToUse = normalizeGeminiModel(geminiModel);
            if (modelToUse.isBlank()) {
                modelToUse = resolveGeminiModelForGenerateContent();
            }
            if (modelToUse.isBlank()) {
                throw new BusinessException(
                    "ERR_AI_02",
                    "Không tìm thấy model Gemini. Đặt GEMINI_MODEL hoặc để trống để backend tự chọn.",
                    HttpStatus.BAD_GATEWAY
                );
            }

            HttpResponse<String> response = sendGeminiGenerateContent(modelToUse, requestBody);
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String upstream = extractGeminiErrorMessage(response.body());
                if (response.statusCode() == 404) {
                    String resolved = resolveGeminiModelForGenerateContent();
                    if (!resolved.isBlank() && !resolved.equals(modelToUse)) {
                        HttpResponse<String> retry = sendGeminiGenerateContent(resolved, requestBody);
                        if (retry.statusCode() >= 200 && retry.statusCode() < 300) {
                            return extractGeminiText(retry.body());
                        }
                        response = retry;
                        upstream = extractGeminiErrorMessage(response.body());
                    }
                }
                log.warn("Gemini chat status {} body {}", response.statusCode(), response.body());
                throw new BusinessException(
                    "ERR_AI_02",
                    buildGeminiUserMessage(response.statusCode(), upstream),
                    HttpStatus.BAD_GATEWAY
                );
            }
            return extractGeminiText(response.body());
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Gemini chat failed", ex);
            throw new BusinessException("ERR_AI_02", "Không thể gọi Gemini", HttpStatus.BAD_GATEWAY);
        }
    }

    private HttpResponse<String> sendGeminiGenerateContent(String model, String requestBody) throws IOException, InterruptedException {
        String sanitizedModel = normalizeGeminiModel(model);
        String base = geminiBaseUrl == null ? "" : geminiBaseUrl.replaceAll("/+$", "");
        String apiKey = geminiApiKey == null ? "" : geminiApiKey.trim();
        String url = base + "/v1beta/models/" + sanitizedModel + ":generateContent?key=" + apiKey;
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .timeout(Duration.ofSeconds(60))
            .header("content-type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
            .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    }

    private String normalizeGeminiModel(String model) {
        if (model == null) {
            return "";
        }
        String trimmed = model.trim();
        if (trimmed.startsWith("models/")) {
            return trimmed.substring("models/".length());
        }
        return trimmed;
    }

    private String resolveGeminiModelForGenerateContent() {
        try {
            String base = geminiBaseUrl == null ? "" : geminiBaseUrl.replaceAll("/+$", "");
            String apiKey = geminiApiKey == null ? "" : geminiApiKey.trim();
            if (base.isBlank() || apiKey.isBlank()) {
                return "";
            }
            String url = base + "/v1beta/models?key=" + apiKey;
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return "";
            }
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode models = root.path("models");
            if (!models.isArray() || models.isEmpty()) {
                return "";
            }
            for (JsonNode model : models) {
                JsonNode supported = model.path("supportedGenerationMethods");
                if (!supported.isArray()) {
                    continue;
                }
                boolean ok = false;
                for (JsonNode method : supported) {
                    if (method != null && method.isTextual() && "generateContent".equals(method.asText())) {
                        ok = true;
                        break;
                    }
                }
                if (!ok) {
                    continue;
                }
                JsonNode nameNode = model.path("name");
                if (nameNode != null && nameNode.isTextual()) {
                    String normalized = normalizeGeminiModel(nameNode.asText(""));
                    if (!normalized.isBlank()) {
                        return normalized;
                    }
                }
            }
            return "";
        } catch (Exception ex) {
            return "";
        }
    }

    private String extractGeminiText(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode promptFeedback = root.path("promptFeedback");
            if (promptFeedback.hasNonNull("blockReason")) {
                String br = promptFeedback.get("blockReason").asText("").trim();
                throw new BusinessException(
                    "ERR_AI_02",
                    "Gemini chặn prompt (blockReason: " + (br.isEmpty() ? "unknown" : br) + ").",
                    HttpStatus.BAD_GATEWAY
                );
            }
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                log.warn("Gemini chat: no candidates, body snippet={}", abbreviateForLog(responseBody, 800));
                throw new BusinessException("ERR_AI_02", "Gemini không trả về nội dung (không có candidate).", HttpStatus.BAD_GATEWAY);
            }
            JsonNode first = candidates.get(0);
            String finishReason = first.path("finishReason").asText("").trim();
            JsonNode parts = first.path("content").path("parts");
            if (!parts.isArray() || parts.isEmpty()) {
                String hint = finishReason.isEmpty() ? "" : " (finishReason=" + finishReason + ")";
                log.warn("Gemini chat: empty parts{}, body snippet={}", hint, abbreviateForLog(responseBody, 800));
                throw new BusinessException(
                    "ERR_AI_02",
                    "Gemini không trả về đoạn text" + (finishReason.isEmpty() ? "" : " (" + finishReason + ")") + ".",
                    HttpStatus.BAD_GATEWAY
                );
            }
            StringBuilder builder = new StringBuilder();
            for (JsonNode part : parts) {
                if (part.hasNonNull("text")) {
                    builder.append(part.get("text").asText());
                }
            }
            String text = builder.toString().trim();
            if (text.isEmpty()) {
                String hint = finishReason.isEmpty() ? "" : " finishReason=" + finishReason;
                throw new BusinessException(
                    "ERR_AI_02",
                    "Phản hồi trống từ Gemini." + (hint.isEmpty() ? "" : " " + hint),
                    HttpStatus.BAD_GATEWAY
                );
            }
            return text;
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException("ERR_AI_02", "Phản hồi Gemini không hợp lệ", HttpStatus.BAD_GATEWAY);
        }
    }

    private static String abbreviateForLog(String s, int max) {
        if (s == null) {
            return "";
        }
        String t = s.replace('\n', ' ');
        return t.length() <= max ? t : t.substring(0, max) + "…";
    }

    private String extractGeminiErrorMessage(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "";
        }
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode messageNode = root.path("error").path("message");
            if (messageNode != null && messageNode.isTextual()) {
                return messageNode.asText("").trim();
            }
            return "";
        } catch (Exception ignored) {
            return "";
        }
    }

    private String buildGeminiUserMessage(int statusCode, String upstreamMessage) {
        if (statusCode == 401) {
            return "Gemini từ chối (401): kiểm tra GEMINI_API_KEY.";
        }
        if (statusCode == 403) {
            return "Gemini từ chối (403): kiểm tra quyền API / bật Generative Language API.";
        }
        if (statusCode == 429) {
            return "Gemini giới hạn tần suất (429). Thử lại sau.";
        }
        if (statusCode == 400) {
            if (upstreamMessage != null && !upstreamMessage.isBlank()) {
                return "Gemini từ chối yêu cầu (400): " + upstreamMessage;
            }
            return "Gemini từ chối yêu cầu (400): kiểm tra nội dung hội thoại hoặc model.";
        }
        if (statusCode >= 500 && statusCode <= 599) {
            return "Gemini lỗi máy chủ (" + statusCode + ").";
        }
        if (upstreamMessage != null && !upstreamMessage.isBlank()) {
            return "Gemini: " + upstreamMessage;
        }
        return "Gemini trả về lỗi (" + statusCode + ").";
    }
}
