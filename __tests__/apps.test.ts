import { expect, test, describe } from "bun:test";
import { appInfoSchema, dynamicComposeSchemaYaml, dynamicComposeSchemaArk } from '@runtipi/common/schemas'
import { fromError } from 'zod-validation-error';
import fs from 'node:fs'
import path from 'node:path'
import { type } from "arktype";

const getApps = async () => {
  const appsDir = await fs.promises.readdir(path.join(process.cwd(), 'apps'))

  const appDirs = appsDir.filter((app) => {
    const stat = fs.statSync(path.join(process.cwd(), 'apps', app))
    return stat.isDirectory()
  })

  return appDirs
};

const getFile = async (app: string, file: string) => {
  const filePath = path.join(process.cwd(), 'apps', app, file)
  try {
    const file = await fs.promises.readFile(filePath, 'utf-8')
    return file
  } catch (err) {
    return null
  }
}

/**
 * @runtipi/common 1.1.3 (the newest published version) marks `x-runtipi.overrides`
 * as required, but Runtipi itself marks it optional: see `overrides: ... .optional()`
 * in packages/common/src/schemas/compose-yaml.ts. Not one of the 270 apps in the
 * official app store sets it. So the field is defaulted here, for validation only,
 * rather than written into every app file to satisfy a stale package.
 */
const withOverridesDefault = (compose: unknown) => {
  if (compose && typeof compose === 'object' && 'x-runtipi' in compose) {
    const meta = (compose as Record<string, unknown>)['x-runtipi']

    if (meta && typeof meta === 'object' && !('overrides' in meta)) {
      return { ...compose, 'x-runtipi': { ...meta, overrides: [] } }
    }
  }

  return compose
}

describe("each app should have the required files", async () => {
  const apps = await getApps()

  for (const app of apps) {
    const files = ['config.json', 'metadata/logo.jpg', 'metadata/description.md']

    for (const file of files) {
      test(`app ${app} should have ${file}`, async () => {
        const fileContent = await getFile(app, file)
        expect(fileContent).not.toBeNull()
      })
    }

    // Runtipi reads docker-compose.yml first and falls back to the legacy
    // docker-compose.json, so either one is enough.
    test(`app ${app} should have a compose file`, async () => {
      const yaml = await getFile(app, 'docker-compose.yml')
      const json = await getFile(app, 'docker-compose.json')
      expect(yaml !== null || json !== null).toBe(true)
    })
  }
})

describe("each app should have a valid config.json", async () => {
  const apps = await getApps()

  for (const app of apps) {
    test(`app ${app} should have a valid config.json`, async () => {
      const fileContent = await getFile(app, 'config.json')
      const parsed = appInfoSchema.omit('urn')(JSON.parse(fileContent || '{}'))

      if (parsed instanceof type.errors) {
        const validationError = fromError(parsed);
        console.error(`Error parsing config.json for app ${app}:`, validationError.toString());
      }

      expect(parsed instanceof type.errors).toBe(false)
    })
  }
})

describe("the id in config.json should match the folder name", async () => {
  const apps = await getApps()

  for (const app of apps) {
    test(`app ${app} should declare id "${app}"`, async () => {
      const fileContent = await getFile(app, 'config.json')
      const config = JSON.parse(fileContent || '{}')
      expect(config.id).toBe(app)
    })
  }
})

describe("each app should have a valid compose file", async () => {
  const apps = await getApps()

  for (const app of apps) {
    test(`app ${app} should have a valid compose file`, async () => {
      const yamlContent = await getFile(app, 'docker-compose.yml')

      if (yamlContent !== null) {
        const parsed = dynamicComposeSchemaYaml(withOverridesDefault(Bun.YAML.parse(yamlContent)))

        if (parsed instanceof type.errors) {
          console.error(`Error parsing docker-compose.yml for app ${app}:`, parsed.summary);
        }

        expect(parsed instanceof type.errors).toBe(false)
      }

      // An app may ship both: Runtipi reads the yaml and older versions read the
      // legacy json, so when both are present both have to be valid.
      const jsonContent = await getFile(app, 'docker-compose.json')

      if (jsonContent === null) {
        expect(yamlContent).not.toBeNull()
        return
      }

      // The legacy file is checked against the legacy schema rather than being
      // converted to yaml first: Runtipi reads it with that schema, and the
      // published @runtipi/common lags behind the converter in the product.
      const parsedLegacy = dynamicComposeSchemaArk(JSON.parse(jsonContent))

      if (parsedLegacy instanceof type.errors) {
        console.error(`Error parsing docker-compose.json for app ${app}:`, parsedLegacy.summary);
      }

      expect(parsedLegacy instanceof type.errors).toBe(false)
    })
  }
});

describe("no app should pin a floating image tag", async () => {
  const apps = await getApps()

  for (const app of apps) {
    test(`app ${app} should not use the latest tag`, async () => {
      const yamlContent = await getFile(app, 'docker-compose.yml')
      const jsonContent = await getFile(app, 'docker-compose.json')
      const images = [...`${yamlContent || ''}${jsonContent || ''}`.matchAll(/image:\s*'?"?([^'"\s,]+)/g)].map((m) => m[1])

      expect(images.length).toBeGreaterThan(0)

      for (const image of images) {
        const tag = image.split(':').at(1)
        expect(tag).toBeDefined()
        expect(tag).not.toBe('latest')
      }
    })
  }
});

describe("both compose formats should be shipped and should agree", async () => {
  const apps = await getApps()

  for (const app of apps) {
    // Runtipi reads docker-compose.yml from an app store only since v4.7.0. A store
    // that ships the yaml alone is unusable on 4.5.0 to 4.6.2, where the store
    // reader looks for docker-compose.json and nothing else.
    test(`app ${app} should ship both compose formats`, async () => {
      expect(await getFile(app, 'docker-compose.yml')).not.toBeNull()
      expect(await getFile(app, 'docker-compose.json')).not.toBeNull()
    })

    test(`app ${app} should pin the same image in both compose files`, async () => {
      const yaml = Bun.YAML.parse((await getFile(app, 'docker-compose.yml')) || '') as any
      const json = JSON.parse((await getFile(app, 'docker-compose.json')) || '{}')

      const yamlImages = Object.values(yaml?.services ?? {}).map((s: any) => s.image).sort()
      const jsonImages = (json.services ?? []).map((s: any) => s.image).sort()

      expect(yamlImages.length).toBeGreaterThan(0)
      expect(jsonImages).toEqual(yamlImages)
    })
  }
});
