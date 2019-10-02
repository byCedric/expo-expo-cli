import { RuleSetRule, Configuration } from 'webpack';
import merge from 'webpack-merge';
import path from 'path';

import { Arguments, DevConfiguration, InputEnvironment, Environment } from './types';
import * as Diagnosis from './utils/Diagnosis';
import { validateEnvironment } from './utils/validate';
import webpackConfig from './webpack.config.unimodules';

function _findBabelLoader(rules: RuleSetRule[]): RuleSetRule {
  for (const rule of rules) {
    if (
      rule.use &&
      (rule.use as any).loader &&
      ((rule.use as any).loader.includes('/babel-loader') ||
        (rule.use as any).loader.includes('\\babel-loader'))
    ) {
      return rule;
    }
  }
  throw new Error(
    'Cannot find `babel-loader` generated by `webpack.config.unimodules`. It is likely an Expo issue. Please create a new issue at https://github.com/expo/expo-cli.'
  );
}

// Wrap your existing webpack config with support for Unimodules.
// ex: Storybook `({ config }) => withUnimodules(config)`
export default function withUnimodules(
  inputWebpackConfig: DevConfiguration | Configuration = {},
  env: InputEnvironment = {},
  argv: Arguments = {}
): DevConfiguration | Configuration {
  // @ts-ignore: We should attempt to use the project root that the other config is already using (used for Gatsby support).
  env.projectRoot = env.projectRoot || inputWebpackConfig.context;

  // Attempt to use the input webpack config mode
  env.mode = env.mode || inputWebpackConfig.mode;

  const environment: Environment = validateEnvironment(env);

  const config = webpackConfig(environment, argv);

  // We have to transpile these modules and make them not external too.
  // We have to do this because next.js by default externals all `node_modules`'s js files.
  // Reference:
  // https://github.com/martpie/next-transpile-modules/blob/77450a0c0307e4b650d7acfbc18641ef9465f0da/index.js#L48-L62
  // https://github.com/zeit/next.js/blob/0b496a45e85f3c9aa3cf2e77eef10888be5884fc/packages/next/build/webpack-config.ts#L185-L258
  const babelLoader = _findBabelLoader(config.module!.rules);
  // `include` function is from https://github.com/expo/expo-cli/blob/3933f3d6ba65bffec2738ece71b62f2c284bd6e4/packages/webpack-config/webpack/loaders/createBabelLoaderAsync.js#L76-L96
  const includeFunc = babelLoader.include as ((path: string) => boolean);
  if (inputWebpackConfig.externals) {
    inputWebpackConfig.externals = (inputWebpackConfig.externals as any).map((external: any) => {
      if (typeof external !== 'function') return external;
      return (ctx: any, req: any, cb: any) => {
        return includeFunc(path.join('node_modules', req)) ? cb() : external(ctx, req, cb);
      };
    });
  }

  const mixedConfig = merge(config, inputWebpackConfig);

  if (environment.info) {
    Diagnosis.reportAsync(mixedConfig, environment);
  }

  return mixedConfig;
}
