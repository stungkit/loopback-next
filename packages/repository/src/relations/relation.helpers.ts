// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as debugFactory from 'debug';
import * as _ from 'lodash';
import {
  AnyObject,
  Entity,
  EntityCrudRepository,
  Filter,
  Inclusion,
  Options,
  Where,
} from '..';
import {DefaultCrudRepository} from '../repositories';
const debug = debugFactory('loopback:repository:relation-helpers');

/**
 * Finds model instances that contain any of the provided foreign key values.
 *
 * @param targetRepository - The target repository where the model instances are found
 * @param fkName - Name of the foreign key
 * @param fkValues - One value or array of values of the foreign key to be included
 * @param scope - Additional scope constraints (not currently supported)
 * @param options - Options for the operations
 */
export async function findByForeignKeys<
  Target extends Entity,
  TargetRelations extends object,
  ForeignKey extends StringKeyOf<Target>
>(
  targetRepository: EntityCrudRepository<Target, unknown, TargetRelations>,
  fkName: ForeignKey,
  fkValues: Target[ForeignKey][] | Target[ForeignKey],
  scope?: Filter<Target>,
  options?: Options,
): Promise<(Target & TargetRelations)[]> {
  // throw error if scope is defined and non-empty
  // see https://github.com/strongloop/loopback-next/issues/3453
  if (scope && !_.isEmpty(scope)) {
    throw new Error('scope is not supported');
  }

  let value;

  if (Array.isArray(fkValues)) {
    if (fkValues.length === 0) return [];
    value = fkValues.length === 1 ? fkValues[0] : {inq: fkValues};
  } else {
    value = fkValues;
  }

  const where = ({[fkName]: value} as unknown) as Where<Target>;
  const targetFilter = {where};

  return targetRepository.find(targetFilter, options);
}

type StringKeyOf<T> = Extract<keyof T, string>;

/**
 * Finds model instances that contain any of the provided foreign key values.
 *
 * @param targetRepository - The target repository where the model instances are found
 * @param fkName - Name of the foreign key
 * @param fkValues - One value or array of values of the foreign key to be included
 * @param scope - Additional scope constraints (not currently supported)
 * @param options - Options for the operations
 */

export async function includeRelatedModels<
  T extends Entity,
  Relations extends object = {}
>(
  repo: DefaultCrudRepository<T, unknown, Relations>,
  entities: T[],
  filter?: Filter<T>,
  options?: Options,
): Promise<(T & Relations)[]> {
  // 'as ..' keeps tsc happy
  const result = entities as (T & Relations)[];
  // include is the field user passes in filter in request body
  const include = filter && filter.include;
  if (!include) return result;

  const invalidInclusions = include.filter(i => !isInclusionAllowed(repo, i));
  if (invalidInclusions.length) {
    const msg =
      'Invalid "filter.include" entries: ' +
      invalidInclusions.map(i => JSON.stringify(i)).join('; ');
    const err = new Error(msg);
    Object.assign(err, {
      code: 'INVALID_INCLUSION_FILTER',
    });
    throw err;
  }

  const resolveTasks = include.map(async i => {
    const relationName = i.relation!;
    // get the resolver of this repo
    const resolver = repo.inclusionResolvers.get(relationName)!;
    // (source entities, inclusion requested by the user, other options)
    const targets = await resolver(entities, i, options);

    for (const ix in result) {
      const src = result[ix];
      (src as AnyObject)[relationName] = targets[ix];
    }
  });

  await Promise.all(resolveTasks);

  return result;
}
/**
 * Chcks if the relation is included in the inclusionResolver of the repository
 *
 */
function isInclusionAllowed<T extends Entity, Relations extends object = {}>(
  repo: DefaultCrudRepository<T, unknown, Relations>,
  inclusion: Inclusion,
): boolean {
  const relationName = inclusion.relation;
  if (!relationName) {
    debug('isInclusionAllowed for %j? No: missing relation name', inclusion);
    return false;
  }

  const allowed = repo.inclusionResolvers.has(relationName);
  debug('isInclusionAllowed for %j (relation %s)? %s', inclusion, allowed);
  return allowed;
}
