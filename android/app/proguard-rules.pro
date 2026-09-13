# Add project specific ProGuard rules here.

# Strip Android Log debug and verbose statements in release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
}

# Preserve React Native NativeModules methods
-keepclassmembers class * extends com.facebook.react.bridge.ReactContextBaseJavaModule {
   @com.facebook.react.bridge.ReactMethod *;
}

# Preserve CallTracker module classes
-keep class com.calltracker.** { *; }
-keepclassmembers class com.calltracker.** { *; }

