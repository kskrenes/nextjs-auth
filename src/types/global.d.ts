export {};

declare global {
  interface Window {
    handleCredentialResponse?: (response: CredentialResponse) => void;
    google: any;
  }

  // define the structure of the Google Credential Response
  interface CredentialResponse {
    credential: string; // The JWT
    select_by: string;
  }
}