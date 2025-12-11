# Branded Email Templates for Nyuchi Lingo

This document provides branded email templates for Supabase authentication emails. These templates should be configured in your Supabase Dashboard.

## Configuration Steps

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Email Templates**
4. Replace the default templates with the branded versions below

## Important: Add Redirect URLs

Before password reset works, you must add the redirect URLs to your Supabase project:

1. Go to **Authentication** > **URL Configuration**
2. Add these to **Redirect URLs**:
   - `nyuchilingo://reset-password` (for Expo app)
   - `com.nyuchi.lingo://reset-password` (alternative scheme)
   - Your production web URL if applicable

---

## 1. Confirm Signup Email

**Subject:** Welcome to Nyuchi Lingo - Confirm Your Email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #faf9f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #faf9f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #5f5873 0%, #7c73e6 100%); border-radius: 16px 16px 0 0;">
              <img src="https://your-domain.com/logo.png" alt="Nyuchi Lingo" width="64" height="64" style="display: block; margin: 0 auto 16px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Welcome to Nyuchi Lingo!</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #1a1a1a;">
                Hi there,
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                Thanks for signing up for Nyuchi Lingo! Please confirm your email address to start your language learning journey.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background-color: #5f5873; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                      Confirm Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #6b6b6b;">
                If you didn't create an account with Nyuchi Lingo, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f5f5f5; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b6b6b;">
                Nyuchi Lingo - Learn African Languages with AI
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Password Reset Email

**Subject:** Reset Your Nyuchi Lingo Password

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #faf9f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #faf9f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #5f5873 0%, #7c73e6 100%); border-radius: 16px 16px 0 0;">
              <img src="https://your-domain.com/logo.png" alt="Nyuchi Lingo" width="64" height="64" style="display: block; margin: 0 auto 16px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Password Reset Request</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #1a1a1a;">
                Hi there,
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                We received a request to reset your Nyuchi Lingo password. Click the button below to create a new password.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background-color: #5f5873; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #6b6b6b;">
                This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email - your password will remain unchanged.
              </p>
            </td>
          </tr>
          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <div style="padding: 16px; background-color: #fff8e6; border-radius: 8px; border-left: 4px solid #F6AD55;">
                <p style="margin: 0; font-size: 13px; color: #8B7355;">
                  <strong>Security tip:</strong> Never share this link with anyone. Nyuchi Lingo will never ask for your password via email.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f5f5f5; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b6b6b;">
                Nyuchi Lingo - Learn African Languages with AI
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Magic Link Email

**Subject:** Your Nyuchi Lingo Sign-In Link

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In to Nyuchi Lingo</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #faf9f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #faf9f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #5f5873 0%, #7c73e6 100%); border-radius: 16px 16px 0 0;">
              <img src="https://your-domain.com/logo.png" alt="Nyuchi Lingo" width="64" height="64" style="display: block; margin: 0 auto 16px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Sign In to Nyuchi Lingo</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #1a1a1a;">
                Hi there,
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                Click the button below to sign in to your Nyuchi Lingo account. No password needed!
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background-color: #729B63; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                      Sign In Now
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #6b6b6b;">
                This link will expire in 1 hour. If you didn't request this sign-in link, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f5f5f5; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b6b6b;">
                Nyuchi Lingo - Learn African Languages with AI
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Email Change Confirmation

**Subject:** Confirm Your New Email Address - Nyuchi Lingo

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #faf9f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #faf9f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #5f5873 0%, #7c73e6 100%); border-radius: 16px 16px 0 0;">
              <img src="https://your-domain.com/logo.png" alt="Nyuchi Lingo" width="64" height="64" style="display: block; margin: 0 auto 16px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Confirm Email Change</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #1a1a1a;">
                Hi there,
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4a4a4a;">
                You requested to change your email address for your Nyuchi Lingo account. Please confirm this change by clicking the button below.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background-color: #5f5873; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                      Confirm New Email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #6b6b6b;">
                If you didn't request this change, please contact support immediately.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f5f5f5; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b6b6b;">
                Nyuchi Lingo - Learn African Languages with AI
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Brand Colors Reference

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Primary Purple | `#5f5873` | Main buttons, headers |
| Primary Light | `#7c73e6` | Gradients, accents |
| Secondary Green | `#729B63` | Success states, CTAs |
| Background | `#faf9f5` | Email background |
| Card | `#ffffff` | Content cards |
| Text Primary | `#1a1a1a` | Main text |
| Text Secondary | `#4a4a4a` | Body text |
| Text Muted | `#6b6b6b` | Fine print |
| Warning/Accent | `#F6AD55` | Security notices |
| Warm Brown | `#8B7355` | Warning text |

---

## Testing Email Templates

### Local Development (Inbucket)

When running Supabase locally, emails are captured by Inbucket:

1. Start Supabase: `supabase start`
2. Open Inbucket: http://127.0.0.1:54324
3. Trigger an auth action (signup, password reset)
4. Check Inbucket for the email

### Production

1. Configure email templates in Supabase Dashboard
2. Test each flow:
   - Sign up and check confirmation email
   - Trigger password reset and check email
   - Change email and verify both addresses receive emails

---

## Troubleshooting

### Password Reset Link Not Working

1. Verify redirect URLs are added in Supabase Dashboard
2. Check that `nyuchilingo://` scheme is in `app.json`
3. Ensure the app can handle deep links (test with `npx uri-scheme open nyuchilingo://reset-password --ios`)

### Emails Not Being Received

1. Check spam/junk folder
2. Verify email provider is configured in Supabase
3. Check Supabase logs for email delivery errors
4. For production, consider using a dedicated email service (SendGrid, Postmark, etc.)
