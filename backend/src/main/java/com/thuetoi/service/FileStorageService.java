package com.thuetoi.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.thuetoi.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageService {
    
    private final Cloudinary cloudinary;

    public FileStorageService(@Value("${cloudinary.url}") String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.isBlank()) {
            throw new BusinessException("ERR_SYS_01", "Cloudinary credentials are not configured properly", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        this.cloudinary = new Cloudinary(cloudinaryUrl);
    }

    public String storeFile(MultipartFile file, String subDirectory) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        
        try {
            if(originalFileName.contains("..")) {
                throw new BusinessException("ERR_SYS_02", "Sorry! Filename contains invalid path sequence " + originalFileName, HttpStatus.BAD_REQUEST);
            }
            
            // upload to cloudinary
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "thuetoi/" + subDirectory,
                "public_id", UUID.randomUUID().toString() + "_" + System.currentTimeMillis()
            ));
            
            // Return HTTPS URL
            return uploadResult.get("secure_url").toString();
            
        } catch (IOException ex) {
            throw new BusinessException("ERR_SYS_01", "Could not store file " + originalFileName + " to Cloudinary. Please try again!", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
