"use client";

import Button from "@/components/nae-button";
import Input from "@/components/nae-input";
import NaeLoader from "@/components/nae-loader";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/helpers/error-message";
import { excludesSpaces } from "@/helpers/expression-validation";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SubmitEvent } from "react";
import toast from "react-hot-toast";

const OnboardingPage = () => {

  const [isError, setIsError] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  const { user, loading, updateUser } = useAuth();

  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    setUsername(user.username);
  }, [user]);

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

  const handleSubmit = async (e: SubmitEvent) => {
    // suppress native html form submit behavior
    e.preventDefault(); 

    if (loading || isSaving) return;
    
    setIsError(false);
    setErrorMessage("");

    const normalizedUsername = username.trim();

    // validate username format
    if (!excludesSpaces(normalizedUsername)) {
      setErrorMessage("Username cannot contain spaces");
      setIsError(true);
      return;
    }

    // validate username length
    if (normalizedUsername.length < 4) {
      setErrorMessage("Username must meet minimum character requirement");
      setIsError(true);
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({ username: normalizedUsername });
      toast.success("Your username has been updated!")
      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "An error occurred. Please try again."));
      setIsError(true);
    } finally {
      setIsSaving(false);
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
          disabled={loading || isSaving}
        >
          {loading || isSaving
            ? (
              <>
                <NaeLoader />
                <span className="sr-only">
                  {loading ? 'Loading user info' : 'Updating username'}
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