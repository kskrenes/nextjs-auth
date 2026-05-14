"use client";

import FullScreenLoader from "@/components/full-screen-loader";
import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import NaeLoader from "@/components/nae-loader";
import { useAuth } from "@/context-providers/auth-context-provider";
import { getErrorMessage } from "@/helpers/util/error-utils";
import { getValidUsername } from "@/helpers/util/form-validation-utils";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SubmitEvent } from "react";
import toast from "react-hot-toast";

const OnboardingPage = () => {
  
  const { user, fetchingUser, updatingUser, updateUser } = useAuth();

  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [prevUserId, setPrevUserId] = useState<string | undefined>(undefined);

  const router = useRouter();
  
  // If the user identity changed, update the email state immediately
  if (user?.id !== prevUserId) {
    setPrevUserId(user?.id);
    setUsername(user?.username || "");
  }

  useEffect(() => {
    if (user?.hasCompletedProfile) {
      router.replace('/dashboard');
    }
  }, [user?.hasCompletedProfile, router]);

  if (fetchingUser) return <FullScreenLoader />;

  // clear inline errors when fields change
  const clearInlineError = () => {
    if (isError) {
      setIsError(false);
      setErrorMessage("");
    }
  }

  const handleUsernameChange = (value: string) => {
    clearInlineError();
    setUsername(value);
  }

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault();

    if (updatingUser) return;
    
    setIsError(false);
    setErrorMessage("");

    let validUsername;
    try {
      validUsername = getValidUsername(username);
    } catch (error: unknown) {
      setErrorMessage((error as Error).message);
      setIsError(true);
      return;
    }

    try {
      await updateUser({ username: validUsername });
      toast.success("Your username has been updated!")
      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "An error occurred. Please try again."));
      setIsError(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form 
        className="flex w-75 flex-col items-center py-2 gap-8" 
        onSubmit={handleSubmit} 
      >
        <h1 className="text-3xl font-bold">Welcome!</h1>
        <p>Please choose a username to get started.</p>
        {isError && (
          <div role="alert" className="flex items-center space-x-2 text-sm text-red-500">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-center">{errorMessage}</span>
          </div>
        )}
        <div className="flex flex-col gap-4 w-full">
          <Input 
            id="username" 
            label="Username"
            placeholder="username"
            type="text"
            instruction="4 character minimum, no spaces"
            minLength={4}
            required
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={updatingUser}
        >
          {updatingUser
            ? (
              <>
                <NaeLoader />
                <span className="sr-only">
                  Updating username
                </span>
              </>
            )
            : 'Confirm'}
        </Button>
      </form>
    </div>
  )
}

export default OnboardingPage