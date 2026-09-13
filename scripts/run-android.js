const { execSync, spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const isWindows = os.platform() === 'win32';

function run() {
  let virtualDrive = null;

  try {
    if (isWindows && projectRoot.length > 60) {
      // Find an available drive letter using Node's fs
      for (const letter of ['Y', 'Z', 'X', 'W', 'V']) {
        try {
          if (!fs.existsSync(`${letter}:\\`)) {
            virtualDrive = `${letter}:`;
            break;
          }
        } catch (_) {}
      }

      if (virtualDrive) {
        console.log(`[CallTracker] Long Windows path detected (${projectRoot.length} chars).`);
        console.log(`[CallTracker] Temporarily mapping ${virtualDrive} to shorten C++ build paths...`);
        execSync(`subst ${virtualDrive} "${projectRoot}"`, { stdio: 'inherit' });

        const gradlewPath = path.join(virtualDrive, 'android', 'gradlew.bat');
        console.log(`[CallTracker] Building and installing debug APK...`);
        execSync(`"${gradlewPath}" -p "${path.join(virtualDrive, 'android')}" app:installDebug`, {
          stdio: 'inherit',
          cwd: path.join(virtualDrive, 'android'),
        });
      }
    }

    if (!virtualDrive) {
      console.log(`[CallTracker] Building via standard react-native run-android...`);
      execSync('npx react-native run-android --no-packager', {
        stdio: 'inherit',
        cwd: projectRoot,
      });
    }

    // Launch the app on the connected device and set up adb reverse
    try {
      console.log('[CallTracker] Starting app on device...');
      execSync('adb reverse tcp:8081 tcp:8081', { stdio: 'ignore' });
      execSync('adb shell am start -n com.calltracker/.MainActivity', { stdio: 'ignore' });
    } catch (_) {}

    console.log('[CallTracker] Build and installation successful! Starting Metro...');
    const metro = spawn('npx', ['react-native', 'start'], {
      stdio: 'inherit',
      cwd: projectRoot,
      shell: true,
    });
    metro.on('exit', code => process.exit(code || 0));
  } catch (err) {
    console.error('[CallTracker] Build failed:', err.message);
    process.exit(1);
  } finally {
    if (virtualDrive) {
      try {
        execSync(`subst ${virtualDrive} /D`, { stdio: 'ignore' });
        console.log(`[CallTracker] Cleaned up temporary drive ${virtualDrive}.`);
      } catch (_) {}
    }
  }
}

run();
