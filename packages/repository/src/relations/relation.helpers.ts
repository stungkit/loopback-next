// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as _ from 'lodash';
import {Entity, EntityCrudRepository, Filter, Options, Where} from '..';
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

export async function includeRelatedModels<T, Relations, AnyObject>(
  entities: T[],
  filter?: Filter<T>,
  options?: Options,
): Promise<(T & Relations)[]> {
  const result = entities as (T & Relations)[];

  const include = filter && filter.include;
  if (!include) return result;

  const invalidInclusions = include.filter(i => !isInclusionAllowed(i));
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
    const resolver = this.inclusionResolvers.get(relationName)!;
    const targets = await resolver(entities, i, options);

    for (const ix in result) {
      const src = result[ix];
      (src as AnyObject)[relationName] = targets[ix];
    }
  });

  await Promise.all(resolveTasks);

  return result;
}

export function isInclusionAllowed<Inclusion>(inclusion: Inclusion): boolean {
  const relationName = inclusion.relation;
  if (!relationName) {
    //debug('isInclusionAllowed for %j? No: missing relation name', inclusion);
    return false;
  }

  const allowed = inclusionResolvers.has(relationName);
  //debug('isInclusionAllowed for %j (relation %s)? %s', inclusion, allowed);
  return allowed;
}
