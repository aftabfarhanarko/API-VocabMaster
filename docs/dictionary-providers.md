# Dictionary provider policy

The backend uses a provider-first lookup and persists successful results so saved words remain available during provider outages. `FREEDICT_API_KEY` is optional and is only used on the server. When it is absent or the provider fails, English definitions and pronunciation data are requested from dictionaryapi.dev. Provider failures are treated as misses; the vocabulary database remains the source for previously saved entries.

## Provider review (checked 20 November 2026)

| Provider | Useful fields | Access and limits | Licensing and decision |
| --- | --- | --- | --- |
| [FreeDict API](https://freedict.com/api/docs) | Definitions, POS, examples, phonetics, translations, etymology, synonyms and antonyms (feature availability depends on entry) | Requires server-side API key. Free-plan terms require a visible “Powered by FreeDict” link; see [terms](https://freedict.com/api/terms). | Selected as the primary structured provider, conditional on configuring a key and showing its attribution in the product. Do not assume an unlimited quota. |
| [dictionaryapi.dev](https://dictionaryapi.dev/) | Multiple meanings/POS, IPA, audio, examples, synonyms and antonyms | No key in the documented API; no SLA or published quota was found in the reviewed docs. | Optional English fallback only. The project provides an open-source implementation, but the reviewed API docs did not establish a clear commercial data license or service guarantee. Review content/license requirements before relying on it commercially. |
| [Wiktionary / Wikimedia](https://www.mediawiki.org/wiki/Wikimedia_REST_API/en) | Broad multilingual lexical data, pronunciation, etymology and examples | Public MediaWiki APIs; obey API usage and User-Agent policies. | Content license varies by project and may require attribution and share-alike. Better suited to a deliberate dump/import pipeline than untracked live copying. |
| [WordNet 3.0](https://wordnet.princeton.edu/license-and-commercial-use) | Synsets, glosses, semantic relations, English; not audio or Bengali translations | Downloadable dataset; no API quota. | Commercial use is permitted under Princeton's license with notices and disclaimer retained. Strong candidate for an offline semantic relation supplement, not wired into this deployment. |
| [Datamuse](https://www.datamuse.com/api/) | Related terms, synonyms, antonyms, rhyme and word finding; not full definitions | Currently up to 100,000 requests/day without a key; the provider says keys become required from 1 February 2027 and the limit becomes 100,000/day/key. | Good optional relation/autocomplete provider, not selected for definition lookup. Acknowledge the API in public app documentation. |
| [Merriam-Webster](https://dictionaryapi.com/) | High quality definitions, pronunciation, etymology, synonyms/antonyms, learner content | API key required; free use is non-commercial, capped at 1,000 queries/day/reference work and two reference APIs. | Not enabled: Vocab Master’s future commercial status is unknown, and API terms prohibit commercial use under free access. Obtain written commercial terms before integrating. |

The former `FREEDICT_API_KEY` hardcoded fallback has been removed. The API key must be provided through deployment secrets; never commit or send it to a client. The old `/dictionary/freedict/words` feed also requires a configured key.

`GET /api/dictionary/related/:word?relation=synonyms|antonyms|related|topics|rhymes&limit=10` uses Datamuse only for word-finding suggestions, with a four-second timeout and bounded cache. It returns an empty `data` list with `unavailable: true` if Datamuse is down, so it cannot block saved vocabulary or definitions. The response includes Datamuse attribution for client display.

## Internal data shape

Dictionary lookups return a canonical word with phonetics/audio, all collected definitions (each with part of speech and example), relations, optional etymology, optional translation, and source metadata. CEFR is optional: the API does not infer `B1` when a provider has no classification. Newly discovered words and each available sense are stored in `VocabularyWord` and `WordDefinition`; user-added words keep the legacy summary fields and can be expanded with definitions in a later UI/API iteration.

Wiktionary-derived records must retain source attribution and compatible licensing metadata. Provider data should not be bulk-copied into a public catalog without reviewing the applicable provider/content terms.
