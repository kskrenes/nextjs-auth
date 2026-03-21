import { verify } from "crypto";

// styles
const OUTER_BG_COLOR = '#f4f4f4';
const INNER_BG_COLOR = '#ffffff';
const HEADER_TEXT_COLOR = '#642295';
const BODY_TEXT_COLOR = '#666666';
const URL_TEXT_COLOR = '#666666';
const BUTTON_BG_COLOR = '#7013b5';
const BUTTON_TEXT_COLOR = '#ffffff';
const BUTTON_STYLE = 'border-radius: 4px;';
const BUTTON_FONT_SIZE = '16px';
const HEADER_FONT_SIZE = '24px';
const BODY_FONT_SIZE = '16px';
const URL_FONT_SIZE = '16px';
const BODY_LINE_HEIGHT = '24px';
const URL_LINE_HEIGHT = '24px';
const COLLAPSE_MARGIN = 'border="0" cellSpacing="0" cellPadding="0"';
const FONTS = 'Helvetica, Arial';

// messaging
const INTRO_VERIFY = 'Thank you for registering!';
const INTRO_RESET = 'One more step!';
const ACTION_VERIFY = 'verify your email address';
const ACTION_RESET = 'reset your password';
const IGNORE_VERIFY = 'create an account';
const IGNORE_RESET = 'make this request';
const BUTTON_LABEL_VERIFY = 'Verify Email Address';
const BUTTON_LABEL_RESET = 'Reset Password';

export const getEmailSubject = (
  username: string, 
  action: 'VERIFY' | 'RESET'
): string => {
  return `${username}, ${action === 'VERIFY' ? ACTION_VERIFY : ACTION_RESET}`;
}

// escape dynamic values before injecting into the HTML template
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const getEmailHtml = (
  username: string, 
  url: string, 
  action: 'VERIFY' | 'RESET'
): string => {
  const safeUsername = escapeHtml(username);
  const safeUrl = escapeHtml(url);

  // action-dependent text
  const introMessage = `${action === 'VERIFY' ? INTRO_VERIFY : INTRO_RESET}`;
  const actionMessage = `${action === 'VERIFY' ? ACTION_VERIFY : ACTION_RESET}`;
  const ignoreMessage = `${action === 'VERIFY' ? IGNORE_VERIFY : IGNORE_RESET}`;
  const buttonLabel = `${action === 'VERIFY' ? BUTTON_LABEL_VERIFY : BUTTON_LABEL_RESET}`;

  // full p tags
  const bodyPTag = `<p style="color: ${BODY_TEXT_COLOR}; font-size: ${BODY_FONT_SIZE}; line-height: ${BODY_LINE_HEIGHT}; margin: 0 0 30px 0;">`;
  const urlPTag = `<p style="color: ${URL_TEXT_COLOR}; font-size: ${URL_FONT_SIZE}; font-weight: bold; line-height: ${URL_LINE_HEIGHT}; margin: 0 0 30px 0;">`;

  // full message:
  const headerText = `Hi ${safeUsername},`;
  const introText = `${introMessage} Please click the button below to ${actionMessage}.`;
  const copyPasteText = `Or, copy the following URL and paste into your browser:`;
  const ignoreText = `If you did not ${ignoreMessage}, you can safely ignore this email.`;

  // construct html
  const html = `<table width="100%" ${COLLAPSE_MARGIN} bgcolor="${OUTER_BG_COLOR}"><tr><td align="center" style="padding: 20px 0;"><table width="600" ${COLLAPSE_MARGIN} bgcolor="${INNER_BG_COLOR}" style="border-collapse: collapse; font-family: ${FONTS}, sans-serif;"><tr><td style="padding: 40px;"><h1 style="color: ${HEADER_TEXT_COLOR}; font-size: ${HEADER_FONT_SIZE}; margin: 0 0 20px 0;">${headerText}</h1>${bodyPTag}${introText}</p><table ${COLLAPSE_MARGIN} style="margin: 0 auto 30px;"><tr><td bgcolor="${BUTTON_BG_COLOR}" style="${BUTTON_STYLE}"><a href="${safeUrl}" target="_blank" style="padding: 12px 24px; display: inline-block; color: ${BUTTON_TEXT_COLOR}; text-decoration: none; font-size: ${BUTTON_FONT_SIZE}; font-weight: bold;">${buttonLabel}</a></td></tr></table>${bodyPTag}${copyPasteText}</p>${urlPTag}${safeUrl}</p>${bodyPTag}${ignoreText}</p></td></tr></table></td></tr></table>`;

  return html;
}