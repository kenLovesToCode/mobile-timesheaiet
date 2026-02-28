const appJson = require('./app.json');

const routerRoot = process.env.PRICETAG_ROUTER_ROOT;
const baseExpoConfig = appJson.expo;

function withRouterPluginRoot(plugins) {
  return (plugins ?? []).map((plugin) => {
    if (plugin === 'expo-router') {
      return routerRoot ? ['expo-router', { root: routerRoot }] : plugin;
    }

    if (Array.isArray(plugin) && plugin[0] === 'expo-router') {
      const [, options] = plugin;
      return ['expo-router', { ...(options ?? {}), ...(routerRoot ? { root: routerRoot } : {}) }];
    }

    return plugin;
  });
}

function withRequiredPlugins(plugins) {
  const nextPlugins = [...(plugins ?? [])];
  if (!nextPlugins.some((plugin) => plugin === 'expo-sharing' || (Array.isArray(plugin) && plugin[0] === 'expo-sharing'))) {
    nextPlugins.push('expo-sharing');
  }
  return nextPlugins;
}

module.exports = {
  expo: {
    ...baseExpoConfig,
    plugins: withRequiredPlugins(withRouterPluginRoot(baseExpoConfig.plugins)),
  },
};
