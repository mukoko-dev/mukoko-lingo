# Branded Email Templates

Transactional email is sent by **WorkOS AuthKit**, not by this codebase. There
is no mail library in the repo and no template files to deploy — the templates
below are pasted into the WorkOS dashboard, per environment.

> This document previously described Supabase's email settings and used a
> purple palette that is not the brand's. Both were left over from the
> pre-WorkOS stack. Everything below is the current setup.

## Where to configure

1. [WorkOS Dashboard](https://dashboard.workos.com) → your environment
2. **Authentication → Emails** (branding and templates)
3. **Authentication → Redirects** — the redirect URIs AuthKit is allowed to
   send users back to. These must match what the app computes, or a correct
   sign-in dies at the last hop:
   - `mukokolingo://auth/callback` (native)
   - `https://lingo.mukoko.com/auth/callback` (production web)
   - your Expo dev host, e.g. `http://192.168.1.20:8081/auth/callback`

   `lib/workos/config.ts` owns the client-side allowlist and its tests pin the
   private-LAN ranges — add a host there too, or the client refuses before
   WorkOS is ever asked.

## Which emails exist

AuthKit sends these, and which ones are live depends on what the environment
has enabled:

| Email | Sent when | Contains |
|---|---|---|
| Email verification | A new account is created | 6-digit code or verification link |
| Magic auth | Passwordless sign-in is requested | 6-digit code |
| Password reset | `app/auth/forgot-password.tsx` requests one | Reset link → `app/auth/reset-password.tsx` |
| Organization invitation | A teacher invites a learner to a class | Accept link |

The app does not template, queue, or send any of them. Changing wording is a
dashboard change, not a deploy.

## Brand values for the templates

From `constants/Colors.ts` (light theme — email has no dark mode worth
trusting). Do not invent shades: these are the Five African Minerals palette,
and [BRANDING.md](../BRANDING.md) is the source of truth.

| Role | Hex | Use in email |
|---|---|---|
| Cobalt (primary) | `#0047AB` | Header band, primary button |
| Tanzanite (secondary) | `#4B0082` | Header gradient end |
| Gold/warm brown (accent) | `#5D4037` | The code block, emphasis |
| Army green (success) | `#729B63` | Confirmation states |
| Warm cream | `#FAF9F5` | Page background |
| Card | `#FFFFFF` | Content panel |
| Text primary | `#141413` | Body copy |
| Text secondary | `#52524E` | Supporting copy, footer |

Voice: Shamwari is warm, patient and encouraging — friendly without being
cute, and never at the expense of clarity about what the reader must do.

## Base template

One shell, four bodies. Paste the shell, swap the block marked `<!-- BODY -->`
for the one you need below. Tables and inline styles are deliberate: email
clients still do not do flexbox or `<style>` blocks reliably.

```html
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
       style="background-color: #FAF9F5; margin: 0; padding: 0;">
  <tr>
    <td style="padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
             style="max-width: 480px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden;">

        <!-- Header -->
        <tr>
          <td style="padding: 36px 40px 28px; text-align: center;
                     background: linear-gradient(135deg, #0047AB 0%, #4B0082 100%);">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #FFFFFF;">
              Mukoko Lingo
            </h1>
            <p style="margin: 6px 0 0; font-size: 14px; color: rgba(255,255,255,0.85);">
              Learn Shona, Ndebele and Chinese with Shamwari
            </p>
          </td>
        </tr>

        <!-- BODY -->

        <!-- Footer -->
        <tr>
          <td style="padding: 24px 40px 32px; text-align: center; border-top: 1px solid #F3F2EE;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #52524E;">
              If you did not request this, you can safely ignore this email.
            </p>
            <p style="margin: 0; font-size: 12px; color: #8C8B87;">
              Mukoko Lingo · a <a href="https://nyuchi.com" style="color: #0047AB; text-decoration: none;">Nyuchi Africa</a> product
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

### Body: verification / magic auth code

**Subject** — verification: `Confirm your email · Mukoko Lingo`
**Subject** — magic auth: `Your sign-in code · Mukoko Lingo`

```html
<tr>
  <td style="padding: 32px 40px;">
    <p style="margin: 0 0 16px; font-size: 16px; color: #141413;">Mhoro!</p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52524E;">
      Enter this code to continue. It expires in 10 minutes.
    </p>
    <div style="margin: 0 0 24px; padding: 18px; text-align: center; background-color: #F3F2EE; border-radius: 12px;">
      <span style="font-size: 30px; font-weight: 700; letter-spacing: 8px; color: #5D4037;">
        {{code}}
      </span>
    </div>
    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #8C8B87;">
      Never share this code. Nobody from Mukoko Lingo will ask you for it.
    </p>
  </td>
</tr>
```

### Body: password reset

**Subject**: `Reset your password · Mukoko Lingo`

```html
<tr>
  <td style="padding: 32px 40px;">
    <p style="margin: 0 0 16px; font-size: 16px; color: #141413;">Reset your password</p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52524E;">
      Tap the button below to choose a new one. The link expires in 1 hour and
      can only be used once.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 24px;">
      <tr>
        <td style="border-radius: 12px; background-color: #0047AB;">
          <a href="{{link}}"
             style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600;
                    color: #FFFFFF; text-decoration: none;">
            Choose a new password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #8C8B87; word-break: break-all;">
      Button not working? Paste this into your browser:<br>{{link}}
    </p>
  </td>
</tr>
```

### Body: class invitation

**Subject**: `You have been invited to a class · Mukoko Lingo`

```html
<tr>
  <td style="padding: 32px 40px;">
    <p style="margin: 0 0 16px; font-size: 16px; color: #141413;">
      {{inviter_name}} invited you to join {{organization_name}}
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52524E;">
      Accept to start learning with your class. Your progress, streak and skill
      levels stay yours.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
      <tr>
        <td style="border-radius: 12px; background-color: #729B63;">
          <a href="{{link}}"
             style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600;
                    color: #FFFFFF; text-decoration: none;">
            Accept invitation
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>
```

Placeholder names (`{{code}}`, `{{link}}`, `{{organization_name}}`) follow
WorkOS's template variables — check the dashboard's variable list for the
template you are editing rather than assuming these names carry across.

## Testing

1. Edit in the **Staging** WorkOS environment first; Production is a separate
   set of templates.
2. Trigger the real flow (sign up, request a reset) rather than a preview —
   previews do not exercise the redirect URI, which is where these break.
3. Check on a phone. The 480px panel and 48px tap targets exist for that.
4. Confirm the link returns to the app: a code that arrives but lands on a
   dead redirect is the failure mode this document's redirect section is about.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Email never arrives | Sending domain not verified in WorkOS, or the flow is disabled for that environment |
| Link opens the browser instead of the app | Deep link scheme missing from the redirect list, or `app.json` scheme changed |
| "Redirect URI mismatch" after clicking | The URI is not registered in WorkOS, or not in `lib/workos/config.ts`'s allowlist |
| Styling collapses in Outlook | A `<style>` block or flexbox crept in — keep everything inline and table-based |
