import User from "@/models/user-model";
import { getRandomToken, hashToken } from "./token-utils";
import { EmailType } from "@/lib/payload-schemas";
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// styles
const OUTER_BG_COLOR = '#e3eaef';
const INNER_BG_COLOR = '#f3faff';
const HEADER_TEXT_COLOR = '#6366f1';
const HEADER_BORDER_COLOR = '#e6edff';
const BODY_TEXT_COLOR = '#4b596d';
const URL_TEXT_COLOR = '#353642';
const BUTTON_BG_COLOR = '#6366f1';
const BUTTON_TEXT_COLOR = '#e5e6f2';
const BUTTON_STYLE = 'border-radius: 6px;';
const BUTTON_FONT_SIZE = '16px';
const HEADER_FONT_SIZE = '24px';
const LOGO_FONT_SIZE = '20px';
const BODY_FONT_SIZE = '16px';
const URL_FONT_SIZE = '16px';
const BODY_LINE_HEIGHT = '24px';
const URL_LINE_HEIGHT = '24px';
const COLLAPSE_MARGIN = 'border="0" cellSpacing="0" cellPadding="0"';
const FONTS = 'Helvetica, Arial';
const LOGO_SIZE = '30';

// messaging
const INTRO_VERIFY = 'Thank you for registering!';
const INTRO_RESET = 'One more step!';
const ACTION_VERIFY = 'verify your email address';
const ACTION_RESET = 'reset your password';
const IGNORE_VERIFY = 'create an account';
const IGNORE_RESET = 'make this request';
const BUTTON_LABEL_VERIFY = 'Verify Email Address';
const BUTTON_LABEL_RESET = 'Reset Password';

const getEmailSubject = (
  username: string, 
  action: EmailType
): string => {
  return `${username}, ${action === EmailType.VERIFY ? ACTION_VERIFY : ACTION_RESET}`;
}

// escape dynamic values before injecting into the HTML template
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getEmailHtml = (
  username: string, 
  url: string, 
  action: EmailType
): string => {
  const safeUsername = escapeHtml(username);
  const safeUrl = escapeHtml(url);

  // action-dependent text
  const introMessage = action === EmailType.VERIFY ? INTRO_VERIFY : INTRO_RESET;
  const actionMessage = action === EmailType.VERIFY ? ACTION_VERIFY : ACTION_RESET;
  const ignoreMessage = action === EmailType.VERIFY ? IGNORE_VERIFY : IGNORE_RESET;
  const buttonLabel = action === EmailType.VERIFY ? BUTTON_LABEL_VERIFY : BUTTON_LABEL_RESET;

  // full p tags
  const bodyPTag = `<p style="color: ${BODY_TEXT_COLOR}; font-size: ${BODY_FONT_SIZE}; line-height: ${BODY_LINE_HEIGHT}; margin: 0 0 30px 0;">`;
  const urlPTag = `<p style="color: ${URL_TEXT_COLOR}; font-size: ${URL_FONT_SIZE}; font-weight: bold; line-height: ${URL_LINE_HEIGHT}; margin: 0 0 30px 0;">`;

  // full message:
  const headerText = `Hi ${safeUsername},`;
  const introText = `${introMessage} Please click the button below to ${actionMessage}.`;
  const copyPasteText = `Or, copy the following URL and paste into your browser:`;
  const ignoreText = `If you did not ${ignoreMessage}, you can safely ignore this email.`;

  // construct html
  const html = `
    <table width="100%" ${COLLAPSE_MARGIN} bgcolor="${OUTER_BG_COLOR}">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <table width="600" ${COLLAPSE_MARGIN} bgcolor="${INNER_BG_COLOR}" style="border-collapse: collapse; font-family: ${FONTS}, sans-serif;">
            <!-- Header with Embedded Logo -->
            <tr>
              <td valign="middle" style="vertical-align: middle; padding: 14px 20px; border-bottom: 1px solid ${HEADER_BORDER_COLOR};">
                <img src="cid:logo" alt="Brand Logo" width="${LOGO_SIZE}" height="${LOGO_SIZE}" border="0" style="display: inline-block; vertical-align: middle; margin-right: 6px; border: none; outline: none; text-decoration: none;" />
                <h2 style="display: inline-block; vertical-align: middle; font-size: ${LOGO_FONT_SIZE}; margin: 0">nAuth NextJS Auth Example</h2>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <h1 style="color: ${HEADER_TEXT_COLOR}; font-size: ${HEADER_FONT_SIZE}; margin: 0 0 20px 0;">${headerText}</h1>
                ${bodyPTag}${introText}</p>
                <table ${COLLAPSE_MARGIN} style="margin: 0 auto 30px;">
                  <tr>
                    <td>
                      <a href="${safeUrl}" target="_blank" style="${BUTTON_STYLE} background-color: ${BUTTON_BG_COLOR}; padding: 9px 20px; display: inline-block; color: ${BUTTON_TEXT_COLOR}; text-decoration: none; font-size: ${BUTTON_FONT_SIZE}; font-weight: 600;">${buttonLabel}</a>
                    </td>
                  </tr>
                </table>
                ${bodyPTag}${copyPasteText}</p>
                ${urlPTag}${safeUrl}</p>
                ${bodyPTag}${ignoreText}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return html;
}

// type definition for VERIFY email data
type VerifyEmailData = {
  route: "verifyemail";
  userUpdate: {
    verifyToken: string;
    verifyTokenExpiry: number;
  };
};

// type definition for RESET email data
type ResetEmailData = {
  route: "resetpassword";
  userUpdate: {
    forgotPasswordToken: string;
    forgotPasswordTokenExpiry: number;
  };
};

// discriminated union type including each email data type
type EmailData = VerifyEmailData | ResetEmailData;

// returns the appropriate route name and update data for each email type
function getEmailData(emailType: EmailType, hashedToken: string): EmailData {
  const expiry = Date.now() + 1000 * 60 * 60;

  switch (emailType) {
    case EmailType.RESET:
      return {
        route: "resetpassword",
        userUpdate: {
          forgotPasswordToken: hashedToken,
          forgotPasswordTokenExpiry: expiry,
        },
      };

    case EmailType.VERIFY:
      return {
        route: "verifyemail",
        userUpdate: {
          verifyToken: hashedToken,
          verifyTokenExpiry: expiry,
        },
      };

    default:
    {
      // Exhaustiveness check (compile-time safety)
      const _exhaustive: never = emailType;
      return _exhaustive;
    }
  }
}

interface SendEmailProps {
  email: string;
  emailType: EmailType;
}

export const sendEmail = async ({ email, emailType }: SendEmailProps ) => {
  try {
    // validate Resend env variables first to avoid orphaning tokens
    const apiKey = process.env.RESEND_API_KEY;
    const domain = process.env.APP_ORIGIN;
    const mailFrom = process.env.MAILER_FROM;
    if (!apiKey || !domain || !mailFrom) {
      // throw if Resend env variables are not configured
      throw new Error(
        "Missing or invalid mail configuration (RESEND_API_KEY, APP_ORIGIN, MAILER_FROM)"
      );
    }

    const rawToken: string = getRandomToken();
    const hashedToken: string = hashToken(rawToken);
    const emailData: EmailData = getEmailData(emailType, hashedToken);

    // update the user
    const updatedUser = await User.findOneAndUpdate( 
      { email },
      emailData.userUpdate,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );    

    // throw if no user found
    if (!updatedUser) {
      throw new Error("No user found with that email");
    }

    // initialize Resend with API key
    const resend = new Resend(apiKey);

    // expose only the raw token in the url
    const username = updatedUser.username;
    const linkUrl = `${domain}/${emailData.route}?token=${encodeURIComponent(rawToken)}`;
    const subject = getEmailSubject(username, emailType);
    const html = getEmailHtml(username, linkUrl, emailType);
    const logoPath = path.join(process.cwd(), 'public', 'nAuth-logo-light.png');
    const logoBuffer = fs.readFileSync(logoPath);

    // configure mail options
    const mailOptions = {
      from: mailFrom,
      to: email,
      subject,
      html,
      attachments: [
        {
          content: logoBuffer,
          filename: 'nAuth-logo-light.png',
          contentId: 'logo',
        },
      ],
    };

    // send the email and return the transport response
    try {
      const { data, error } = await resend.emails.send(mailOptions);
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch {
      return { success: false, error: 'Failed to send email' };
    }
  } 
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error sending email";
    throw new Error(message, { cause: error });
  }
}