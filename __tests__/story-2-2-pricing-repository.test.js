/* eslint-env jest */

describe('Story 2.2 pricing repository', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('stamps captured timestamp automatically during save (AC3)', async () => {
    const transaction = jest.fn();
    jest.doMock('../src/db/client', () => ({
      db: {
        transaction,
      },
    }));

    const fixedNow = 1772056800000;
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const { saveStorePrice } = require('../src/db/repositories/pricing-repository');

    let selectCall = 0;
    let productConflictSet;
    const tx = {
      select: jest.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () => {
              selectCall += 1;
              if (selectCall === 1) {
                return [{ id: 9, isActive: true }];
              }

              if (selectCall === 2) {
                return [];
              }

              return [
                {
                  barcode: '0123456789012',
                  name: 'Milk',
                  createdAt: fixedNow,
                  updatedAt: fixedNow,
                },
              ];
            },
          }),
        }),
      })),
      insert: jest
        .fn()
        .mockImplementationOnce(() => ({
          values: () => ({
            onConflictDoUpdate: async () => undefined,
          }),
        }))
        .mockImplementationOnce(() => {
          let insertedValues;

          return {
            values: (values) => {
              insertedValues = values;

              return {
                onConflictDoUpdate: () => ({
                  returning: async () => [
                    {
                      id: 1,
                      storeId: 9,
                      productBarcode: '0123456789012',
                      priceCents: 429,
                      capturedAt: insertedValues.capturedAt,
                      createdAt: insertedValues.createdAt,
                      updatedAt: insertedValues.updatedAt,
                    },
                  ],
                }),
              };
            },
          };
        }),
    };

    transaction.mockImplementation(async (callback) => callback(tx));

    const result = await saveStorePrice({
      barcode: '0123456789012',
      storeId: 9,
      priceCents: 429,
      productName: 'Milk',
    });

    expect(result.capturedAt).toBe(fixedNow);
    expect(result.updatedAt).toBe(fixedNow);
    expect(result.priceCents).toBe(429);
    expect(transaction).toHaveBeenCalledTimes(1);

    Date.now.mockRestore();
  });

  it('rejects saving a price for a store that does not exist (AI-Review)', async () => {
    const transaction = jest.fn();
    jest.doMock('../src/db/client', () => ({
      db: {
        transaction,
      },
    }));

    const { PricingValidationError } = require('../src/db/validation/pricing');
    const { saveStorePrice } = require('../src/db/repositories/pricing-repository');

    const tx = {
      select: jest.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
        }),
      })),
      insert: jest.fn(),
    };

    transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      saveStorePrice({
        barcode: '0123456789012',
        storeId: 999,
        priceCents: 199,
        productName: 'Test Product',
      })
    ).rejects.toMatchObject({
      name: 'PricingValidationError',
      issues: expect.arrayContaining([
        expect.objectContaining({
          message: 'store does not exist',
          path: ['storeId'],
        }),
      ]),
    });

    expect(tx.insert).not.toHaveBeenCalled();
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(PricingValidationError).toBeDefined();
  });

  it('rejects saving a price for a store that is inactive (AI-Review)', async () => {
    const transaction = jest.fn();
    jest.doMock('../src/db/client', () => ({
      db: {
        transaction,
      },
    }));

    const { saveStorePrice } = require('../src/db/repositories/pricing-repository');

    const tx = {
      select: jest.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () => [{ id: 9, isActive: false }],
          }),
        }),
      })),
      insert: jest.fn(),
    };

    transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      saveStorePrice({
        barcode: '0123456789012',
        storeId: 9,
        priceCents: 199,
        productName: 'Test Product',
      })
    ).rejects.toMatchObject({
      name: 'PricingValidationError',
      issues: expect.arrayContaining([
        expect.objectContaining({
          message: 'store is inactive',
          path: ['storeId'],
        }),
      ]),
    });

    expect(tx.insert).not.toHaveBeenCalled();
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('preserves capturedAt when only product name changes and price is unchanged (AI-Review)', async () => {
    const transaction = jest.fn();
    jest.doMock('../src/db/client', () => ({
      db: {
        transaction,
      },
    }));

    const fixedNow = 1772056800000;
    const existingCapturedAt = 1772000000000;
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const { saveStorePrice } = require('../src/db/repositories/pricing-repository');

    let selectCall = 0;
    const tx = {
      select: jest.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () => {
              selectCall += 1;

              if (selectCall === 1) {
                return [{ id: 9, isActive: true }];
              }

              if (selectCall === 2) {
                return [
                  {
                    barcode: '0123456789012',
                    name: 'Milk',
                    createdAt: existingCapturedAt,
                    updatedAt: existingCapturedAt,
                  },
                ];
              }

              if (selectCall === 3) {
                return [
                  {
                    id: 42,
                    storeId: 9,
                    productBarcode: '0123456789012',
                    priceCents: 429,
                    capturedAt: existingCapturedAt,
                    createdAt: existingCapturedAt,
                    updatedAt: existingCapturedAt,
                  },
                ];
              }

              return [
                {
                  barcode: '0123456789012',
                  name: 'Whole Milk',
                  createdAt: existingCapturedAt,
                  updatedAt: fixedNow,
                },
              ];
            },
          }),
        }),
      })),
      insert: jest
        .fn()
        .mockImplementationOnce(() => ({
          values: () => ({
            onConflictDoUpdate: async () => undefined,
          }),
        }))
        .mockImplementationOnce(() => {
          let insertedValues;
          let conflictUpdateSet;

          return {
            values: (values) => {
              insertedValues = values;

              return {
                onConflictDoUpdate: ({ set }) => {
                  conflictUpdateSet = set;

                  return {
                    returning: async () => [
                      {
                        id: 42,
                        storeId: 9,
                        productBarcode: '0123456789012',
                        priceCents: 429,
                        capturedAt: conflictUpdateSet.capturedAt,
                        createdAt: insertedValues.createdAt,
                        updatedAt: conflictUpdateSet.updatedAt,
                      },
                    ],
                  };
                },
              };
            },
          };
        }),
    };

    transaction.mockImplementation(async (callback) => callback(tx));

    const result = await saveStorePrice({
      barcode: '0123456789012',
      storeId: 9,
      priceCents: 429,
      productName: 'Whole Milk',
    });

    expect(result.capturedAt).toBe(existingCapturedAt);
    expect(result.updatedAt).toBe(fixedNow);
    expect(result.productName).toBe('Whole Milk');

    Date.now.mockRestore();
  });

  it('does not bump products.updatedAt when product metadata is unchanged (AI-Review)', async () => {
    const transaction = jest.fn();
    jest.doMock('../src/db/client', () => ({
      db: {
        transaction,
      },
    }));

    const fixedNow = 1772056800000;
    const existingUpdatedAt = 1772000000000;
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const { saveStorePrice } = require('../src/db/repositories/pricing-repository');

    let selectCall = 0;
    let productConflictSet;
    const tx = {
      select: jest.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () => {
              selectCall += 1;

              if (selectCall === 1) {
                return [{ id: 9, isActive: true }];
              }

              if (selectCall === 2) {
                return [
                  {
                    barcode: '0123456789012',
                    name: 'Milk',
                    createdAt: existingUpdatedAt,
                    updatedAt: existingUpdatedAt,
                  },
                ];
              }

              if (selectCall === 3) {
                return [
                  {
                    id: 42,
                    storeId: 9,
                    productBarcode: '0123456789012',
                    priceCents: 429,
                    capturedAt: existingUpdatedAt,
                    createdAt: existingUpdatedAt,
                    updatedAt: existingUpdatedAt,
                  },
                ];
              }

              return [
                {
                  barcode: '0123456789012',
                  name: 'Milk',
                  createdAt: existingUpdatedAt,
                  updatedAt: existingUpdatedAt,
                },
              ];
            },
          }),
        }),
      })),
      insert: jest
        .fn()
        .mockImplementationOnce(() => ({
          values: () => ({
            onConflictDoUpdate: ({ set }) => {
              productConflictSet = set;
              return Promise.resolve(undefined);
            },
          }),
        }))
        .mockImplementationOnce(() => ({
          values: (values) => ({
            onConflictDoUpdate: ({ set }) => ({
              returning: async () => [
                {
                  id: 42,
                  storeId: 9,
                  productBarcode: '0123456789012',
                  priceCents: 429,
                  capturedAt: set.capturedAt,
                  createdAt: values.createdAt,
                  updatedAt: set.updatedAt,
                },
              ],
            }),
          }),
        })),
    };

    transaction.mockImplementation(async (callback) => callback(tx));

    await saveStorePrice({
      barcode: '0123456789012',
      storeId: 9,
      priceCents: 429,
    });

    expect(tx.insert).toHaveBeenCalledTimes(2);
    expect(Date.now).toHaveBeenCalled();
    expect(productConflictSet?.updatedAt).toBe(existingUpdatedAt);

    Date.now.mockRestore();
  });
});
