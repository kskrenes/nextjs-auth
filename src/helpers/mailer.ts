import User from "@/models/user-model";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export const sendEmail = async ({ 
  email, 
  emailType, 
  userId 
} : {
  email: string;
  emailType: 'VERIFY' | 'RESET';
  userId: object;
}): Promise<SMTPTransport.SentMessageInfo> => {
  try {
    // create hashed token
    const idString: string = userId.toString();
    const hashedToken: string = await bcrypt.hash(idString, 10);

    let route: string = "verifyemail";
    let action: string = "Verify your email";

    if (emailType === "VERIFY") {
      // set the user's verify token
      await User.findByIdAndUpdate(
        idString, 
        {
          verifyToken: hashedToken,
          verifyTokenExpiry: Date.now() + (1000 * 60 * 60), // 1 hour
        },
        {
          new: true,
          runValidators: true,
        }
      );
    }
    else if (emailType === "RESET") {
      route = "resetpassword";
      action = "Reset your password";

      // set the user's forgot password token
      await User.findByIdAndUpdate(
        idString, 
        {
          forgotPasswordToken: hashedToken,
          forgotPasswordTokenExpiry: Date.now() + (1000 * 60 * 60), // 1 hour
        },
        {
          new: true,
          runValidators: true,
        }
      );
    }

    const transport = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASS,
      }
    });

    const mailOptions = {
      from: 'test.mailer@gmail.com',
      to: email,
      subject: action,
      html: 
        `<p>Click <a href="${process.env.DOMAIN}/${route}
        ?token=${hashedToken}">here</a> to 
        ${action.toLowerCase()}</p>`,
    };

    // send the email and return the transport response
    const mailResponse:SMTPTransport.SentMessageInfo = await transport.sendMail(mailOptions);
    return mailResponse;
    
  } catch (error: unknown) {
    let errorMessage: string = "Error sending email";
    if (error && typeof error === "object" && 'message' in error) {
      errorMessage = error.message as string;
    }
    throw new Error(errorMessage);
  }
}