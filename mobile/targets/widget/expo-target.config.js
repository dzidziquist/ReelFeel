/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: "widget",
  name: "ReelFeelWidget",
  bundleId: "com.reelfeel.app.widget",
  deploymentTarget: "17.0",
  entitlements: {
    "com.apple.security.application-groups": ["group.com.reelfeel.app"]
  },
};
