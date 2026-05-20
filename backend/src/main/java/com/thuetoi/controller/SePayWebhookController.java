package com.thuetoi.controller;

import com.thuetoi.service.SePayWebhookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments/sepay")
public class SePayWebhookController {

    @Autowired
    private SePayWebhookService sePayWebhookService;

    @PostMapping("/webhook")
    public Map<String, Object> receive(@RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> body) {
        sePayWebhookService.requireValidAuth(auth);
        sePayWebhookService.processIncomingTransaction(body);
        return Map.of("success", true);
    }
}
