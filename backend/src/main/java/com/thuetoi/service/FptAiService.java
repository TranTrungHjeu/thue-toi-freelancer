package com.thuetoi.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;

@Service
@Slf4j
public class FptAiService {

    @Value("${fpt.ai.api-key:YOUR_FPT_API_KEY}")
    private String apiKey;

    private static final String FPT_ID_API_URL = "https://api.fpt.ai/vision/idr/vnm";

    public String recognizeIdCard(MultipartFile imageFile) throws IOException {
        RestTemplate restTemplate = new RestTemplate();

        // Chuẩn bị Headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("api-key", apiKey);

        // Chuyển MultipartFile sang File tạm để gửi
        File convFile = convertMultipartToFile(imageFile);

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new FileSystemResource(convFile));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(FPT_ID_API_URL, requestEntity, String.class);

            return response.getBody();
        } finally {
            // Xóa file tạm sau khi dùng
            Files.deleteIfExists(convFile.toPath());
        }
    }

    private File convertMultipartToFile(MultipartFile file) throws IOException {
        File convFile = new File(System.getProperty("java.io.tmpdir") + "/" + file.getOriginalFilename());
        FileOutputStream fos = new FileOutputStream(convFile);
        fos.write(file.getBytes());
        fos.close();
        return convFile;
    }
}
