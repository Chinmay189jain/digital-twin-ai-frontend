import React, { useCallback, useMemo, useState, FormEvent, ChangeEvent } from "react";
import { BrainCog, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";

type PasswordMode = "FORGOT_PASSWORD" | "AUTHENTICATED";

interface PasswordChangeProps {
  mode: PasswordMode;
  onSubmit: (payload: {
    currentPassword?: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void> | void;
}

type FieldId = "currentPassword" | "newPassword" | "confirmPassword";
type Errors = Partial<Record<FieldId, string>>;

const MIN_LEN = 6;

const PasswordField = React.memo(function PasswordField(props: {
  id: FieldId;
  label: string;
  value: string;
  placeholder: string;
  show: boolean;
  error?: string;
  onToggleShow: () => void;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  const { id, label, value, placeholder, show, error, onToggleShow, onChange } = props;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <div className="mt-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>

        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={id === "currentPassword" ? "current-password" : "new-password"}
          className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            dark:bg-gray-700 dark:text-white transition-colors duration-200
            ${error ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}
          `}
          placeholder={placeholder}
        />

        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          onClick={onToggleShow}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          ) : (
            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          )}
        </button>
      </div>

      {/* keep this for input-level error */}
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
});

const PasswordChangePage: React.FC<PasswordChangeProps> = ({ mode, onSubmit }) => {
  const isAuthenticatedMode = mode === "AUTHENTICATED";

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [show, setShow] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const title = useMemo(
    () => (isAuthenticatedMode ? "Change Password" : "Reset Password"),
    [isAuthenticatedMode]
  );

  const subtitle = useMemo(
    () =>
      isAuthenticatedMode
        ? "Enter your current password and set a new one."
        : "Enter a new password to secure your account.",
    [isAuthenticatedMode]
  );

  // client-side validation (only for input hints)
  const validate = useCallback((): boolean => {
    const next: Errors = {};

    if (isAuthenticatedMode && !form.currentPassword.trim()) {
      next.currentPassword = "Current password is required";
    }

    if (!form.newPassword.trim()) {
      next.newPassword = "New password is required";
    } else if (form.newPassword.length < MIN_LEN) {
      next.newPassword = `Password must be at least ${MIN_LEN} characters`;
    }

    if (!form.confirmPassword.trim()) {
      next.confirmPassword = "Please confirm your password";
    } else if (form.newPassword !== form.confirmPassword) {
      next.confirmPassword = "Passwords do not match";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form, isAuthenticatedMode]);

  const setField = useCallback(
    (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  const toggleShow = useCallback((key: keyof typeof show) => {
    setShow((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (isAuthenticatedMode && !form.currentPassword.trim()) return false;
    return !!form.newPassword.trim() && !!form.confirmPassword.trim();
  }, [loading, isAuthenticatedMode, form.currentPassword, form.newPassword, form.confirmPassword]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSuccess(false);

      if (!validate()) return;

      setLoading(true);

      try {
        await onSubmit({
          currentPassword: isAuthenticatedMode ? form.currentPassword : undefined,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        });

        setSuccess(true);
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setErrors({});

        window.setTimeout(() => setSuccess(false), 2500);
      } catch (err: any) {
        // show exact backend message in toast
        toast.error(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [validate, onSubmit, form, isAuthenticatedMode]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br select-none from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Heading */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-indigo-600 rounded-full">
              <BrainCog className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700">
          <form className={`space-y-6 ${loading ? "opacity-60 pointer-events-none" : ""}`} onSubmit={handleSubmit}>
            {isAuthenticatedMode && (
              <PasswordField
                id="currentPassword"
                label="Current Password"
                value={form.currentPassword}
                placeholder="Enter current password"
                show={show.currentPassword}
                error={errors.currentPassword}
                onToggleShow={() => toggleShow("currentPassword")}
                onChange={setField("currentPassword")}
              />
            )}

            <PasswordField
              id="newPassword"
              label="New Password"
              value={form.newPassword}
              placeholder="Enter new password"
              show={show.newPassword}
              error={errors.newPassword}
              onToggleShow={() => toggleShow("newPassword")}
              onChange={setField("newPassword")}
            />

            <PasswordField
              id="confirmPassword"
              label="Confirm Password"
              value={form.confirmPassword}
              placeholder="Confirm new password"
              show={show.confirmPassword}
              error={errors.confirmPassword}
              onToggleShow={() => toggleShow("confirmPassword")}
              onChange={setField("confirmPassword")}
            />

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white
                bg-indigo-600 hover:bg-indigo-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 dark:focus:ring-offset-gray-800"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangePage;
