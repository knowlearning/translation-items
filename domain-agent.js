  import Agent, { getAgent } from 'npm:@knowlearning/agents/deno.js'

  const TRANSLATION_DOMAIN = 'translations.pilaproject.org'
  const TRANSLATABLE_TARGET_TYPE = 'application/json;type=translatable_target'

  const TranslationAgent = getAgent(TRANSLATION_DOMAIN)

  Agent.on('child', child => {
    child.on('mutate', async ({ id }) => {
      if (await isTranslatableItem(id)) {
        await handleTranslatableItem(id)
      }
    })
  })

  async function handleTranslatableItem(id) {
    const itemState = await TranslationAgent.state(id)
    itemState.translations.paths.forEach(async path => {
      const translatableTargetName = `translatable_target/${JSON.stringify([id, ...path])}`
      const translatableTargetMetadata = await TranslationAgent.metadata(translatableTargetName)

      if (translatableTargetMetadata.active_type !== TRANSLATABLE_TARGET_TYPE) {
        translatableTargetMetadata.active_type = TRANSLATABLE_TARGET_TYPE
      }

      const translatableTarget = await TranslationAgent.state(translatableTargetName)
      const source_string = resolvePath([...path], itemState)

      translatableTarget.source_language = itemState.translations.source_language
      translatableTarget.source_string = source_string || null
      translatableTarget.path = [id, ...path]
    })
  }


  function resolvePath(path, value) {
      while (path.length && value) value = value[path.shift()]
      return value
    }

  async function isTranslatableItem(id) {
    const state = await Agent.state(id)
    //  TODO: validate schema
    return !!state.translations
  }
