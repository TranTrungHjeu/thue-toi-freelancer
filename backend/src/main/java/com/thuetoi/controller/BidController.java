package com.thuetoi.controller;

import com.thuetoi.dto.request.BidRequest;
import com.thuetoi.dto.request.BidStatusRequest;
import com.thuetoi.dto.response.ApiResponse;
import com.thuetoi.dto.response.PaymentOrderResponse;
import com.thuetoi.dto.response.marketplace.BidResponse;
import com.thuetoi.dto.response.marketplace.ContractResponse;
import com.thuetoi.entity.Bid;
import com.thuetoi.entity.Contract;
import com.thuetoi.exception.BusinessException;
import com.thuetoi.mapper.MarketplaceResponseMapper;
import com.thuetoi.security.CurrentUserProvider;
import com.thuetoi.service.BidService;
import com.thuetoi.service.ContractService;
import com.thuetoi.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller Bid: API gửi báo giá, xem danh sách, chọn bid
 */
@RestController
@RequestMapping("/api/v1/bids")
public class BidController {

    
}
