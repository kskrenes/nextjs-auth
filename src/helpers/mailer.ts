import User from "@/models/user-model";
import crypto from "crypto";
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { getEmailHtml, getEmailSubject } from "./email-html";

export const sendEmail = async ({ 
  email, 
  emailType, 
} : {
  email: string;
  emailType: 'VERIFY' | 'RESET';
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

    // generate a cryptographically random raw token (32 bytes → 64-char hex string)
    const rawToken: string = crypto.randomBytes(32).toString("hex");

    // hash with SHA-256 for DB storage (deterministic, fast, secure for high-entropy tokens)
    const hashedToken: string = crypto.createHash("sha256").update(rawToken).digest("hex");

    // set data based on emailType
    let route: string = "verifyemail";
    let action: string = "Verify your email";
    let userUpdate: object = {
      verifyToken: hashedToken,  // only the hash goes in the DB                
      verifyTokenExpiry: Date.now() + (1000 * 60 * 60), // 1 hour
    };

    if (emailType === "RESET") {
      route = "resetpassword";
      action = "Reset your password";
      userUpdate = {
        forgotPasswordToken: hashedToken,  // only the hash goes in the DB
        forgotPasswordTokenExpiry: Date.now() + (1000 * 60 * 60), // 1 hour
      };
    }

    // update the user
    const updatedUser = await User.findOneAndUpdate( 
      { email },
      userUpdate,
      {
        new: true,
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
    const linkUrl = `${domain}/${route}?token=${encodeURIComponent(rawToken)}`;
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