'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function GoogleLoginButton() {

  const { loading, loginViaGoogle } = useAuth();
  
  useEffect(() => {
    // define the global callback function
    window.handleCredentialResponse = (response) => {
      const idToken = response.credential;
      handleBackendAuth(idToken);
    };

    // load google script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: '196254866356-4tqaqmloq3tobllnbi4m4sb1inte6imu.apps.googleusercontent.com',
        callback: window.handleCredentialResponse,
      });
      window.google?.accounts.id.renderButton(
        document.getElementById('gsi-button')!,
        { theme: 'outline', size: 'large' }
      );
    };
    
    return () => {
      document.body.removeChild(script);
      delete window.handleCredentialResponse;
    };
  }, []);

  const handleBackendAuth = async (token: string) => {
    try {
      await loginViaGoogle(token);
      console.log('successful response from sso google login');
    } catch (error) {
      console.error('error loging in via google', error);
    }
  }

  return (
    <div style={{colorScheme: 'auto'}} className='relative'>
      <div id="gsi-button" data-type="standard"></div>
      {loading && <div className='absolute top-0 left-0 w-full h-full bg-page/80'></div>}
    </div>
  );
}
