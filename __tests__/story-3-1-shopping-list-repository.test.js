/* eslint-env jest */

describe('Story 3.1 shopping list repository', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('adds an item with quantity and default unchecked state (AC1)', async () => {
    const transaction = jest.fn();
    jest.doMock('../src/db/client', () => ({
      db: {
        transaction,
      },
    }));

    const fixedNow = 1772140000000;
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const { addOrUpdateShoppingListItem } = require('../src/db/repositories/shopping-list-repository');

    let selectCall = 0;
    let insertCall = 0;
    const tx = {
      select: jest.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () => {
              selectCall += 1;
              return [];
            },
          }),
        }),
      })),
      insert: jest.fn(() => {
        insertCall += 1;
        if (insertCall === 1) {
          return {
            values: () => ({
              onConflictDoNothing: () => ({}),
            }),
          };
        }

        return {
          values: (values) => ({
            onConflictDoUpdate: () => ({
              returning: async () => [
                {
                  productBarcode: values.productBarcode,
                  productName: values.productName ?? null,
                  quantity: values.quantity,
                  isChecked: values.isChecked,
                  createdAt: values.createdAt,
                  updatedAt: values.updatedAt,
                },
              ],
            }),
          }),
        };
      }),
      update: jest.fn(() => ({
        set: () => ({
          where: async () => {},
        }),
      })),
    };

    transaction.mockImplementation(async (callback) => callback(tx));

    const result = await addOrUpdateShoppingListItem({
      barcode: '0123456789012',
      quantity: 3,
    });

    expect(result).toMatchObject({
      barcode: '0123456789012',
      productName: null,
      quantity: 3,
      isChecked: false,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

    Date.now.mockRestore();
  });

  it('overwrites quantity when barcode already exists (AC1)', async () => {
    const transaction = jest.fn();
    jest.doMock('../src/db/client', () => ({
      db: {
        transaction,
      },
    }));

    const fixedNow = 1772141000000;
    const existingCreatedAt = 1772140000000;
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const { addOrUpdateShoppingListItem } = require('../src/db/repositories/shopping-list-repository');

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
                    quantity: 1,
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
                  quantity: conflictSet.quantity,
                  isChecked: values.isChecked,
                  createdAt: values.createdAt,
                  updatedAt: conflictSet.updatedAt,
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

    const result = await addOrUpdateShoppingListItem({
      barcode: '0123456789012',
      quantity: 5,
    });

    expect(conflictSet).toMatchObject({
      quantity: 5,
      updatedAt: fixedNow,
    });
    expect(result.quantity).toBe(5);
    expect(result.createdAt).toBe(existingCreatedAt);
    expect(result.isChecked).toBe(true);
    expect(result.productName).toBe('Milk');

    Date.now.mockRestore();
  });

  it('prefers list item product name when product row is empty', async () => {
    const transaction = jest.fn();
    jest.doMock('../src/db/client', () => ({
      db: {
        transaction,
      },
    }));

    const fixedNow = 1772142000000;
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const { addOrUpdateShoppingListItem } = require('../src/db/repositories/shopping-list-repository');

    let selectCall = 0;
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
                    name: null,
                    createdAt: fixedNow,
                    updatedAt: fixedNow,
                  },
                ];
              }
              if (selectCall === 2) {
                return [
                  {
                    productBarcode: '0123456789012',
                    productName: 'Oat Milk',
                    quantity: 1,
                    isChecked: false,
                    createdAt: fixedNow,
                    updatedAt: fixedNow,
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
          onConflictDoUpdate: () => ({
            returning: async () => [
              {
                productBarcode: values.productBarcode,
                productName: values.productName ?? null,
                quantity: values.quantity,
                isChecked: values.isChecked,
                createdAt: values.createdAt,
                updatedAt: values.updatedAt,
              },
            ],
          }),
        }),
      })),
      update: jest.fn(() => ({
        set: () => ({
          where: async () => {},
        }),
      })),
    };

    transaction.mockImplementation(async (callback) => callback(tx));

    const result = await addOrUpdateShoppingListItem({
      barcode: '0123456789012',
      quantity: 2,
    });

    expect(result.productName).toBe('Oat Milk');

    Date.now.mockRestore();
  });

  it('lists items with product names when available (AC2)', async () => {
    const select = jest.fn(() => ({
      from: () => ({
        leftJoin: () => ({
          orderBy: async () => [
            {
              productBarcode: '0123456789012',
              quantity: 2,
              isChecked: false,
              createdAt: 1772140000000,
              updatedAt: 1772140500000,
              productName: 'Milk',
            },
            {
              productBarcode: '998877665544',
              quantity: 1,
              isChecked: false,
              createdAt: 1772140000001,
              updatedAt: 1772140500001,
              productName: null,
            },
          ],
        }),
      }),
    }));

    jest.doMock('../src/db/client', () => ({
      db: {
        select,
      },
    }));

    const { listShoppingListItems } = require('../src/db/repositories/shopping-list-repository');

    const items = await listShoppingListItems();

    expect(items).toEqual([
      {
        barcode: '0123456789012',
        productName: 'Milk',
        quantity: 2,
        isChecked: false,
        createdAt: 1772140000000,
        updatedAt: 1772140500000,
      },
      {
        barcode: '998877665544',
        productName: null,
        quantity: 1,
        isChecked: false,
        createdAt: 1772140000001,
        updatedAt: 1772140500001,
      },
    ]);
  });

  it('prefers product name from products table when available', async () => {
    const select = jest.fn(() => ({
      from: () => ({
        leftJoin: () => ({
          orderBy: async () => [
            {
              productBarcode: '0123456789012',
              quantity: 2,
              isChecked: false,
              createdAt: 1772140000000,
              updatedAt: 1772140500000,
              productName: 'Canonical Milk',
            },
          ],
        }),
      }),
    }));

    jest.doMock('../src/db/client', () => ({
      db: {
        select,
      },
    }));

    const { listShoppingListItems } = require('../src/db/repositories/shopping-list-repository');

    const items = await listShoppingListItems();

    expect(items[0]?.productName).toBe('Canonical Milk');
  });
});
