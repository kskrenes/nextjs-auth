import axios from "axios";
import toast from "react-hot-toast";
import { getErrorMessage } from "./error-message";

export const triggerEmail = async (email: string, type: string, stateSetter: Function) => {
  if (!email) return;

  try {
    stateSetter(true);
    const mailerResponse = await axios.post(
      "/api/users/sendemail", 
      { email, type }
    );
    toast.success("Email sent.");
  } 
  catch (error: unknown) {
    const errorMessage = getErrorMessage(error, `Error sending ${type} email`);
    console.error(errorMessage);
    toast.error(errorMessage);
  }
  finally {
    stateSetter(false);
  }
}