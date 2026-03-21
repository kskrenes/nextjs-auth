import axios from "axios";
// import toast from "react-hot-toast";
import { getErrorMessage } from "./error-message";

export const triggerEmail = async (
  email: string, 
  type: 'VERIFY' | 'RESET', 
  stateSetter: (loading: boolean) => void
) => {
  if (!email) return;

  try {
    stateSetter(true);
    await axios.post(
      "/api/users/sendemail", 
      { email, type }
    );
    // toast.success("Email sent.");
  } 
  catch (error: unknown) {
    const errorMessage = getErrorMessage(error, `Error sending email`);
    console.error(errorMessage);
    // toast.error(errorMessage);
    throw new Error(errorMessage);
  }
  finally {
    stateSetter(false);
  }
}