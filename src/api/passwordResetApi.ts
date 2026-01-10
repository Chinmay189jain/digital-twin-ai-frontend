import api from "./axios";

export interface ForgotPasswordResetBody {
  newPassword: string;
  confirmPassword: string;
}

export interface AuthenticatedPasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// send otp for password reset api call
export const requestPasswordResetOtp = async (email: string) => {
  const response = await api.post("/password/change/forgot/mail/send", { email });
  return response.data; // message
};

// verify otp for password reset api call
export const verifyPasswordResetOtp = async (email: string, otpCode: string) => {
  const response = await api.post("/password/change/forgot/mail/verify", { email, otpCode });
  return response.data; // { token: "..." }
};

// reset password using token (forgotten password)
export const resetForgottenPassword = async (
  resetToken: string,
  body: ForgotPasswordResetBody
) => {
  const response = await api.post("/password/change/forgot/reset", body, {
    headers: { Authorization: `Bearer ${resetToken}` },
  });
  return response.data;
};

// reset password for authenticated user
export const resetAuthenticatedUserPassword = async (
  body: AuthenticatedPasswordRequest
) => {
  const response = await api.patch("/password/change/authenticated/reset", body);
  return response.data;
};

