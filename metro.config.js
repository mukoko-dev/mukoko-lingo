// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// ---------------------------------------------------------------------------
// Suppress "SES Removing unpermitted intrinsics" in web builds.
//
// Some transitive dependencies (e.g. @vercel/functions, certain auth SDKs)
// include the `ses` package which auto-runs a lockdown() call at module-init
// time. In the browser this prints "SES Removing unpermitted intrinsics" to
// the console and can interfere with runtime globals. We replace those modules
// with an empty shim for web builds only — native builds are unaffected and
// server-side security is enforced by the API layer.
// ---------------------------------------------------------------------------
const originalResolveRequest = config.resolver?.resolveRequest

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (
      moduleName === 'ses' ||
      moduleName === 'ses/lockdown' ||
      moduleName === '@endo/ses-compat' ||
      moduleName === '@endo/lockdown' ||
      moduleName.endsWith('/lockdown-install.js') ||
      moduleName.endsWith('/lockdown.js')
    ) {
      // Return an empty module — prevents lockdown() from running in the browser
      return { type: 'empty' }
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
