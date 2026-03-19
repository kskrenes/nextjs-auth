import { sendEmail } from "@/helpers/mailer";
import { getRequestBody } from "@/helpers/validate-request";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // throw if request json is invalid
    let reqBody: object;
    try {
      reqBody = await getRequestBody(request);
    } catch(error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid request";
      return NextResponse.json(
        { error: message }, 
        { status: 400 }
      );
    }

    // throw if field types are invalid at runtime
    const { email, type } = reqBody as { email?: string; type?: "VERIFY" | "RESET" };
    if (
      typeof email !== "string" ||
      typeof type !== "string" ||
      (type !== "VERIFY" && type !== "RESET")
    ) {
      return NextResponse.json(
        { error: "Invalid request" },
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
      // log the real error server-side but return generic success to prevent enumeration
      console.error("Mail send failed:", error);
    }

    // log failures server-side but return generic success to prevent enumeration
    if (!mailResponse || !mailResponse.response.includes("250")) {
      console.error("Mail send failed:", mailResponse?.response ?? "No response");
    }

    // return success
    return NextResponse.json({
      message: "An email has been sent if the address matches an existing account",
      success: true,
    })
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    console.error(message);
    return NextResponse.json(
      { error: message }, 
      { status: 500 }
    );
  }
}