import nextConfig from "eslint-config-next/core-web-vitals";

export default [
  ...nextConfig,
  {
    rules: {
      // Disabling: valid pattern for controlled form state initialization from props
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
