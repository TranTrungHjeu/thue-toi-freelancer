package com.thuetoi.service;

import com.thuetoi.entity.Bid;
import com.thuetoi.entity.Project;
import com.thuetoi.entity.User;
import com.thuetoi.dto.request.FileAttachmentRequest;
import com.thuetoi.enums.BidStatus;
import com.thuetoi.enums.ProjectStatus;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.repository.BidRepository;
import com.thuetoi.repository.ProjectRepository;
import com.thuetoi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

import java.math.BigDecimal;

/**
 * Service Bid: Xử lý logic nghiệp vụ báo giá.
 */
@Service
public class BidService {
    
}
