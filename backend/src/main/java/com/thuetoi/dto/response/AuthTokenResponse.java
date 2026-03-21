package com.thuetoi.dto.response;

public class AuthTokenResponse {
    private String tokenType;
    private String accessToken;
    private Long accessTokenExpiresIn;
    private AuthUserResponse user;

    public AuthTokenResponse() {
    }

    public AuthTokenResponse(String tokenType, String accessToken, Long accessTokenExpiresIn, AuthUserResponse user) {
        this.tokenType = tokenType;
        this.accessToken = accessToken;
        this.accessTokenExpiresIn = accessTokenExpiresIn;
        this.user = user;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public Long getAccessTokenExpiresIn() {
        return accessTokenExpiresIn;
    }

    public void setAccessTokenExpiresIn(Long accessTokenExpiresIn) {
        this.accessTokenExpiresIn = accessTokenExpiresIn;
    }

    public AuthUserResponse getUser() {
        return user;
    }

    public void setUser(AuthUserResponse user) {
        this.user = user;
    }
}
