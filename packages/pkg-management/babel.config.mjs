export default function (api) {
  api.cache(true);

  const plugins = ["@babel/plugin-proposal-explicit-resource-management"];

  return {
    plugins,
    sourceMaps: true,
  };
}
