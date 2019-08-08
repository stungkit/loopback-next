// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect} from '@loopback/testlab';
import {
  DefaultCrudRepository,
  findByForeignKeys,
  HasManyDefinition,
  includeRelatedModels,
  juggler,
  ModelDefinition,
  RelationType,
} from '../../..';
import {model, property} from '../../../decorators';
import {Entity} from '../../../model';
import {
  belongsTo,
  Getter,
  hasMany,
  HasManyRepositoryFactory,
} from '../../../relations';

describe('findByForeignKeys', () => {
  let productRepo: ProductRepository;

  before(() => {
    productRepo = new ProductRepository(testdb);
  });

  beforeEach(async () => {
    await productRepo.deleteAll();
  });

  it('returns an empty array when no foreign keys are passed in', async () => {
    const fkIds: number[] = [];
    await productRepo.create({id: 1, name: 'product', categoryId: 1});
    const products = await findByForeignKeys(productRepo, 'categoryId', fkIds);
    expect(products).to.be.empty();
  });

  it('returns an empty array when no instances have the foreign key value', async () => {
    await productRepo.create({id: 1, name: 'product', categoryId: 1});
    const products = await findByForeignKeys(productRepo, 'categoryId', 2);
    expect(products).to.be.empty();
  });

  it('returns an empty array when no instances have the foreign key values', async () => {
    await productRepo.create({id: 1, name: 'product', categoryId: 1});
    const products = await findByForeignKeys(productRepo, 'categoryId', [2, 3]);
    expect(products).to.be.empty();
  });
  it('returns all instances that have the foreign key value', async () => {
    const pens = await productRepo.create({name: 'pens', categoryId: 1});
    const pencils = await productRepo.create({name: 'pencils', categoryId: 1});
    const products = await findByForeignKeys(productRepo, 'categoryId', 1);
    expect(products).to.deepEqual([pens, pencils]);
  });

  it('does not include instances with different foreign key values', async () => {
    const pens = await productRepo.create({name: 'pens', categoryId: 1});
    const pencils = await productRepo.create({name: 'pencils', categoryId: 2});
    const products = await findByForeignKeys(productRepo, 'categoryId', 1);
    expect(products).to.deepEqual([pens]);
    expect(products).to.not.containDeep(pencils);
  });

  it('includes instances when there is one value in the array of foreign key values', async () => {
    const pens = await productRepo.create({name: 'pens', categoryId: 1});
    const pencils = await productRepo.create({name: 'pencils', categoryId: 2});
    const products = await findByForeignKeys(productRepo, 'categoryId', [2]);
    expect(products).to.deepEqual([pencils]);
    expect(products).to.not.containDeep(pens);
  });
  it('returns all instances that have any of multiple foreign key values', async () => {
    const pens = await productRepo.create({name: 'pens', categoryId: 1});
    const pencils = await productRepo.create({name: 'pencils', categoryId: 2});
    const paper = await productRepo.create({name: 'paper', categoryId: 3});
    const products = await findByForeignKeys(productRepo, 'categoryId', [1, 3]);
    expect(products).to.deepEqual([pens, paper]);
    expect(products).to.not.containDeep(pencils);
  });

  it('throws error if scope is passed in and is non-empty', async () => {
    let errorMessage;
    try {
      await findByForeignKeys(productRepo, 'categoryId', [1], {
        limit: 1,
      });
    } catch (error) {
      errorMessage = error.message;
    }
    expect(errorMessage).to.eql('scope is not supported');
  });

  it('does not throw an error if scope is passed in and is undefined or empty', async () => {
    let products = await findByForeignKeys(
      productRepo,
      'categoryId',
      [1],
      undefined,
      {},
    );
    expect(products).to.be.empty();
    products = await findByForeignKeys(productRepo, 'categoryId', 1, {}, {});
    expect(products).to.be.empty();
  });
  /******************* HELPERS *******************/

  @model()
  class Product extends Entity {
    @property({id: true})
    id: number;
    @property()
    name: string;
    @property()
    categoryId: number;
  }

  class ProductRepository extends DefaultCrudRepository<
    Product,
    typeof Product.prototype.id
  > {
    constructor(dataSource: juggler.DataSource) {
      super(Product, dataSource);
    }
  }

  const testdb: juggler.DataSource = new juggler.DataSource({
    name: 'db',
    connector: 'memory',
  });
});

describe('includeRelatedModels', () => {
  let productRepo: ProductRepository;
  let categoryRepo: CategoryRepository;

  before(() => {
    productRepo = new ProductRepository(testDb);
    categoryRepo = new CategoryRepository(
      testDb,
      Getter.fromValue(productRepo),
    );
    //beforeEach(givenStubbedProductRepo);
    //productRepo = new ProductRepository(testdb);
    //const relationMeta = givenHasManyDefinition();
  });

  beforeEach(async () => {
    await productRepo.deleteAll();
    await categoryRepo.deleteAll();
  });
  /**========= unreliable ========== */
  it('returns source model if no filter passed in', async () => {
    let result;
    await productRepo.create({id: 1, name: 'product1', categoryId: 1});
    await categoryRepo.create({id: 1});
    result = await includeRelatedModels(categoryRepo, [Category]);
    expect(result).to.eql(Category);
  });
  it('throws error if the target repository does not has relations that included in the passed in filter', async () => {
    let errorMessage;
    try {
      //const relationMeta = givenHasManyDefinition();
      await productRepo.create({id: 1, name: 'product1', categoryId: 1});
      await includeRelatedModels(categoryRepo, [Category], {
        include: belongsTo,
      });
    } catch (error) {
      errorMessage = error.message;
    }
    expect(errorMessage).to.eql('INVALID_INCLUSION_FILTER');
  });

  /******************* HELPERS *******************/

  @model()
  class Product extends Entity {
    @property({id: true})
    id: number;
    @property()
    name: string;
    @property()
    categoryId: number;
  }
  interface ProductRelations {
    category?: Category;
  }
  type ProductWithRelations = Product & ProductRelations;

  class ProductRepository extends DefaultCrudRepository<
    Product,
    typeof Product.prototype.id,
    ProductRelations
  > {
    constructor(dataSource: juggler.DataSource) {
      super(Product, dataSource);
    }
  }

  // function givenStubbedProductRepo() {
  //   productRepo = createStubInstance(ProductRepository);
  // }

  @model()
  class Category extends Entity {
    @property({id: true})
    id: number;
    @hasMany(() => Product, {keyTo: 'categoryId'})
    products?: Product[];
  }
  interface CategoryRelations {
    products?: Product[];
  }
  type CategoryWithRelations = Category & CategoryRelations;

  class CategoryRepository extends DefaultCrudRepository<
    Category,
    typeof Category.prototype.id,
    CategoryRelations
  > {
    public readonly products: HasManyRepositoryFactory<
      Product,
      typeof Category.prototype.id
    >;
    constructor(
      dataSource: juggler.DataSource,
      productRepo: Getter<ProductRepository>,
    ) {
      super(Category, dataSource);
      this.products = this.createHasManyRepositoryFactoryFor(
        'products',
        productRepo,
      );
    }
  }

  const testDb: juggler.DataSource = new juggler.DataSource({
    name: 'db',
    connector: 'memory',
  });

  function givenHasManyDefinition(
    props?: Partial<HasManyDefinition>,
  ): HasManyDefinition {
    class Category extends Entity {
      static definition = new ModelDefinition('Category').addProperty('id', {
        type: Number,
        id: true,
      });
      id: number;
    }

    const defaults: HasManyDefinition = {
      type: RelationType.hasMany,
      targetsMany: true,
      name: 'products',
      target: () => Product,
      source: Category,
    };

    return Object.assign(defaults, props);
  }
});
