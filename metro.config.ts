import { getDefaultConfig } from "expo/metro-config";
import type { MetroConfig } from "metro-config";

const defaultConfig = getDefaultConfig(__dirname);

const config: MetroConfig = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    sourceExts: [...defaultConfig.resolver.sourceExts, "ts", "tsx", "js", "jsx"],
  },
  transformer: {
    ...defaultConfig.transformer,
    minifierConfig: {
      keep_classnames: false,
      keep_fnames: false,
      mangle: { toplevel: true },
      compress: {
        unused: true,
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
};

export default config;
