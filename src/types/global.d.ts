export {};

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize(
        config: { 
          client_id: string; 
          callback: (response: CredentialResponse) => void 
        }
      ): void;
      renderButton(
        element: HTMLElement, 
        options: { 
          theme: string; 
          size: string 
        }
      ): void;
    };
  };
}

declare global {
  interface Window {
    handleCredentialResponse?: (response: CredentialResponse) => void;
    google: GoogleIdentityServices;
  }

  // define the structure of the Google Credential Response
  interface CredentialResponse {
    credential: string; // The JWT
    select_by: string;
  }
}