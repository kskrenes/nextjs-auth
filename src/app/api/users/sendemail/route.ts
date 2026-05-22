import { EmailType, sendEmail } from "@/helpers/util/email-utils";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { validateJSON } from "@/helpers/util/request-utils";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // validate JSON
    const reqBody = await validateJSON(request);
    if (reqBody instanceof Response) return reqBody;  // return error response

    // throw if field types are invalid at runtime
    const { email, type } = reqBody as { email?: string; type?: EmailType };
    if (
      typeof email !== "string" ||
      typeof type !== "string" ||
      (type !== "VERIFY" && type !== "RESET")
    ) {
      return getErrorResponse(400, "Invalid request payload");
    }
    
    // attempt to send email
    let mailResponse;
    try {
      mailResponse = await sendEmail({ 
        email, 
        emailType: type, 
      });
    } catch (mailError: unknown) {
      // log the real error server-side but return generic success to prevent enumeration
      console.error("Mail send failed:", mailError);
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
  catch (routeError: unknown) {
    return getErrorResponse(500, "Failed to send email", routeError);
  }
}