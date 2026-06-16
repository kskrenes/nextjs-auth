"use client";

import { Fingerprint } from 'lucide-react'
import { useEffect, useState } from 'react';

interface PasskeyLoginButtonProps {
  loading: boolean;
  onClick: () => void;
}

const PasskeyLoginButton = ({ loading, onClick }: PasskeyLoginButtonProps) => {

  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    (async () => {
      setIsSupported(!!window.PublicKeyCredential);
    })();
  }, []);

  // don't display if passkeys are not supported in the browser
  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      disabled={loading}
      className="w-full mt-5 button-white button-mid"
      onClick={onClick}
    >
      <Fingerprint className="w-5 h-5" />
      Sign in with a passkey
    </button>
  )
}

export default PasskeyLoginButton