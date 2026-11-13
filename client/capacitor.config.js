const { defineCapacitorConfig } = require("@capacitor/cli");

export default defineCapacitorConfig({
  appId: "com.webrtc.allinone",
  appName: "WebRTC All-in-One",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0f172a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
    LocalNotifications: {
      smallIcon: "ic_stat_app_icon",
      iconColor: "#3b82f6",
      sound: "default",
    },
  },
});
