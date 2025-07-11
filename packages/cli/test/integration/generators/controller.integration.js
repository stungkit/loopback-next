// Copyright IBM Corp. and LoopBack contributors 2018,2020. All Rights Reserved.
// Node module: @loopback/cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const path = require('path');
const assert = require('yeoman-assert');
const testlab = require('@loopback/testlab');

const expect = testlab.expect;
const TestSandbox = testlab.TestSandbox;

const ControllerGenerator = require('../../../generators/controller');
const generator = path.join(__dirname, '../../../generators/controller');
const tests = require('../lib/artifact-generator')(generator);
const baseTests = require('../lib/base-generator')(generator);
const testUtils = require('../../test-utils');

const {expectFileToMatchSnapshot} = require('../../snapshots');

// Test Sandbox
const sandbox = new TestSandbox(path.resolve(__dirname, '../.sandbox'));

// CLI Inputs
const defaultCLIInput = {
  name: 'productReview',
};
const basicCLIInput = {
  name: 'productReview',
  controllerType: 'ControllerGenerator.BASIC',
};
const restCLIInput = {
  name: 'productReview',
  controllerType: ControllerGenerator.REST,
  id: 'productId',
  idType: 'number',
};

// Expected File Name
const filePath = path.join(
  sandbox.path,
  '/src/controllers/product-review.controller.ts',
);

// Base Tests
describe('controller-generator extending BaseGenerator', baseTests);
describe('generator-loopback4:controller', tests);

describe('lb4 controller', () => {
  beforeEach('reset sandbox', () => sandbox.reset());

  it('does not run without package.json', () => {
    return expect(
      testUtils
        .executeGenerator(generator)
        .inDir(sandbox.path, () =>
          testUtils.givenLBProject(sandbox.path, {excludePackageJSON: true}),
        )
        .withPrompts(defaultCLIInput),
    ).to.be.rejectedWith(/No package.json found in/);
  });

  it('does not run without "@loopback/core" as a dependency', () => {
    return expect(
      testUtils
        .executeGenerator(generator)
        .inDir(sandbox.path, () =>
          testUtils.givenLBProject(sandbox.path, {excludeLoopbackCore: true}),
        )
        .withPrompts(defaultCLIInput),
    ).to.be.rejectedWith(/No `@loopback\/core` package found/);
  });

  describe('basic controller', () => {
    it('scaffolds correct file with input', async () => {
      await testUtils
        .executeGenerator(generator)
        .inDir(sandbox.path, () => testUtils.givenLBProject(sandbox.path))
        .withPrompts(defaultCLIInput);

      checkBasicContents();
    });

    it('scaffolds correct file with controllerType BASIC specified explicitly', async () => {
      await testUtils
        .executeGenerator(generator)
        .inDir(sandbox.path, () => testUtils.givenLBProject(sandbox.path))
        .withPrompts(basicCLIInput);

      checkBasicContents();
    });

    it('scaffolds correct file with args', async () => {
      await testUtils
        .executeGenerator(generator)
        .inDir(sandbox.path, () => testUtils.givenLBProject(sandbox.path))
        .withArguments('productReview');

      assert.file(filePath);
      checkBasicContents();
    });
  });

  describe('REST CRUD controller', () => {
    const restCLIInputComplete = Object.assign(
      {},
      {
        modelName: 'ProductReview',
        repositoryName: 'BarRepository',
      },
      restCLIInput,
    );

    it('creates REST CRUD template with valid input - id omitted', async () => {
      await testUtils
        .executeGenerator(generator)
        .inDir(sandbox.path, () =>
          testUtils.givenLBProject(sandbox.path, {
            includeDummyModel: true,
            includeDummyRepository: true,
          }),
        )
        .withPrompts(restCLIInputComplete);

      checkRestCrudContents({idOmitted: true});
    });

    it('creates REST CRUD template with valid input', async () => {
      await testUtils
        .executeGenerator(generator)
        .inDir(sandbox.path, () =>
          testUtils.givenLBProject(sandbox.path, {
            includeDummyModel: true,
            includeDummyRepository: true,
          }),
        )
        .withPrompts(
          Object.assign({}, restCLIInputComplete, {idOmitted: false}),
        );

      checkRestCrudContents({idOmitted: false});
    });

    describe('HTTP REST path', () => {
      it('defaults correctly', async () => {
        await testUtils
          .executeGenerator(generator)
          .inDir(sandbox.path, () =>
            testUtils.givenLBProject(sandbox.path, {
              includeDummyModel: true,
              includeDummyRepository: true,
            }),
          )
          .withPrompts(restCLIInputComplete);

        checkRestPaths('/product-reviews');
      });

      it('honors custom HTTP PATHs', async () => {
        const customPathInput = Object.assign(restCLIInputComplete, {
          httpPathName: '/customer-orders',
        });

        await testUtils
          .executeGenerator(generator)
          .inDir(sandbox.path, () =>
            testUtils.givenLBProject(sandbox.path, {
              includeDummyModel: true,
              includeDummyRepository: true,
            }),
          )
          .withPrompts(customPathInput);

        checkRestPaths('/customer-orders');
      });
    });

    it('fails when no model is given', () => {
      const noModelInput = Object.assign(
        {
          repositoryName: 'BarRepository',
        },
        restCLIInput,
      );

      return expect(
        testUtils
          .executeGenerator(generator)
          .inDir(sandbox.path, () =>
            testUtils.givenLBProject(sandbox.path, {
              includeDummyRepository: true,
            }),
          )
          .withPrompts(noModelInput),
      ).to.be.rejectedWith(/No models found in /);
    });

    it('fails when no repository is given', () => {
      const noRepositoryInput = Object.assign(
        {
          modelName: 'ProductReview',
        },
        restCLIInput,
      );

      return expect(
        testUtils
          .executeGenerator(generator)
          .inDir(sandbox.path, () =>
            testUtils.givenLBProject(sandbox.path, {includeDummyModel: true}),
          )
          .withPrompts(noRepositoryInput),
      ).to.be.rejectedWith(/No repositories found in /);
    });

    it('fails when no model directory present', () => {
      return expect(
        testUtils
          .executeGenerator(generator)
          .inDir(sandbox.path, () =>
            testUtils.givenLBProject(sandbox.path, {
              excludeModelsDir: true,
              includeDummyRepository: true,
            }),
          )
          .withPrompts(restCLIInputComplete),
      ).to.be.rejectedWith(/No models found in .*[\/\\]models\b/);
    });

    it('fails when no repository directory present', () => {
      return expect(
        testUtils
          .executeGenerator(generator)
          .inDir(sandbox.path, () =>
            testUtils.givenLBProject(sandbox.path, {
              excludeRepositoriesDir: true,
              includeDummyModel: true,
            }),
          )
          .withPrompts(restCLIInputComplete),
      ).to.be.rejectedWith(/No repositories found in .*[\/\\]repositories\b/);
    });
  });
});

/**
 * Helper function to check the contents of a basic controller
 */
function checkBasicContents() {
  expectFileToMatchSnapshot(filePath);
}

/**
 * Assertions against the template to determine if it contains the
 * required signatures for a REST CRUD controller, specifically to ensure
 * that decorators are grouped correctly (for their corresponding
 * target functions)
 */
function checkRestCrudContents(options) {
  expectFileToMatchSnapshot(filePath);
}

/**
 * Helper function to test the REST CRUD Urls generated
 * @param {string} restUrl The base URL that should've been generated
 */
function checkRestPaths(restUrl) {
  assert.fileContent(filePath, `@post('${restUrl}')`);
  assert.fileContent(filePath, `@get('${restUrl}/count')`);
  assert.fileContent(filePath, `@get('${restUrl}')`);
  assert.fileContent(filePath, `@patch('${restUrl}')`);
  assert.fileContent(filePath, `@get('${restUrl}/{id}')`);
  assert.fileContent(filePath, `@patch('${restUrl}/{id}')`);
  assert.fileContent(filePath, `@del('${restUrl}/{id}')`);
}
