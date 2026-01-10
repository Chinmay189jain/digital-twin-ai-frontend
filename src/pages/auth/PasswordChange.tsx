import React, { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PasswordChangePage from "./PasswordChangePage";
import { resetAuthenticatedUserPassword, resetForgottenPassword } from "../../api/passwordResetApi";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../utils/apiError";

type PasswordMode = "FORGOT_PASSWORD" | "AUTHENTICATED";
type UiMode = "FORGOT_PASSWORD" | "AUTHENTICATED" | "NONE";

export default function PasswordChange() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const state = location.state as { mode?: PasswordMode; resetToken?: string } | null;

  const mode: PasswordMode = state?.mode ?? "AUTHENTICATED";
  const resetToken = state?.resetToken;

  const uiMode: UiMode = state?.mode ?? "NONE";

  const onSubmit = useCallback(
    async (payload: { currentPassword?: string; newPassword: string; confirmPassword: string }) => {
      try {
        if (uiMode === "NONE") {
          toast.error("Invalid password change flow. Please restart.");
          navigate("/auth", { replace: true });
          return;
        }

        if (uiMode === "AUTHENTICATED") {
          await resetAuthenticatedUserPassword({
            currentPassword: payload.currentPassword ?? "",
            newPassword: payload.newPassword,
            confirmPassword: payload.confirmPassword,
          });

          toast.success("Password updated. Please login again.");
          logout();
          navigate("/auth", { replace: true });
          return;
        }

        // FORGOT_PASSWORD
        if (!resetToken) {
          toast.error("Invalid or missing reset token. Please restart forgot password.");
          navigate("/user/email", { replace: true });
          return;
        }

        await resetForgottenPassword(resetToken, {
          newPassword: payload.newPassword,
          confirmPassword: payload.confirmPassword,
        });

        toast.success("Password updated. Please login.");
        logout(); // safe even if already logged out
        navigate("/auth", { replace: true });
      } catch (err: any) {
        // stay on the same page if error
        toast.error(getApiErrorMessage(err));
      }
    },
    [uiMode, resetToken, navigate, logout]
  );

  return <PasswordChangePage mode={mode} onSubmit={onSubmit} />;
}
