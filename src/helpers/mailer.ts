import User from "@/models/user-model";
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { getEmailHtml, getEmailSubject } from "./email-html";
import { getRandomToken, hashToken } from "./token";

// enum for each email type
export enum EmailType {
  VERIFY = 'VERIFY',
  RESET = 'RESET',
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
function getEmailData(
  emailType: EmailType,
  hashedToken: string
): EmailData {
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

export const sendEmail = async ({ 
  email, 
  emailType, 
} : {
  email: string;
  emailType: EmailType;
}): Promise<SMTPTransport.SentMessageInfo> => {
  try {
    // validate smtp env variables first to avoid orphaning tokens
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT);
    const smtpUser = process.env.MAILER_USER;
    const smtpPass = process.env.MAILER_PASS;
    const mailFrom = process.env.MAILER_FROM;
    const domain = process.env.DOMAIN;
    if (
      !smtpHost ||
      !Number.isInteger(smtpPort) ||
      smtpPort < 1 ||
      smtpPort > 65535 ||
      !smtpUser ||
      !smtpPass ||
      !mailFrom ||
      !domain
    ) {
      // throw if smtp env variables are not configured
      throw new Error(
        "Missing or invalid mail configuration (SMTP_HOST, SMTP_PORT, MAILER_USER, MAILER_PASS, MAILER_FROM, DOMAIN)"
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

    // configure transport
    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      }
    });

    // expose only the raw token in the url
    const username = updatedUser.username;
    const linkUrl = `${domain}/${emailData.route}?token=${encodeURIComponent(rawToken)}`;
    const subject = getEmailSubject(username, emailType);
    const html = getEmailHtml(username, linkUrl, emailType);

    // configure mail options
    const mailOptions = {
      from: mailFrom,
      to: email,
      subject,
      html,
    };

    // send the email and return the transport response
    const mailResponse:SMTPTransport.SentMessageInfo = await transport.sendMail(mailOptions);
    return mailResponse;  
  } 
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error sending email";
    throw new Error(message, { cause: error });
  }
}