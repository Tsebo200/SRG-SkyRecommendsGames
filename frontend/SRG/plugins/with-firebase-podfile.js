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

      // Add use_modular_headers! after platform declaration if not present
      if (!podfileContent.includes('use_modular_headers!')) {
        // Find the platform line and add use_modular_headers! after it
        podfileContent = podfileContent.replace(
          /(platform :ios, ['"]\d+\.\d+['"])/,
          `$1\nuse_modular_headers!`
        );
      }

      // Add use_frameworks! :linkage => :static if not present
      if (!podfileContent.includes('use_frameworks!')) {
        // Add after use_modular_headers!
        podfileContent = podfileContent.replace(
          /(use_modular_headers!)/,
          `$1\nuse_frameworks! :linkage => :static`
        );
      }

      // Find or create post_install hook
      const postInstallHook = `    # Firebase modular headers fix
    config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
    
    # Firebase Swift pods configuration
    if target.name.start_with?('RNFB') || target.name.start_with?('Firebase')
      config.build_settings['DEFINES_MODULE'] = 'YES'
      config.build_settings['SWIFT_VERSION'] = '5.0'
    end
`;

      // Check if post_install already exists
      if (podfileContent.includes('post_install do |installer|')) {
        // Find the installer.pods_project.targets.each block and add our code
        if (podfileContent.includes('installer.pods_project.targets.each do |target|')) {
          // Add our modifications inside the targets.each block
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
      } else {
        // Create new post_install hook
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
