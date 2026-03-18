import { sendEmail } from "@/helpers/mailer";
import { getRequestBody } from "@/helpers/validate-request";
import User from "@/models/user-interface";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // throw if request json is invalid
    let reqBody: any;
    try {
      reqBody = await getRequestBody(request);
    } catch(error: any) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }

    // throw if user is invalid
    const email = reqBody.email as string;
    if (!email) {
      return NextResponse.json(
        { error: "Invalid email" }, 
        { status: 400 }
      );
    }

    // throw if type is invalid
    const type = reqBody.type as string;
    if (type !== "VERIFY" && type !== "RESET") {
      return NextResponse.json(
        { error: "Invalid email type" }, 
        { status: 400 }
      );
    }
    
    // attempt to send email
    let mailResponse;
    try {
      mailResponse = await sendEmail({ 
        email, 
        emailType: type, 
      });
    } catch (error: unknown) {
      const eMessage = error instanceof Error ? error.message : "Error sending email";
      return NextResponse.json(
        { error: eMessage }, 
        { status: 400 }
      );
    }

    // throw if no response
    if (!mailResponse) {
      return NextResponse.json(
        { error: "No response received" }, 
        { status: 400 }
      );
    }

    // throw if no success status
    if (!mailResponse.response.includes("250")) {
      return NextResponse.json(
        { error: "Unsuccessful response:" + mailResponse.response }, 
        { status: 400 }
      );
    }
    
    // return success and include the mail response object
    return NextResponse.json({
      message: "Email sent successfully",
      success: true,
      mailResponse,
    })
  }
  catch (error: unknown) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Error sending email" }, 
      { status: 500 }
    );
  }
}