package com.thuetoi.service;

import com.thuetoi.entity.User;
import com.thuetoi.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.util.Optional;

@Service
@Slf4j
public class TelegramBotService extends TelegramLongPollingBot {

    @Value("${telegram.bot.username:thuetoi_bot}")
    private String botUsername;

    @Value("${telegram.bot.token:}")
    private String botToken;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public String getBotUsername() {
        return botUsername;
    }

    @Override
    public String getBotToken() {
        return botToken;
    }

    @Override
    public void onUpdateReceived(Update update) {
        if (update.hasMessage() && update.getMessage().hasText()) {
            String messageText = update.getMessage().getText();
            long chatId = update.getMessage().getChatId();

            if (messageText.startsWith("/start")) {
                sendTextMessage(chatId, "Chào mừng bạn đến với Thuê Tôi Freelancer Bot!\nVui lòng đăng nhập để nhận thông báo: `/login <username> <password>`");
            } else if (messageText.startsWith("/login ")) {
                handleLogin(chatId, messageText);
            } else {
                sendTextMessage(chatId, "Lệnh không hợp lệ. Sử dụng `/login <username> <password>` để bắt đầu.");
            }
        }
    }

    private void handleLogin(long chatId, String messageText) {
        String[] parts = messageText.split("\\s+");
        if (parts.length < 3) {
            sendTextMessage(chatId, "Sai cú pháp! Vui lòng dùng: `/login <username> <password>`");
            return;
        }

        String username = parts[1];
        String password = parts[2];

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            User user = userOpt.get();
            user.setTelegramChatId(String.valueOf(chatId));
            userRepository.save(user);
            sendTextMessage(chatId, "Đăng nhập thành công! Chào " + user.getFullName() + " (" + user.getRole() + "). Bạn sẽ nhận được thông báo từ hệ thống.");
        } else {
            sendTextMessage(chatId, "Tên đăng nhập hoặc mật khẩu không chính xác.");
        }
    }

    public void sendNotification(String telegramChatId, String message) {
        if (telegramChatId != null && !telegramChatId.isEmpty()) {
            sendTextMessage(Long.parseLong(telegramChatId), message);
        }
    }

    private void sendTextMessage(long chatId, String text) {
        SendMessage message = new SendMessage();
        message.setChatId(String.valueOf(chatId));
        message.setText(text);
        message.setParseMode("Markdown");
        try {
            execute(message);
        } catch (TelegramApiException e) {
            log.error("Error sending telegram message to {}: {}", chatId, e.getMessage());
        }
    }
}
