module.exports = {
  root: true,
  extends: ['expo'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: ['babel-preset-expo'],
    },
  },
  plugins: ['react'],
  rules: {
    // Allow unused variables that start with underscore
    'no-unused-vars': ['warn', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
      'caughtErrorsIgnorePattern': '^_'
    }],
    // Allow console.log in development
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // React specific rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    // Disable some strict rules for React Native development
    'no-use-before-define': ['warn', { 'functions': false, 'classes': true }],
    // Disable import resolution for now (babel module resolver handles this)
    'import/no-unresolved': 'off',
    // Allow imports in the middle of files for React Native
    'import/first': 'warn',
    // Display name warnings
    'react/display-name': 'warn',
    // React hooks warnings
    'react-hooks/exhaustive-deps': 'warn',
  },
  env: {
    'browser': true,
    'es6': true,
    'node': true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'build/',
    '*.config.js',
    'babel.config.js',
  ],
};
