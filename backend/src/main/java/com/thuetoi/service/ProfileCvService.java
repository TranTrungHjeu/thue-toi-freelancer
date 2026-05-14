package com.thuetoi.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.List;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.thuetoi.dto.profile.CvExtractedData;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.service.cv.CvExtractionPrompt;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ProfileCvService {

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(20))
        .build();

    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    @Value("${gemini.model:}")
    private String geminiModel;

    @Value("${gemini.base-url:https://generativelanguage.googleapis.com}")
    private String geminiBaseUrl;

    private final DataSize cvMaxFileSize;

    public ProfileCvService(
        ObjectMapper objectMapper,
        @Value("${app.profile.cv.max-file-size:1000KB}") DataSize cvMaxFileSize
    ) {
        this.objectMapper = objectMapper;
        this.cvMaxFileSize = cvMaxFileSize;
    }

    public CvExtractedData extractFromPdf(MultipartFile file) {
        validatePdfFile(file);
        final byte[] pdfBytes;
        try {
            pdfBytes = file.getBytes();
        } catch (IOException ex) {
            throw new BusinessException("ERR_CV_01", "Không thể đọc file PDF", HttpStatus.BAD_REQUEST);
        }

        String pdfText = extractPlainTextIfPossible(pdfBytes);
        String rawJson;
        if (!pdfText.isBlank()) {
            rawJson = callGeminiWithTextPrompt(CvExtractionPrompt.buildForPlainText(pdfText));
        } else {
            log.info("CV PDF has no text layer (scan/image-only); using Gemini with PDF attachment");
            rawJson = callGeminiWithPdfAttachment(
                pdfBytes,
                CvExtractionPrompt.buildForPdfAttachment()
            );
        }
        return parseExtractedData(rawJson);
    }

    private void validatePdfFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("ERR_CV_01", "Vui lòng chọn file PDF CV", HttpStatus.BAD_REQUEST);
        }
        String originalFilename = file.getOriginalFilename();
        String originalContentType = file.getContentType();
        String filename = originalFilename == null ? "" : originalFilename.toLowerCase();
        String contentType = originalContentType == null ? "" : originalContentType.toLowerCase();
        boolean looksLikePdf = filename.endsWith(".pdf") || contentType.contains("pdf");
        if (!looksLikePdf) {
            throw new BusinessException("ERR_CV_01", "File tải lên phải là PDF", HttpStatus.BAD_REQUEST);
        }
        long maxBytes = cvMaxFileSize.toBytes();
        if (file.getSize() > maxBytes) {
            throw new BusinessException(
                "ERR_CV_01",
                "File PDF vượt quá dung lượng cho phép (" + cvMaxFileSize + ")",
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Trích text có chọn được (text layer). PDF scan/ảnh thường trả về rỗng — không ném lỗi để nhánh Gemini đọc PDF.
     */
    private String extractPlainTextIfPossible(byte[] pdfBytes) {
        try (PDDocument document = PDDocument.load(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document).trim();
        } catch (IOException ex) {
            log.debug("PDFBox could not load or read CV PDF bytes: {}", ex.getMessage());
            return "";
        }
    }

    private String buildGeminiRequestBodyWithPdf(byte[] pdfBytes, String promptText, int maxOutputTokens) throws JsonProcessingException {
        ObjectNode root = objectMapper.createObjectNode();
        ObjectNode generationConfig = root.putObject("generationConfig");
        generationConfig.put("temperature", 0.2);
        generationConfig.put("maxOutputTokens", maxOutputTokens);
        ArrayNode contents = root.putArray("contents");
        ObjectNode content = contents.addObject();
        content.put("role", "user");
        ArrayNode parts = content.putArray("parts");
        parts.addObject().put("text", promptText);
        ObjectNode pdfPart = parts.addObject();
        ObjectNode inlineData = pdfPart.putObject("inline_data");
        inlineData.put("mime_type", "application/pdf");
        inlineData.put("data", Base64.getEncoder().encodeToString(pdfBytes));
        return objectMapper.writeValueAsString(root);
    }

    private void requireGeminiApiKey() {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new BusinessException(
                "ERR_CV_02",
                "Chưa cấu hình GEMINI_API_KEY (cần set biến môi trường GEMINI_API_KEY hoặc cấu hình Spring property gemini.api-key)",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private String callGeminiWithTextPrompt(String promptText) {
        requireGeminiApiKey();
        try {
            String requestBody = objectMapper.writeValueAsString(new GeminiRequest(
                List.of(new GeminiContent("user", List.of(new GeminiPart(promptText)))),
                new GeminiGenerationConfig(0.2, 1200)
            ));
            return executeGeminiGenerate(requestBody);
        } catch (JsonProcessingException ex) {
            throw new BusinessException("ERR_CV_02", "Không thể tạo yêu cầu phân tích CV", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String callGeminiWithPdfAttachment(byte[] pdfBytes, String promptText) {
        requireGeminiApiKey();
        try {
            String requestBody = buildGeminiRequestBodyWithPdf(pdfBytes, promptText, 4096);
            return executeGeminiGenerate(requestBody);
        } catch (JsonProcessingException ex) {
            throw new BusinessException("ERR_CV_02", "Không thể tạo yêu cầu phân tích CV", HttpStatus.INTERNAL_SERVER_ERROR);
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
                    "ERR_CV_02",
                    "Không tìm thấy Gemini model hỗ trợ generateContent. Hãy set GEMINI_MODEL theo danh sách từ ListModels.",
                    HttpStatus.BAD_GATEWAY
                );
            }

            HttpResponse<String> response = sendGeminiGenerateContent(modelToUse, requestBody);
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String upstreamMessage = extractGeminiErrorMessage(response.body());

                if (response.statusCode() == 404) {
                    String resolvedModel = resolveGeminiModelForGenerateContent();
                    if (!resolvedModel.isBlank() && !resolvedModel.equals(modelToUse)) {
                        log.warn("Gemini model '{}' not found; retrying with resolved model '{}'", modelToUse, resolvedModel);
                        HttpResponse<String> retryResponse = sendGeminiGenerateContent(resolvedModel, requestBody);
                        if (retryResponse.statusCode() >= 200 && retryResponse.statusCode() < 300) {
                            return extractGeminiText(retryResponse.body());
                        }
                        response = retryResponse;
                        upstreamMessage = extractGeminiErrorMessage(response.body());
                    }
                }

                log.warn("Gemini API returned status {} and body {}", response.statusCode(), response.body());
                String userMessage = buildGeminiUserMessage(response.statusCode(), upstreamMessage);
                throw new BusinessException("ERR_CV_02", userMessage, HttpStatus.BAD_GATEWAY);
            }

            return extractGeminiText(response.body());
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Gemini generateContent failed", ex);
            throw new BusinessException("ERR_CV_02", "Không thể gọi Gemini API để phân tích CV", HttpStatus.BAD_GATEWAY);
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
                boolean supportsGenerateContent = false;
                for (JsonNode method : supported) {
                    if (method != null && method.isTextual() && "generateContent".equals(method.asText())) {
                        supportsGenerateContent = true;
                        break;
                    }
                }
                if (!supportsGenerateContent) {
                    continue;
                }

                JsonNode nameNode = model.path("name");
                if (nameNode != null && nameNode.isTextual()) {
                    String name = nameNode.asText("");
                    String normalized = normalizeGeminiModel(name);
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
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new BusinessException("ERR_CV_02", "Gemini không trả về nội dung hợp lệ", HttpStatus.BAD_GATEWAY);
            }

            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (!parts.isArray() || parts.isEmpty()) {
                throw new BusinessException("ERR_CV_02", "Gemini không trả về nội dung hợp lệ", HttpStatus.BAD_GATEWAY);
            }

            StringBuilder builder = new StringBuilder();
            for (JsonNode part : parts) {
                if (part.hasNonNull("text")) {
                    builder.append(part.get("text").asText());
                }
            }
            return builder.toString().trim();
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException("ERR_CV_02", "Gemini trả về dữ liệu không hợp lệ", HttpStatus.BAD_GATEWAY);
        }
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
        if (statusCode == 404) {
            return "Gemini model không tồn tại hoặc không hỗ trợ generateContent (404). Hãy đổi GEMINI_MODEL theo ListModels, hoặc để trống GEMINI_MODEL để backend tự chọn model hợp lệ.";
        }
        if (statusCode == 401) {
            return "Gemini API từ chối do API key không hợp lệ (401). Kiểm tra lại GEMINI_API_KEY.";
        }
        if (statusCode == 403) {
            return "Gemini API từ chối truy cập (403). API key có thể thiếu quyền hoặc project chưa bật Generative Language API.";
        }
        if (statusCode == 429) {
            return "Gemini API đang bị giới hạn tần suất (429). Vui lòng thử lại sau.";
        }
        if (statusCode >= 500 && statusCode <= 599) {
            return "Gemini API đang gặp sự cố (" + statusCode + "). Vui lòng thử lại sau.";
        }

        if (upstreamMessage != null && !upstreamMessage.isBlank()) {
            return "Gemini API trả về lỗi khi phân tích CV (" + statusCode + "): " + upstreamMessage;
        }
        return "Gemini API trả về lỗi khi phân tích CV (" + statusCode + ").";
    }

    private CvExtractedData parseExtractedData(String rawJson) {
        try {
            String json = sanitizeJson(rawJson);
            return objectMapper.readValue(json, CvExtractedData.class);
        } catch (Exception ex) {
            throw new BusinessException("ERR_CV_02", "Gemini trả về dữ liệu không hợp lệ", HttpStatus.BAD_GATEWAY);
        }
    }

    private String sanitizeJson(String rawJson) {
        if (rawJson == null) {
            return "{}";
        }

        String normalized = rawJson.trim();
        if (normalized.startsWith("```")) {
            normalized = normalized.replaceFirst("^```(?:json)?\\s*", "");
            normalized = normalized.replaceFirst("\\s*```$", "");
        }

        int start = normalized.indexOf('{');
        int end = normalized.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return normalized.substring(start, end + 1);
        }
        return normalized;
    }

    private record GeminiRequest(List<GeminiContent> contents, GeminiGenerationConfig generationConfig) {}

    private record GeminiContent(String role, List<GeminiPart> parts) {}

    private record GeminiPart(String text) {}

    private record GeminiGenerationConfig(double temperature, int maxOutputTokens) {}
}