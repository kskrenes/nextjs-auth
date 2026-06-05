"use client";

import FullScreenLoader from "@/components/full-screen-loader";
import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import NaeLoader from "@/components/nae-loader";
import PanelError from "@/components/panel-error";
import PanelHeader from "@/components/panel-header";
import { useAuth } from "@/context-providers/auth-context-provider";
import { getErrorMessage } from "@/helpers/util/error-utils";
import { getValidUsername } from "@/helpers/util/form-validation-utils";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SubmitEvent } from "react";
import toast from "react-hot-toast";

const OnboardingPage = () => {
  
  const { user, fetchingUser, updatingUser, updateUser } = useAuth();

  const [error, setError] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [prevUserId, setPrevUserId] = useState<string | undefined>(undefined);

  const router = useRouter();
  
  // If the user identity changed, update the username state immediately
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

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    // suppress native html form submit behavior
    e.preventDefault();

    if (updatingUser) return;
    
    setError('');

    if (!username) {
      setError('Please enter a username');
      return;
    }

    let validUsername;
    try {
      validUsername = getValidUsername(username);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Invalid username"));
      return;
    }

    try {
      await updateUser({ username: validUsername });
      toast.success("Your username has been updated!")
      router.replace("/dashboard");
    } catch (error) {
      setError(getErrorMessage(error, "An error occurred. Please try again."));
    }
  }

  return (
    <div className="page-centered">
      <div className="max-w-md w-full">
        <div className="bg-panel rounded-lg p-8">

          {/* Header */}
          <PanelHeader 
            title="Welcome to nAuth!" 
            description="Please choose a username to get started."
          />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && <PanelError message={error} />}

            {/* Username Field */}
            <Input 
              id="username" 
              label="Username"
              aria-label="Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError('');
              }}
              placeholder="myUsername99"
              disabled={updatingUser}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={updatingUser}
              className="w-full gap-2"
            >
              {updatingUser ? (
                <>
                  <NaeLoader />
                  Setting Username...
                </>
              ) : (
                'Submit Username'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage