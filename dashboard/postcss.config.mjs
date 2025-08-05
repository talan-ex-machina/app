import postcssColorFunction from 'postcss-color-function';
import postcssCustomProperties from 'postcss-custom-properties';

const config = {
  plugins: [
    "@tailwindcss/postcss",
    postcssColorFunction,
    postcssCustomProperties,
    {
      postcssPlugin: 'html2canvas-color-fix',
      Declaration: {
        color: (decl) => {
          if (decl.value.includes('color(')) {
            // Convert color() to rgb() or hex
            decl.value = decl.value.replace(
              /color\(([^)]+)\)/g,
              (match, args) => {
                // Convert to a supported format
                return `rgb(128, 128, 128)`; // Fallback color
              }
            );
          }
        }
      }
    }
  ],
};

export default config;
