import axios from "axios";
import { getErrorMessage } from "./error-utils";

export const triggerEmail = async (
  email: string, 
  type: 'VERIFY' | 'RESET', 
  stateSetter?: (loading: boolean) => void
) => {
  if (!email) return;

  try {
    if (stateSetter) stateSetter(true);
    await axios.post(
      "/api/users/sendemail", 
      { email, type }
    );
  } 
  catch (error: unknown) {
    const typeMessage = type === 'VERIFY' ? 'verify' : 'reset password'
    const errorMessage = getErrorMessage(error, `Error sending ${typeMessage} email`);
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  finally {
    if (stateSetter) stateSetter(false);
  }
}