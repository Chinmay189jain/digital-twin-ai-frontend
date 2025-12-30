import React, { useCallback, useMemo, useState, FormEvent, ChangeEvent } from "react";
import { BrainCog, Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { EMAIL_VERIFICATION_TEXT } from "../../constants/text";

type Mode = "FORGOT_PASSWORD" | "VERIFY_EMAIL";

const validateEmail = (emailValue: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailValue);
};

const RequestEmailVerification: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isVerifyEmailMode = !!user && user.verified === false;
  const mode: Mode = isVerifyEmailMode ? "VERIFY_EMAIL" : "FORGOT_PASSWORD";

  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");

  const emailValue = isVerifyEmailMode ? (user?.email ?? "") : emailInput;

  const canSubmit = useMemo(() => {
    if (isVerifyEmailMode) return true;
    return emailInput.trim().length > 0;
  }, [isVerifyEmailMode, emailInput]);

  const fieldClassName = useMemo(
    () =>
      `block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm
       placeholder-gray-400 dark:placeholder-gray-500
       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
       dark:bg-gray-700 dark:text-white transition-colors duration-200
       ${error ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`,
    [error]
  );

  const onEmailChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEmailInput(e.target.value);
    if (error) setError("");
  }, [error]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (error) setError("");

      const email = emailValue.trim();

      if (!email) {
        setError("Email address is required");
        return;
      }
      if (!validateEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }

      // UX gate only (not security)
      localStorage.setItem("twin-email-verification", "true");

      navigate("/account/verify");
    },
    [emailValue, navigate, error]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br select-none from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Heading section */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-indigo-600 rounded-full">
              <BrainCog className="w-12 h-12 text-white" />
            </div>
          </div>

          <h2 className="mt-6 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {EMAIL_VERIFICATION_TEXT[mode].TITLE}
          </h2>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            {EMAIL_VERIFICATION_TEXT[mode].DESCRIPTION}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>

              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>

                {/* One UI, toggles behavior */}
                {isVerifyEmailMode ? (
                  <div className={fieldClassName}>
                    {emailValue || "—"}
                  </div>
                ) : (
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={emailInput}
                    onChange={onEmailChange}
                    className={fieldClassName}
                    placeholder="Enter your email address"
                    autoComplete="email"
                  />
                )}
              </div>

              {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white
                bg-indigo-600 hover:bg-indigo-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200 dark:focus:ring-offset-gray-800"
            >
              {EMAIL_VERIFICATION_TEXT[mode].BUTTON_TEXT}
            </button>
          </form>

          {/* Back button */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="w-full flex items-center justify-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestEmailVerification;
