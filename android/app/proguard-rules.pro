# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
##########################################
# Firebase Auth
##########################################
-keep class com.google.firebase.auth.** { *; }
-keep class com.google.firebase.** { *; }

##########################################
# Google Play services
##########################################
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

##########################################
# Firebase internal auth API (VERY IMPORTANT)
##########################################
-keep class com.google.android.gms.internal.firebase-auth-api.** { *; }

##########################################
# Play Integrity
##########################################
-keep class com.google.android.play.core.integrity.** { *; }
-keep class com.google.android.play.core.common.** { *; }

##########################################
# React Native Firebase
##########################################
-keep class io.invertase.firebase.** { *; }

##########################################
# Tasks API
##########################################
-keep class com.google.android.gms.tasks.** { *; }

##########################################
# Keep annotations & signatures
##########################################
-keepattributes *Annotation*
-keepattributes Signature