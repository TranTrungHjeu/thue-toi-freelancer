package com.thuetoi.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

public class BusinessException extends RuntimeException {

    private final String code;
    private final HttpStatus status;

    public String getCode() { return code; }
    public HttpStatus getStatus() { return status; }

    public BusinessException(String message) {
        super(message);
        this.code = "BUSINESS_ERROR";
        this.status = HttpStatus.BAD_REQUEST;
    }

    public BusinessException(String code, String message) {
        super(message);
        this.code = code;
        this.status = HttpStatus.BAD_REQUEST;
    }

    public BusinessException(String code, String message, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public BusinessException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.status = HttpStatus.BAD_REQUEST;
    }

    public BusinessException(String code, String message, HttpStatus status, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.status = status;
    }
}
