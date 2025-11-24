# Dockerfile to build the Android debug APK inside a container.
# Produces /out/app-debug.apk in the final image, which you can copy out.

FROM node:18-bullseye AS builder

# Install Java 17 and basic tools (AGP requires Java 17)
RUN apt-get update && apt-get install -y openjdk-17-jdk wget unzip git && rm -rf /var/lib/apt/lists/*

# Android SDK paths
ENV ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    PATH="$PATH:/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools:/opt/android-sdk/build-tools/33.0.2"

# Install Android commandline tools and required SDK components
RUN mkdir -p /opt/android-sdk/cmdline-tools && \
    cd /opt/android-sdk/cmdline-tools && \
    wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O cmdtools.zip && \
    unzip cmdtools.zip -d /opt/android-sdk/cmdline-tools && \
    mv /opt/android-sdk/cmdline-tools/cmdline-tools /opt/android-sdk/cmdline-tools/latest && \
    yes | sdkmanager --sdk_root=/opt/android-sdk --licenses && \
    sdkmanager --sdk_root=/opt/android-sdk "platform-tools" "platforms;android-36" "build-tools;36.0.0"

WORKDIR /app

# Install JS deps
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Generate native Android project if needed
RUN npx expo prebuild --platform android --non-interactive

# Build a debug APK (no signing needed for emulator installs)
RUN cd android && ./gradlew assembleDebug

# Final stage to expose the APK
FROM busybox:1.36
WORKDIR /out
COPY --from=builder /app/android/app/build/outputs/apk/debug/app-debug.apk /out/app-debug.apk
