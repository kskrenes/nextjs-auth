import { sendEmail } from "@/helpers/util/email-utils";
import { getErrorResponse } from "@/helpers/util/error-utils";
import { validateRequestBody } from "@/helpers/util/request-utils";
import { EmailTypeSchema } from "@/lib/payload-schemas";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // parse json, ensure it's an object, and validate all fields
    const validation = await validateRequestBody(request, EmailTypeSchema);
    if (!validation.success) return validation.errorResponse;
    const { email, type } = validation.data;
    
    // attempt to send email
    let mailResponse;
    try {
      mailResponse = await sendEmail({ 
        email, 
        emailType: type, 
      });
    } catch (mailError: unknown) {
      // log the real error server-side but return generic success to prevent enumeration
      console.error("Mail send failed", {
        errorName: mailError instanceof Error ? mailError.name : "UnknownError",
      });
    }

    // log failures server-side but return generic success to prevent enumeration
    if (!mailResponse || !mailResponse.success) {
      const errorMessage =
        typeof mailResponse?.error === "string"
          ? mailResponse.error
          : "No response";
      console.error(`Mail send failed: ${errorMessage}`);
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