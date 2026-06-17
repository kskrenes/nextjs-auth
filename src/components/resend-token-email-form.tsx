import { triggerEmail } from "@/helpers/util/email-trigger";
import { EmailType } from "@/lib/payload-schemas";
import { CheckCircle2, Mail } from "lucide-react";
import { SubmitEvent, useState } from "react";
import PanelError from "./panel-error";
import Input from "./nae-input";
import Button from "./nae-button";
import NaeLoader from "./nae-loader";

interface ResendTokenEmailFormProps {
  emailType: EmailType;
}

const ResendTokenEmailForm = ({ emailType }: ResendTokenEmailFormProps) => {

  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState('');

  const getText = (): {
    lower: string;
    capitalized: string;
    action: string;
  } => {
    switch (emailType) {
      case "VERIFY":
        return {
          lower: "verification",
          capitalized: "Verification",
          action: "verify your email address",
        };
      case "RESET":
        return {
          lower: "reset password",
          capitalized: "Reset Password",
          action: "reset your password",
        };
      default:
        return {
          lower: "email",
          capitalized: "Email",
          action: "continue",
        };
    }
  }

  const handleResend = async (
    e: SubmitEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setResendError("");
    setResendSuccess(false);

    if (!email) {
      setResendError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setResendError("Please enter a valid email address");
      return;
    }

    setResending(true);

    try {
      await triggerEmail(email, emailType);
      setResendSuccess(true);
    } catch {
      setResendError("There was a problem sending the link");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      {!resendSuccess ? (
        <div className="border-t border-panel-highlight pt-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-foreground-secondary">
            <Mail className="w-4 h-4" />
            <span className="font-medium">
              Request a new {getText().lower} link
            </span>
          </div>

          <form
            onSubmit={handleResend}
            className="space-y-4"
          >
            {/* Resend Error Message */}
            {resendError && <PanelError message={resendError} />}

            <Input 
              id="emailaddress"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (resendError) setResendError("");
              }}
              placeholder="you@example.com"
              disabled={resending}
            />
            <Button
              type="submit"
              disabled={resending}
              className="w-full button-loader"
            >
              {resending && <NaeLoader />}
              {resending ? 'Sending...' : `Send ${getText().capitalized} Link`}
            </Button>
          </form>
        </div>
      ) : (
        <div className="border-t border-panel-highlight pt-6">
          <div className="bg-panel-excellent border border-panel-excellent-border rounded-md p-4 mb-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-excellent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground-excellent mb-1">
                  {getText().capitalized} Email Sent
                </p>
                <p className="text-sm text-foreground-excellent">
                  We&apos;ve sent a new {getText().lower} link to{" "}
                  <span className="font-medium">
                    {email}
                  </span>
                  . Please check your inbox and click
                  the link to {getText().action}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ResendTokenEmailForm