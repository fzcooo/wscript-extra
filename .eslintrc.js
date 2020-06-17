module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  globals: {
    REM: 'writable',
    WScript: 'readonly',
    GetObject: 'readonly',
    ActiveXObject: 'readonly',
    VBArray: 'readonly',
    Enumerator: 'readonly',
    ScriptEngine: 'readonly',
    ScriptEngineMajorVersion: 'readonly',
    ScriptEngineMinorVersion: 'readonly',
    ScriptEngineBuildVersion: 'readonly',
    __WShell: 'readonly',
    __VBS: 'readonly',
    __ShellApp: 'readonly',
    __FSO: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'prettier/prettier': ['error', { singleQuote: true }],
  },
};
