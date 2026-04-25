package com.thuetoi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thuetoi.dto.request.FileAttachmentRequest;
import com.thuetoi.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AttachmentMetadataServiceTest {

    private final AttachmentMetadataService service = new AttachmentMetadataService(new ObjectMapper());

    @Test
    void serializeAndDeserializeMetadataList() {
        FileAttachmentRequest attachment = attachment("https://res.cloudinary.com/demo/document.pdf", "document.pdf", "application/pdf", 1200L);

        String serialized = service.serialize(List.of(attachment));
        List<FileAttachmentRequest> deserialized = service.deserialize(serialized);

        assertThat(deserialized).hasSize(1);
        assertThat(deserialized.getFirst().getUrl()).isEqualTo("https://res.cloudinary.com/demo/document.pdf");
        assertThat(deserialized.getFirst().getName()).isEqualTo("document.pdf");
        assertThat(deserialized.getFirst().getContentType()).isEqualTo("application/pdf");
        assertThat(deserialized.getFirst().getSize()).isEqualTo(1200L);
    }

    @Test
    void serializeRejectsPathTraversalFilename() {
        FileAttachmentRequest attachment = attachment("https://res.cloudinary.com/demo/document.pdf", "../document.pdf", "application/pdf", 1200L);

        assertThatThrownBy(() -> service.serialize(List.of(attachment)))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> assertThat(((BusinessException) throwable).getCode()).isEqualTo("ERR_FILE_01"));
    }

    @Test
    void serializeRejectsMoreThanFiveAttachments() {
        FileAttachmentRequest attachment = attachment("https://res.cloudinary.com/demo/document.pdf", "document.pdf", "application/pdf", 1200L);

        assertThatThrownBy(() -> service.serialize(List.of(
            attachment,
            attachment,
            attachment,
            attachment,
            attachment,
            attachment
        )))
            .isInstanceOf(BusinessException.class)
            .satisfies(throwable -> assertThat(((BusinessException) throwable).getCode()).isEqualTo("ERR_FILE_01"));
    }

    private FileAttachmentRequest attachment(String url, String name, String contentType, Long size) {
        FileAttachmentRequest attachment = new FileAttachmentRequest();
        attachment.setUrl(url);
        attachment.setName(name);
        attachment.setContentType(contentType);
        attachment.setSize(size);
        return attachment;
    }
}
