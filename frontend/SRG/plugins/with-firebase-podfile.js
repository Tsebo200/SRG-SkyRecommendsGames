const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to fix Firebase Swift pods integration
 * Adds use_modular_headers! and use_frameworks! :linkage => :static to Podfile
 */
const withFirebasePodfile = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (!fs.existsSync(podfilePath)) {
        console.warn('Podfile not found, skipping Firebase Podfile modifications');
        return config;
      }

      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      // Check if we've already modified this Podfile
      if (podfileContent.includes('# Firebase modular headers fix')) {
        console.log('Podfile already has Firebase fixes applied');
        return config;
      }

      // Force use_modular_headers! - add it right after platform declaration
      // First, remove any existing use_modular_headers! to avoid duplicates
      podfileContent = podfileContent.replace(/^\s*use_modular_headers!\s*$/m, '');
      
      // Find platform line and add use_modular_headers! right after it
      // Look for pattern: platform :ios, '15.1' or platform :ios, "15.1"
      const platformRegex = /(platform :ios, (?:podfile_properties\[['"]ios\.deploymentTarget['"]\] \|\| )?['"]\d+\.\d+['"])/;
      const platformMatch = podfileContent.match(platformRegex);
      if (platformMatch) {
        // Add use_modular_headers! right after the platform line
        podfileContent = podfileContent.replace(
          platformMatch[0],
          `${platformMatch[0]}\nuse_modular_headers!`
        );
      } else {
        // Fallback: add after prepare_react_native_project! if platform pattern doesn't match
        podfileContent = podfileContent.replace(
          /(prepare_react_native_project!\n)/,
          `$1use_modular_headers!\n`
        );
      }

      // Ensure use_frameworks! :linkage => :static is present
      // Check if there's already a use_frameworks! line (might be conditional)
      if (!podfileContent.match(/^\s*use_frameworks!\s*:linkage\s*=>\s*:static\s*$/m)) {
        // Add after use_modular_headers!
        podfileContent = podfileContent.replace(
          /(use_modular_headers!\n)/,
          `$1use_frameworks! :linkage => :static\n`
        );
      }

      // Find or create post_install hook
      // Note: Use 'build_config' instead of 'config' to avoid conflict with use_native_modules! config variable
      const postInstallHook = `    # Firebase modular headers fix - enable for ALL targets
    target.build_configurations.each do |build_config|
      build_config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      build_config.build_settings['DEFINES_MODULE'] = 'YES'
    end
    
    # Firebase Swift pods specific configuration
    firebase_deps = ['FirebaseAuth', 'FirebaseCore', 'FirebaseCoreInternal', 'FirebaseAuthInterop', 
                      'FirebaseAppCheckInterop', 'FirebaseCoreExtension', 'GoogleUtilities', 'RecaptchaInterop',
                      'RNFBApp', 'RNFBAuth', 'GTMSessionFetcher']
    if firebase_deps.any? { |dep| target.name.include?(dep) }
      target.build_configurations.each do |build_config|
        build_config.build_settings['SWIFT_VERSION'] = '5.0'
        build_config.build_settings['DEFINES_MODULE'] = 'YES'
      end
    end
`;

      // Check if post_install already exists
      if (podfileContent.includes('post_install do |installer|')) {
        // Check if our fix is already there
        if (!podfileContent.includes('# Firebase modular headers fix')) {
          // Find the targets.each block and add our code inside it
          if (podfileContent.includes('installer.pods_project.targets.each do |target|')) {
            // Insert our code right after the targets.each line
            podfileContent = podfileContent.replace(
              /(installer\.pods_project\.targets\.each do \|target\|\n)/,
              `$1${postInstallHook}`
            );
          } else {
            // Add the targets.each block with our modifications
            podfileContent = podfileContent.replace(
              /(post_install do \|installer\|\n)/,
              `$1  installer.pods_project.targets.each do |target|\n${postInstallHook}  end\n`
            );
          }
        }
      } else {
        // Create new post_install hook at the end
        const newPostInstall = `
post_install do |installer|
  installer.pods_project.targets.each do |target|
${postInstallHook}  end
end
`;
        podfileContent += newPostInstall;
      }

      fs.writeFileSync(podfilePath, podfileContent, 'utf8');
      console.log('✅ Applied Firebase Podfile fixes');

      return config;
    },
  ]);
};

module.exports = withFirebasePodfile;
