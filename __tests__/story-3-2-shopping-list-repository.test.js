/* eslint-env jest */

describe('Story 3.2 shopping list repository', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('increments quantity when barcode already exists (AC1)', async () => {
    const transaction = jest.fn();
    jest.doMock('../src/db/client', () => ({
      db: {
        transaction,
      },
    }));

    const fixedNow = 1772143000000;
    const existingCreatedAt = 1772140000000;
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const { addOrIncrementShoppingListItem } = require('../src/db/repositories/shopping-list-repository');

    let selectCall = 0;
    let conflictSet;
    const tx = {
      select: jest.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () => {
              selectCall += 1;
              if (selectCall === 1) {
                return [
                  {
                    barcode: '0123456789012',
                    name: 'Milk',
                    createdAt: existingCreatedAt,
                    updatedAt: existingCreatedAt,
                  },
                ];
              }
              if (selectCall === 2) {
                return [
                  {
                    productBarcode: '0123456789012',
                    productName: 'Milk',
                    quantity: 2,
                    isChecked: true,
                    createdAt: existingCreatedAt,
                    updatedAt: existingCreatedAt,
                  },
                ];
              }
              return [];
            },
          }),
        }),
      })),
      insert: jest.fn(() => ({
        values: (values) => ({
          onConflictDoUpdate: ({ set }) => {
            conflictSet = set;
            return {
              returning: async () => [
                {
                  productBarcode: values.productBarcode,
                  productName: values.productName ?? null,
                  quantity: set.quantity,
                  isChecked: values.isChecked,
                  createdAt: values.createdAt,
                  updatedAt: set.updatedAt,
                },
              ],
            };
          },
        }),
      })),
      update: jest.fn(() => ({
        set: () => ({
          where: async () => {},
        }),
      })),
    };

    transaction.mockImplementation(async (callback) => callback(tx));

    const result = await addOrIncrementShoppingListItem({
      barcode: '0123456789012',
      quantity: 3,
    });

    expect(conflictSet).toMatchObject({
      quantity: 5,
      updatedAt: fixedNow,
    });
    expect(result.quantity).toBe(5);
    expect(result.createdAt).toBe(existingCreatedAt);
    expect(result.isChecked).toBe(true);

    Date.now.mockRestore();
  });

  it('sets explicit quantity for a list item (AC2)', async () => {
    const update = jest.fn(() => ({
      set: () => ({
        where: () => ({
          returning: async () => [
            {
              productBarcode: '0123456789012',
              productName: 'Milk',
              quantity: 4,
              isChecked: false,
              createdAt: 1772140000000,
              updatedAt: 1772144000000,
            },
          ],
        }),
      }),
    }));

    const select = jest.fn(() => ({
      from: () => ({
        where: () => ({
          limit: async () => [
            {
              barcode: '0123456789012',
              name: 'Milk',
              createdAt: 1772140000000,
              updatedAt: 1772140000000,
            },
          ],
        }),
      }),
    }));

    jest.doMock('../src/db/client', () => ({
      db: {
        update,
        select,
      },
    }));

    const { setShoppingListItemQuantity } = require('../src/db/repositories/shopping-list-repository');

    const result = await setShoppingListItemQuantity({
      barcode: '0123456789012',
      quantity: 4,
    });

    expect(result).toMatchObject({
      barcode: '0123456789012',
      productName: 'Milk',
      quantity: 4,
    });
  });

  it('toggles checked state for a list item (AC2)', async () => {
    const update = jest.fn(() => ({
      set: () => ({
        where: () => ({
          returning: async () => [
            {
              productBarcode: '555',
              productName: 'Peppers',
              quantity: 1,
              isChecked: true,
              createdAt: 1772140000000,
              updatedAt: 1772145000000,
            },
          ],
        }),
      }),
    }));

    const select = jest.fn(() => ({
      from: () => ({
        where: () => ({
          limit: async () => [
            {
              barcode: '555',
              name: 'Peppers',
              createdAt: 1772140000000,
              updatedAt: 1772140000000,
            },
          ],
        }),
      }),
    }));

    jest.doMock('../src/db/client', () => ({
      db: {
        update,
        select,
      },
    }));

    const { toggleShoppingListItemChecked } = require('../src/db/repositories/shopping-list-repository');

    const result = await toggleShoppingListItemChecked({
      barcode: '555',
      isChecked: true,
    });

    expect(result).toMatchObject({
      barcode: '555',
      productName: 'Peppers',
      isChecked: true,
    });
  });

  it('rejects invalid quantity updates (AC2)', async () => {
    const { setShoppingListItemQuantity } = require('../src/db/repositories/shopping-list-repository');
    const { ShoppingListValidationError } = require('../src/db/validation/shopping-list');

    await expect(
      setShoppingListItemQuantity({ barcode: '0123456789012', quantity: 0 })
    ).rejects.toThrow(ShoppingListValidationError);
  });
});
