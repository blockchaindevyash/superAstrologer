# Extra ProGuard/R8 rules to avoid missing classes errors with optional SDKs

# Stripe Push Provisioning (optional feature). Prevent R8 from failing when classes are absent.
-dontwarn com.stripe.android.pushProvisioning.**
-keep class com.stripe.android.pushProvisioning.** { *; }

# React Native Stripe SDK push provision proxy
-dontwarn com.reactnativestripesdk.pushprovisioning.**
-keep class com.reactnativestripesdk.pushprovisioning.** { *; }

# Razorpay (silence harmless warnings)
-dontwarn com.razorpay.**

# Defensive keeps (React Native core and Kotlin)
-dontwarn com.facebook.react.**
-keep class com.facebook.react.** { *; }
-dontwarn kotlin.**
-keep class kotlin.** { *; }
