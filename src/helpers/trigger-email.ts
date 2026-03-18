import User from "@/models/user-interface";
import axios from "axios";
import toast from "react-hot-toast";
import { getErrorMessage } from "./error-message";

export const triggerEmail = async (user: User | null, type: string, stateSetter: Function) => {
  if (!user) return;
  
  try {
    stateSetter(true);
    const mailerResponse = await axios.post(
      "/api/users/sendemail", 
      { user, type }
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