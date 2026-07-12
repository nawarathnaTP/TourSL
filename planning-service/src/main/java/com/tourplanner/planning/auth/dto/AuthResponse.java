package com.tourplanner.planning.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class AuthResponse {

	private UUID userId;
	private String accessToken;
	private String refreshToken;
	private String email;
	private String firstName;
	private String lastName;
	private String role;
}
