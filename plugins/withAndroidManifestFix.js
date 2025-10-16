const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Add android:appComponentFactory with AndroidX value to fix Support Library conflicts
 */
module.exports = function withAndroidManifestFix(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    
    // Find the application element
    const application = androidManifest.manifest.application?.[0];
    
    if (application) {
      // Ensure $ exists for attributes
      if (!application.$) {
        application.$ = {};
      }
      
      // Add tools namespace if not present
      if (!androidManifest.manifest.$) {
        androidManifest.manifest.$ = {};
      }
      if (!androidManifest.manifest.$['xmlns:tools']) {
        androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
      }
      
      // Set appComponentFactory to AndroidX version
      application.$['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';
      
      // Add tools:replace for appComponentFactory
      const existingReplace = application.$['tools:replace'];
      if (existingReplace) {
        // Add to existing tools:replace if appComponentFactory not already there
        if (!existingReplace.includes('android:appComponentFactory')) {
          application.$['tools:replace'] = `${existingReplace},android:appComponentFactory`;
        }
      } else {
        application.$['tools:replace'] = 'android:appComponentFactory';
      }
    }
    
    return config;
  });
};

