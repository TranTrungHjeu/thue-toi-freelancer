package com.thuetoi.service;

import com.thuetoi.entity.User;
import com.thuetoi.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
public class TelegramBotService extends TelegramLongPollingBot {
    private static final Logger logger = LoggerFactory.getLogger(TelegramBotService.class);

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
        if (botToken == null || botToken.isEmpty()) {
            logger.error("Telegram Bot Token is missing! Please set TELEGRAM_BOT_TOKEN environment variable.");
            return "MISSING_TOKEN";
        }
        return botToken;
    }

    @Override
    public void onUpdateReceived(Update update) {
        if (update.hasMessage() && update.getMessage().hasText()) {
            String messageText = update.getMessage().getText();
            long chatId = update.getMessage().getChatId();

            if (messageText.startsWith("/start")) {
                sendStartMessage(chatId);
            } else if (messageText.startsWith("/login ")) {
                handleLogin(chatId, messageText);
            } else if (messageText.startsWith("/me")) {
                handleCheckAccount(chatId);
            } else if (messageText.startsWith("/logout")) {
                handleLogout(chatId);
            } else if (messageText.startsWith("/help")) {
                sendHelpMessage(chatId);
            } else {
                sendTextMessage(chatId, "Lệnh không hợp lệ. Sử dụng `/help` để xem danh sách các lệnh hỗ trợ.");
            }
        }
    }

    private void sendStartMessage(long chatId) {
        String welcome = "👋 *Chào mừng bạn đến với Thuê Tôi Freelancer Bot!*\n\n" +
                "Bot này giúp bạn nhận thông báo tức thời về:\n" +
                "🚀 Dự án mới (dành cho Freelancer)\n" +
                "📩 Báo giá mới (dành cho Khách hàng)\n" +
                "🔔 Các cập nhật quan trọng khác từ hệ thống\n\n" +
                "Để bắt đầu, vui lòng sử dụng lệnh:\n" +
                "`/login <username> <password>`\n\n" +
                "Gõ `/help` để xem tất cả các lệnh.";
        sendTextMessage(chatId, welcome);
    }

    private void sendHelpMessage(long chatId) {
        String help = "🆘 *Danh sách các lệnh hỗ trợ:*\n\n" +
                "🔑 `/login <user> <pass>` - Liên kết tài khoản hệ thống với Telegram\n" +
                "👤 `/me` - Kiểm tra thông tin tài khoản đang liên kết\n" +
                "🚪 `/logout` - Hủy liên kết tài khoản\n" +
                "❓ `/help` - Xem hướng dẫn này\n\n" +
                "💡 *Gợi ý:* Sau khi đăng nhập, bạn có thể tắt thông báo Telegram bất cứ lúc nào bằng cách dùng lệnh `/logout`.";
        sendTextMessage(chatId, help);
    }

    private void handleLogout(long chatId) {
        Optional<User> userOpt = userRepository.findByTelegramChatId(String.valueOf(chatId));
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setTelegramChatId(null);
            userRepository.save(user);
            sendTextMessage(chatId, "✅ Đã đăng xuất và hủy liên kết tài khoản thành công. Bạn sẽ không nhận được thông báo nữa.");
        } else {
            sendTextMessage(chatId, "Bạn chưa liên kết tài khoản nào.");
        }
    }

    private void handleCheckAccount(long chatId) {
        Optional<User> userOpt = userRepository.findByTelegramChatId(String.valueOf(chatId));
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String info = "👤 *Thông tin tài khoản:*\n\n" +
                    "- Họ tên: " + user.getFullName() + "\n" +
                    "- Email: " + user.getEmail() + "\n" +
                    "- Vai trò: " + user.getRole() + "\n" +
                    "- Trạng thái: " + (Boolean.TRUE.equals(user.getVerified()) ? "Đã xác thực ✅" : "Chưa xác thực ⚠️");
            sendTextMessage(chatId, info);
        } else {
            sendTextMessage(chatId, "⚠️ Bạn chưa liên kết tài khoản. Vui lòng dùng lệnh `/login <username> <password>`");
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
            logger.error("Error sending telegram message to {}: {}", chatId, e.getMessage());
        }
    }
}
