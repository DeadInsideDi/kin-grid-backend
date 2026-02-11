import { search } from './search.utils'

export const supportedLanguages = ['en', 'ru'] as const
export const defaultLanguage = 'en'
const LANG_TO_LETTERS: Record<SupportedLanguages, string> = {
	ru: 'абвгдеёжзийклмнопрстуфхцчшщыъьэюя',
	en: 'abcdefghijklmnopqrstuvwxyz',
} as const
export const LanguageErrorMsg = 'NOT_SUPPORTED'

export type SupportedLanguages = (typeof supportedLanguages)[number]
export type SourceLang = Exclude<SupportedLanguages, typeof defaultLanguage>
type TransliterationMap = Record<SourceLang, Record<string, string>>

const transliterationMapToEn: TransliterationMap = {
	ru: {
		// Приказом МВД России от 27 ноября 2017 г. N 889 "Об утверждении Административного регламента Министерства внутренних дел Российской Федерации
		а: 'a',
		б: 'b',
		в: 'v',
		г: 'g',
		д: 'd',
		е: 'e',
		ё: 'e',
		ж: 'zh',
		з: 'z',
		и: 'i',
		й: 'i',
		к: 'k',
		л: 'l',
		м: 'm',
		н: 'n',
		о: 'o',
		п: 'p',
		р: 'r',
		с: 's',
		т: 't',
		у: 'u',
		ф: 'f',
		х: 'kh',
		ц: 'ts',
		ч: 'ch',
		ш: 'sh',
		щ: 'shch',
		ы: 'y',
		ъ: 'ie',
		ь: '',
		э: 'е',
		ю: 'iu',
		я: 'ia',
	},
}

const stringToLang = (text: string) => {
	const isLang = supportedLanguages.includes(text as SupportedLanguages)

	if (isLang) return text as SupportedLanguages
	if (!text.length) return defaultLanguage

	const char = text[0].toLowerCase()
	const langEntry = Object.entries(LANG_TO_LETTERS).find(el =>
		el[1].includes(char),
	) as [SupportedLanguages, string] | undefined

	return langEntry ? langEntry[0] : LanguageErrorMsg
}

export const transliterateToEn = (
	text: string,
	sourceLang?: SupportedLanguages,
) => {
	if (text.length === 0) return text

	text = text.toLowerCase()
	const resultLang = sourceLang || stringToLang(text)
	if (resultLang === LanguageErrorMsg) return LanguageErrorMsg
	if (resultLang === defaultLanguage) return text

	Object.entries(transliterationMapToEn[resultLang]).forEach(el => {
		text = text.replaceAll(...el)
	})
	return text
}

export const compareTransliterationToSourceLang = (
	name: string,
	transliteration: string,
	sourceLang?: string,
) => {
	const lang = stringToLang(sourceLang || name)
	if (lang !== 'NOT_SUPPORTED') name = transliterateToEn(name, lang)
	return search(name, transliteration).some(el => el)
}

export const RELATION_SHORT_NAMES = {
	'|father|father': '|grandfather',
	'|mother|father': '|grandfather',
	'|father|mother': '|grandmother',
	'|mother|mother': '|grandmother',
	'|grandfather|father': '|great-grandfather',
	'|grandmother|father': '|great-grandfather',
	'|grandfather|mother': '|great-grandmother',
	'|grandmother|mother': '|great-grandmother',
	'|great-grandfather|father': '?too distant ancestor',
	'|great-grandmother|father': '?too distant ancestor',
	'|great-grandfather|mother': '?too distant ancestor',
	'|great-grandmother|mother': '?too distant ancestor',

	'|son|son': '|grandson',
	'|daughter|son': '|grandson',
	'|son|daughter': '|granddaughter',
	'|daughter|daughter': '|granddaughter',
	'|grandson|son': '|great-grandson',
	'|granddaughter|son': '|great-grandson',
	'|grandson|daughter': '|great-granddaughter',
	'|granddaughter|daughter': '|great-granddaughter',
	'|great-grandson|son': '?too distant descendant',
	'|great-granddaughter|son': '?too distant descendant',
	'|great-grandson|daughter': '?too distant descendant',
	'|great-granddaughter|daughter': '?too distant descendant',

	'|grandfather|son': '|uncle',
	'|grandmother|son': '|uncle',
	'|grandfather|daughter': '|aunt',
	'|grandmother|daughter': '|aunt',
	'|father|brother': '|uncle',
	'|mother|brother': '|uncle',
	'|father|sister': '|aunt',
	'|mother|sister': '|aunt',
	'|father|half-brother': '|uncle',
	'|mother|half-brother': '|uncle',
	'|father|half-sister': '|aunt',
	'|mother|half-sister': '|aunt',

	'|male cousin|father': '|uncle',
	'|female cousin|father': '|uncle',
	'|male cousin|mother': '|aunt',
	'|female cousin|mother': '|aunt',
	'|aunt|husband': '|uncle',
	'|uncle|wife': '|aunt',

	'|uncle|son': '|male cousin',
	'|aunt|son': '|male cousin',
	'|uncle|daughter': '|female cousin',
	'|aunt|daughter': '|female cousin',

	'|father|male cousin': '|great-uncle',
	'|mother|male cousin': '|great-uncle',
	'|father|female cousin': '|great-aunt',
	'|mother|female cousin': '|great-aunt',

	'|great-uncle|son': '|male second cousin',
	'|great-aunt|son': '|male second cousin',
	'|great-uncle|daughter': '|female second cousin',
	'|great-aunt|daughter': '|female second cousin',

	'|brother|son': '|nephew',
	'|sister|son': '|nephew',
	'|brother|daughter': '|niece',
	'|sister|daughter': '|niece',

	'|mother|husband': '|stepfather',
	'|father|wife': '|stepmother',
	'|wife|son': '|stepson',
	'|husband|son': '|stepson',
	'|wife|daughter': '|stepdaughter',
	'|husband|daughter': '|stepdaughter',

	'|husband|father': "|husband's father",
	'|husband|mother': "|husband's mother",
	'|husband|brother': "|husband's brother",
	"|husband's sister|husband": "|husband's sister's husband",
	'|husband|sister': "|husband's sister",
	"|husband's brother|wife": "|husband's brother's wife",

	'|wife|father': "|wife's father",
	'|wife|mother': "|wife's mother",
	'|wife|brother': "|wife's brother",
	'|wife|sister': "|wife's sister",

	"|wife's sister|husband": "|wife's sister's husband",
	"|wife's brother|wife": "|wife's brother's wife",

	"|wife's sister's husband|sister": "|wife's sister's husband's sister",
	"|wife's sister's husband's sister|husband":
		"|wife's sister's husband's sister's husband",

	"|wife's brother's wife|sister": "|wife's brother's wife's sister",
	"|wife's brother's wife's sister|husband":
		"|wife's brother's wife's sister's husband",

	'|brother|wife': "|brother's wife",
	'|sister|husband': "|sister's husband",

	'|half-brother|wife': "|half-brother's wife",
	'|half-sister|husband': "|half-sister's husband",

	'son|wife': '|daughter-in-law',
	'daughter|husband': '|son-in-law',

	'|son-in-law|father': "|son-in-law's father",
	'|son-in-law|mother': "|son-in-law's mother",
	'|daughter-in-law|father': "|daughter-in-law's father",
	'|daughter-in-law|mother': "|daughter-in-law's mother",
}

export const RELATION_LANG_RU = {
	'|i': 'Я',

	'|son': 'Сын',
	'|daughter': 'Дочь',
	'|stepson': 'Пасынок',
	'|stepdaughter': 'Падчерица',

	'|grandson': 'Внук',
	'|granddaughter': 'Внучка',
	'|great-grandson': 'Правнук',
	'|great-granddaughter': 'Правнучка',

	'|brother': 'Брат',
	'|sister': 'Сестра',
	'|half-sister': 'Неполнородная сестра',
	'|half-brother': 'Неполнородный брат',
	'|stepbrother': 'Сводный брат',
	'|stepsister': 'Сводная сестра',

	'|male cousin': 'Двоюродный брат',
	'|female cousin': 'Двоюродная сестра',
	'|male second cousin': 'Троюродный брат',
	'|female second cousin': 'Троюродная сестра',

	'|father': 'Отец',
	'|mother': 'Мать',
	'|father-in-law': 'Тесть',
	'|mother-in-law': 'Тёща',
	'|stepfather': 'Отчим/Никто',
	'|stepmother': 'Мачеха/Никто',

	'|uncle': 'Дядя',
	'|aunt': 'Тётя',

	'|great-uncle': 'Двоюродный дядя',
	'|great-aunt': 'Двоюродная тётя',

	'|grandfather': 'Дедушка',
	'|grandmother': 'Бабушка',
	'|great-grandfather': 'Прадедушка',
	'|great-grandmother': 'Прабабушка',

	'|nephew': 'Племянник',
	'|niece': 'Племянница',

	'|husband': 'Муж',
	'|husband-F': 'Муж (Бывший)',
	"|husband's father": 'Свёкор',
	"|husband's mother": 'Свекровь',
	"|husband's brother": 'Деверь',
	"|husband's sister": 'Золовка',
	"|husband's sister's husband": 'Зять',
	"|husband's brother's wife": 'Сношеница',

	'|wife': 'Жена',
	'|wife-F': 'Жена (Бывшая)',
	"|wife's father": 'Тесть',
	"|wife's mother": 'Тёща',
	"|wife's brother": 'Шурин',
	"|wife's sister": 'Свояченица',
	"|wife's sister's husband": 'Свояк/Зять',
	"|wife's brother's wife": 'Невестка/Ятровь',

	"|wife's sister's husband's sister's husband": 'Свояк',
	"|wife's brother's wife's sister's husband": 'Свояк',

	"|brother's wife": 'Невестка',
	"|sister's husband": 'Зять',

	"|half-brother's wife": 'Невестка',
	"|half-sister's husband": 'Зять',

	'|son-in-law': 'Зять',
	'|daughter-in-law': 'Невесткa/Сноха',

	"|son-in-law's father": 'Сват',
	"|son-in-law's mother": 'Сватья',
	"|daughter-in-law's father": 'Сват',
	"|daughter-in-law's mother": 'Сватья',

	'?too distant descendant': 'Слишком далекий потомок',
	'?too distant ancestor': 'Слишком далекий предок/пращур',
	descendant: (generation: number) =>
		`Далекий потомок в ${generation}-ом колении`,
	ancestor: (generation: number) =>
		`Далекий предок/пращур в ${generation}-ом колении`,
	'?': 'Слишком далекий родственник',
}

export const RELATION_LANG_EN = {
	'|i': 'I',

	'|son': 'Son',
	'|daughter': 'Daughter',
	'|stepson': 'Stepson',
	'|stepdaughter': 'Stepdaughter',

	'|grandson': 'Grandson',
	'|granddaughter': 'Granddaughter',
	'|great-grandson': 'Great-grandson',
	'|great-granddaughter': 'Great-granddaughter',

	'|brother': 'Brother',
	'|sister': 'Sister',
	'|half-sister': 'Half-sister',
	'|half-brother': 'Half-brother',
	'|stepbrother': 'Stepbrother',
	'|stepsister': 'Stepsister',

	'|male cousin': 'Male cousin',
	'|female cousin': 'Female cousin',
	'|male second cousin': 'Male second cousin',
	'|female second cousin': 'Female second cousin',

	'|father': 'Father',
	'|mother': 'Mother',
	'|father-in-law': 'Father-in-law',
	'|mother-in-law': 'Mother-in-law',
	'|stepfather': 'Stepfather/Nobody',
	'|stepmother': 'Stepmother/Nobody',

	'|uncle': 'Uncle',
	'|aunt': 'Aunt',

	'|great-uncle': 'Great-uncle',
	'|great-aunt': 'Great-aunt',

	'|grandfather': 'Grandfather',
	'|grandmother': 'Grandmother',
	'|great-grandfather': 'Great-grandfather',
	'|great-grandmother': 'Great-grandmother',

	'|nephew': 'Nephew',
	'|niece': 'Niece',

	'|husband': 'Husband',
	'|husband-F': 'Husband (Former)',
	"|husband's father": 'Father-in-law',
	"|husband's mother": 'Mother-in-law',
	"|husband's brother": 'Brother-in-law',
	"|husband's sister": 'Sister-in-law',
	"|husband's sister's husband": 'Brother-in-law',
	"|husband's brother's wife": 'Sister-in-law',

	'|wife': 'Wife',
	'|wife-F': 'Wife (Former)',
	"|wife's father": 'Father-in-law',
	"|wife's mother": 'Mother-in-law',
	"|wife's brother": 'Brother-in-law',
	"|wife's sister": 'Sister-in-law',
	"|wife's sister's husband": 'Brother-in-law',
	"|wife's brother's wife": 'Sister-in-law',

	"|brother's wife": 'Sister-in-law',
	"|sister's husband": 'Brother-in-law',
	"|half-brother's wife": 'Sister-in-law',
	"|half-sister's husband": 'Brother-in-law',

	"|wife's sister's husband's sister's husband": 'Distant in-law',
	"|wife's brother's wife's sister's husband": 'Distant in-law',

	'|son-in-law': 'Son-in-law',
	'|daughter-in-law': 'Daughter-in-law',

	"|son-in-law's father": 'In-law/Co-parents-in-law',
	"|son-in-law's mother": 'In-law/Co-parents-in-law',
	"|daughter-in-law's father": 'In-law/Co-parents-in-law',
	"|daughter-in-law's mother": 'In-law/Co-parents-in-law',

	'?too distant descendant': 'Too distant descendant',
	'?too distant ancestor': 'Too distant ancestor',
	descendant: (generation: number) =>
		`Distant descendant ${generation}th generation`,
	ancestor: (generation: number) =>
		`Distant ancestor ${generation}th generation`,
	'?': 'Too distant relation',
}

export const RELATION_LANGS = {
	ru: RELATION_LANG_RU,
	en: RELATION_LANG_EN,
}

export const replaceByLang = (relation: string, lang: SupportedLanguages) => {
	const relationArray = relation
		.split('|')
		.slice(1)
		.map(el => '|' + el)
	let currentRelation = relationArray[0]

	while (relationArray.length > 1) {
		currentRelation = RELATION_SHORT_NAMES[relationArray[0] + relationArray[1]]
		if (currentRelation === undefined || currentRelation.includes('?')) break
		relationArray.splice(0, 2, currentRelation)
	}

	const relationLangMap = RELATION_LANGS[lang]

	let resultRelation: string = ''
	if (currentRelation === undefined) resultRelation = relationLangMap['?']
	else if (currentRelation.includes('?')) {
		const downGeneration = ['son', 'daughter', 'nephew', 'niece']
		const upGeneration = ['father', 'mother', 'uncle', 'aunt']
		const generation =
			relation.split('|').reduce((acc, cur) => {
				if (downGeneration.includes(cur)) return acc - 1
				if (upGeneration.includes(cur)) return acc + 1
			}, 0) || 0

		resultRelation = relationLangMap[currentRelation]
		if (currentRelation === '?too distant descendant') {
			resultRelation = relationLangMap.descendant(-generation)
		} else if (currentRelation === '?too distant ancestor') {
			resultRelation = relationLangMap.ancestor(generation)
		}
	} else resultRelation = relationLangMap[relationArray[0] || '?']

	return resultRelation
}

export const replaceAllByLang = (
	relations: Record<string, string>,
	lang: string,
) => {
	const resultRelations: Record<string, string> = {}
	const language = stringToLang(lang)
	if (language === LanguageErrorMsg) return relations

	for (const [key, value] of Object.entries(relations)) {
		resultRelations[key] = replaceByLang(value, language)
	}
	return resultRelations
}
