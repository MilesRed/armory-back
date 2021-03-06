// @flow

import type { Models, PaginatedResponse, CharacterSimple } from 'flowTypes';
import _ from 'lodash';

function canIgnorePrivacy (character, email, ignorePrivacy) {
  return ignorePrivacy && email === character.Gw2ApiToken.User.email;
}

type ListOptions = {
  email?: string,
  alias?: string,
  guild?: string,
  ignorePrivacy?: boolean,
  limit?: number,
  offset?: number,
};

export async function list (models: Models, {
  email,
  alias,
  guild,
  ignorePrivacy,
  limit,
  offset,
}: ListOptions): Promise<PaginatedResponse<CharacterSimple>> {
  const { rows, count } = await models.Gw2Character.findAndCount({
    limit,
    offset,
    where: _.pickBy({
      guild,
    }),
    include: [{
      model: models.Gw2ApiToken,
      include: [{
        model: models.User,
        where: _.pickBy({
          email,
          alias,
        }),
      }],
    }],
  });

  const characters = rows.filter((character) => (
    character.showPublic || canIgnorePrivacy(character, email, ignorePrivacy))
  )
  .map((c) => {
    return {
      accountName: c.Gw2ApiToken.accountName,
      userAlias: c.Gw2ApiToken.User.alias,
      world: c.Gw2ApiToken.world,
      name: c.name,
      gender: c.gender,
      profession: c.profession,
      level: c.level,
      race: c.race,
    };
  });

  return {
    rows: characters,
    count,
    limit: limit || count,
    offset: offset || 0,
  };
}

export async function listPublic (models: Models) {
  return models.Gw2Character.findAll({
    where: {
      showPublic: true,
    },
  });
}

export async function read (models: Models, name: string, email: string) {
  const query = {
    include: [{
      model: models.Gw2ApiToken,
      include: [{
        model: models.User,
      }],
    }],
    where: {
      name,
    },
  };

  if (email) {
    query.include[0].include = [{
      model: models.User,
      where: {
        email,
      },
    }];
  }

  return await models.Gw2Character.findOne(query);
}

export type UpdateFields = {
  name: string,
  showPublic: boolean,
  showBuilds: boolean,
  showPvp: boolean,
  showBags: boolean,
  showGuild: boolean,
};

export async function update (models: Models, id: number, fields: UpdateFields) {
  return await models.Gw2Character.update(fields, {
    where: {
      id,
    },
  });
}
