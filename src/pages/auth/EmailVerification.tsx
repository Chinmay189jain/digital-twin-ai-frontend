import React, { useCallback, useEffect, useMemo, useRef, useState, ChangeEvent, FormEvent } from "react";
import { Mail, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { requestAccountVerificationOtp, verifyAccountVerificationOtp } from "../../api/authApi";
import { requestPasswordResetOtp, verifyPasswordResetOtp } from "../../api/passwordResetApi"; 
import { decodeToken } from "../../utils/jwtUtils";
import { EMAIL_VERIFICATION_TEXT } from "../../constants/text";

type VerifyMode = "VERIFY_EMAIL" | "FORGOT_PASSWORD";

const OTP_LEN = 6;
const RESEND_SECONDS = 300;

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const EmailVerification: React.FC = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { email?: string; mode?: VerifyMode } | null;
  const mode = state?.mode;

  // For VERIFY_EMAIL, use logged in user's email
  // For FORGOT_PASSWORD, use state email
  const email = useMemo(() => {
    if (mode === "VERIFY_EMAIL") return user?.email ?? "";
    if (mode === "FORGOT_PASSWORD") return state?.email ?? "";
    return "";
  }, [mode, user?.email, state?.email]);

  // If opened directly without required context, redirect to the home page
  useEffect(() => {
    // No mode, user directly opened the page
    if (!mode) {
      navigate("/", { replace: true });
      return;
    }

    // VERIFY_EMAIL requires logged-in user and unverified state
    if (mode === "VERIFY_EMAIL" && (!user?.email || user?.verified)) {
      navigate("/auth", { replace: true });
      return;
    }

    // FORGOT_PASSWORD requires an email passed from previous screen
    if (mode === "FORGOT_PASSWORD" && !state?.email) {
      navigate("/auth", { replace: true }); 
    }
  }, [mode, user?.email, user?.verified, state?.email, navigate]);

  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);

  const canResend = resendTimer === 0;

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;

    const id = window.setInterval(() => {
      setResendTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => window.clearInterval(id);
  }, [resendTimer]);

  // Auto-send OTP only if context is valid (prevents direct-link spam)
  const hasSentOtp = useRef(false);
  useEffect(() => {
    if (hasSentOtp.current) return;

    const canAutoSend =
      (mode === "VERIFY_EMAIL" && !!user?.email && user?.verified === false) ||
      (mode === "FORGOT_PASSWORD" && !!state?.email);

    if (!canAutoSend) return;

    hasSentOtp.current = true;

    const send = async () => {
      try {
        if (mode === "VERIFY_EMAIL") {
          await requestAccountVerificationOtp();
        } else {
          await requestPasswordResetOtp(state!.email!);
        }
      } catch (err: any) {
        if (err?.response?.status === 429) {
          toast("OTP already sent. Please wait before resending.");
          return;
        }
        toast.error("Error sending OTP. Try again.");
        console.error("❌ Error sending OTP:", err);
      }
    };

    send();
  }, [mode, user?.email, user?.verified, state]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, "").slice(0, OTP_LEN);
      setVerificationCode(value);
      if (error) setError("");
    },
    [error]
  );

  const isSubmitDisabled = useMemo(
    () => loading || verificationCode.length !== OTP_LEN,
    [loading, verificationCode]
  );

  const primaryButtonText = useMemo(() => {
    if (mode === "FORGOT_PASSWORD") return loading ? "Verifying..." : "Verify code";
    return loading ? "Verifying..." : "Verify email";
  }, [mode, loading]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (verificationCode.length !== OTP_LEN) {
        toast.error("Please enter a valid 6-digit code");
        return;
      }

      if (!mode) return;

      setLoading(true);
      setError("");

      try {
        if (mode === "VERIFY_EMAIL") {
          const data = await verifyAccountVerificationOtp(verificationCode);
          const token = data?.token;

          if (!token) {
            toast.error("No token received.");
            setError("No token received.");
            return;
          }

          localStorage.setItem("token", token);

          const decoded: any = decodeToken(token);
          const isVerified = Boolean(decoded?.verified);

          setUser({
            email: decoded?.sub ?? "",
            name: decoded?.username ?? "",
            verified: isVerified,
          });

          if (isVerified) {
            toast.success("Email verified successfully");
            navigate("/generate-profile");
          } else {
            toast.error("Email not verified. Please try again.");
            setError("Email not verified. Please try again.");
          }
        } else {
          // FORGOT_PASSWORD
          const res = await verifyPasswordResetOtp(state!.email!, verificationCode);
          const resetToken = res?.token;

          if (!resetToken) {
            toast.error("No reset token received.");
            setError("No reset token received.");
            return;
          }

          toast.success("OTP verified");
          navigate("/change/password", {
            state: { mode: "FORGOT_PASSWORD", resetToken }, 
          });
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data ||
          "Invalid or expired code. Please try again.";

        toast.error(msg);
        setError(msg);
        console.error("OTP verification failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [verificationCode, mode, navigate, setUser, state]
  );

  const handleResendCode = useCallback(async () => {
    if (!canResend) return;
    if (!mode) return;

    setVerificationCode("");
    setError("");
    setResendTimer(RESEND_SECONDS);

    try {
      if (mode === "VERIFY_EMAIL") {
        await requestAccountVerificationOtp();
      } else {
        await requestPasswordResetOtp(state!.email!);
      }
      toast.success("OTP resent successfully");
    } catch (err: any) {
      if (err?.response?.status === 429) {
        toast("Please wait before requesting another OTP.");
        return;
      }
      console.error("Failed to resend OTP:", err);
      toast.error("Failed to resend code. Try again later.");
    }
  }, [canResend, mode, state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur py-8 px-6 shadow-2xl rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="p-3 bg-green-600 rounded-full">
                <Mail className="w-12 h-12 text-white" />
              </div>
            </div>

            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{EMAIL_VERIFICATION_TEXT.CODE_VERIFY.TITLE}</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{EMAIL_VERIFICATION_TEXT.CODE_VERIFY.DESCRIPTION}</p>
            <p className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 break-all">
              {email || "—"}
            </p>
          </div>

          <form className={`mt-6 space-y-5 ${loading ? "opacity-60 pointer-events-none" : ""}`} onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {mode === "FORGOT_PASSWORD" ? "Reset code" : "Verification code"}
              </label>

              <input
                autoComplete="one-time-code"
                type="text"
                inputMode="numeric"
                maxLength={OTP_LEN}
                value={verificationCode}
                onChange={handleInputChange}
                className={`mt-2 w-full text-center text-2xl tracking-[0.35em] font-semibold py-3 px-4 border rounded-xl shadow-sm focus:outline-none transition
                  placeholder-gray-400 dark:placeholder-gray-500
                  dark:bg-gray-700 dark:text-white
                  ${error ? "border-red-500 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}
                `}
                placeholder="000000"
              />

              {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{EMAIL_VERIFICATION_TEXT.CODE_VERIFY.CODE_NOT_RECIEVED}</span>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend}
                className={`inline-flex items-center gap-1 font-medium ${canResend
                    ? "text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                    : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                }`}
              >
                <RefreshCw className="h-4 w-4" />
                {canResend ? "Resend code" : formatTime(resendTimer)}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full py-2.5 rounded-xl text-white font-medium bg-indigo-600 hover:bg-indigo-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Verifying..." : "Verify email"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          {EMAIL_VERIFICATION_TEXT.CODE_VERIFY.BOTTOM_TEXT_ONE}<br></br>{EMAIL_VERIFICATION_TEXT.CODE_VERIFY.BOTTOM_TEXT_TWO}
        </p>
      </div>
    </div>
  );
};

export default EmailVerification;
