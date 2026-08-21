const expoConfig = require("eslint-config-expo/flat");
const {defineConfig} = require("eslint/config");

module.exports = defineConfig([
    {
        ignores: [".expo/**", ".phase7-test-build/**", "node_modules/**", "assets/**", "vendor/**"],
    },
    expoConfig,
    {
        rules: {
            "react/react-in-jsx-scope": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "react-hooks/exhaustive-deps": "off",
            "react-hooks/immutability": "off",
            "react-hooks/set-state-in-effect": "off",
        },
    },
]);
