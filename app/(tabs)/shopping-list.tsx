import { ShoppingListFeatureScreen } from '../../src/features/shopping-list/shopping-list-screen';
import { PlaceholderScreen } from '../../src/components/shell/placeholder-screen';

const isShoppingListEnabled = process.env.EXPO_PUBLIC_ENABLE_SHOPPING_LIST !== 'false';

export default function ShoppingListTabRoute() {
  if (!isShoppingListEnabled) {
    return (
      <PlaceholderScreen
        title="Shopping"
        description="Shopping list is temporarily unavailable in this build."
      />
    );
  }

  return <ShoppingListFeatureScreen />;
}
