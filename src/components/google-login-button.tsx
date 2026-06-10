'use client';

import { AuthLoginResponse, useAuth } from '@/context-providers/auth-context-provider';
import { getErrorMessage } from '@/helpers/util/error-utils';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface GoogleLoginButtonProps {
  redirect?: boolean;
  disabled?: boolean;
  callback?: (res: AuthLoginResponse) => void;
  onLoginAttempt?: () => void;
  onLoginError?: (message: string) => void;
  type?: 'standard' | 'icon';
  size?: 'medium' | 'large';
  text?: 'signin' | 'signin_with';
}

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GSI_MIN_WIDTH = 240;
const GSI_MAX_WIDTH = 400;
const RESIZE_DEBOUNCE_MS = 150;

// This persists for the lifetime of the page session, so we can avoid 
// double instantiation once the GSI script is loaded in the DOM.
let gsiInitialized = false;
let gsiCredentialHandler: ((token: string) => void) | null = null;

export default function GoogleLoginButton({
  redirect = false,
  disabled = false,
  callback,
  onLoginAttempt,
  onLoginError,
  type = 'standard',
  size = 'large',
  text = 'signin_with',
}: GoogleLoginButtonProps) {

  const { loggingIn, loginViaGoogle } = useAuth();
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(GSI_MAX_WIDTH);

  // Refs that stay stable across renders without triggering re-initialization
  const containerWidthRef = useRef<number>(GSI_MAX_WIDTH);
  const initializedRef = useRef<boolean>(false);

  const handleBackendAuth = useCallback(async (token: string) => {
    if (onLoginAttempt) onLoginAttempt();
    try {
      const res = await loginViaGoogle(token);
      if (callback) callback(res);
      if (redirect && !res.data.mfaRequired) {
        router.replace("/dashboard");
      }
    } catch (error: unknown) {
      let message = 'Error logging in via Google';
      if (axios.isAxiosError(error) && error.response?.status !== 500) {
        message = getErrorMessage(error, message);
      }
      console.error(message);
      if (onLoginError) onLoginError(message);
    }
  }, [loginViaGoogle, callback, onLoginAttempt, onLoginError, redirect, router]);

  // Update the components callback on later mounts while skipping initialization
  useEffect(() => {
    gsiCredentialHandler = handleBackendAuth;
    return () => {
      if (gsiCredentialHandler === handleBackendAuth) {
        gsiCredentialHandler = null;
      }
    };
  }, [handleBackendAuth]);

  // Track container width with a debounced ResizeObserver.
  // The debounce prevents excessive renderButton calls during window resizing.
  useEffect(() => {
    if (!containerRef.current) return;

    let debounceTimer: ReturnType<typeof setTimeout>;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const clamped = Math.min(
          Math.max(Math.floor(entry.contentRect.width), GSI_MIN_WIDTH),
          GSI_MAX_WIDTH,
        );
        containerWidthRef.current = clamped;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => setContainerWidth(clamped), RESIZE_DEBOUNCE_MS);
      }
    });

    observer.observe(containerRef.current);
    return () => {
      clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, []);

  // Load the GSI script and call initialize exactly once.
  // initializedRef is intentionally NOT reset in the cleanup so that
  // React Strict Mode's double-invoke of effects does not trigger a second
  // initialize call (which would produce the [GSI_LOGGER] warning).
  useEffect(() => {
    if (gsiInitialized) {
      // GSI is already initialized from a previous mount (e.g. user navigated
      // away and came back). Just re-render the button without re-initializing.
      initializedRef.current = true;

      const targetDiv = document.getElementById('gsi-target-btn');
      if (targetDiv && window.google?.accounts) {
        window.google.accounts.id.renderButton(targetDiv, {
          type,
          theme: 'outline',
          size,
          text,
          logo_alignment: 'center',
          width: containerWidthRef.current,
        });
      }
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
      return;
    }

    const initAndRender = () => {
      if (!window.google?.accounts) return;

      const targetDiv = document.getElementById('gsi-target-btn');
      if (!targetDiv) return;

      // Mark initialized at both module and instance level
      gsiInitialized = true;
      initializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        // Use gsiCredentialHandler so this closure never goes stale, even when
        // React recreates handleBackendAuth due to dependency changes.
        callback: (response: google.accounts.id.CredentialResponse) => {
          if (response.credential) {
            gsiCredentialHandler?.(response.credential);
          }
        },
      });

      window.google.accounts.id.renderButton(targetDiv, {
        type,
        theme: 'outline',
        size,
        text,
        logo_alignment: 'center',
        width: containerWidthRef.current,
      });
    };

    let script = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    if (window.google?.accounts) {
      initAndRender();
    } else {
      script.addEventListener('load', initAndRender);
    }

    return () => {
      (script as HTMLScriptElement).removeEventListener('load', initAndRender);
      // Note: gsiInitialized is NOT reset — initialize() must only ever be called once.
    };
  }, [type, size, text]);

  // Re-render the button whenever the debounced container width changes.
  // initialize is NOT called again here; only the visual button is updated.
  useEffect(() => {
    if (!initializedRef.current || !window.google?.accounts) return;

    const targetDiv = document.getElementById('gsi-target-btn');
    if (!targetDiv) return;

    window.google.accounts.id.renderButton(targetDiv, {
      type,
      theme: 'outline',
      size,
      text,
      logo_alignment: 'center',
      width: containerWidth,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth]);
  // type/size/text changes are handled by the initialization 
  // effect; this effect only responds to resize.

  return (
    <div
      ref={containerRef}
      style={{colorScheme: 'auto'}}
      className='relative w-full max-w-sm mx-auto flex justify-center'
    >
      {/* Target Mount Container */}
      <div id="gsi-target-btn"></div>

      {/* Loading & Disabled Overlay mask */}
      {(loggingIn || disabled) && (
        <div className='absolute top-0 left-0 w-full h-full bg-page/80 cursor-not-allowed'></div>
      )}
    </div>
  );
}
