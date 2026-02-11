export const unionArrays = <T>(...arrays: T[][]) => {
	return Array.from(_mapArrays(...arrays).keys())
}

export const intersectArrays = <T>(...arrays: T[][]): T[] => {
	const countArrays = arrays.length
	const map = _mapArrays(...arrays)

	map.forEach((count, item) => {
		if (count !== countArrays) map.delete(item)
	})

	return Array.from(map.keys())
}

export const unionAndIntersectArrays = <T>(...arrays: T[][]) => {
	const countArrays = arrays.length
	const map = _mapArrays(...arrays)
	const union = Array.from(map.keys())

	map.forEach((count, item) => {
		if (count !== countArrays) map.delete(item)
	})
	const intersection = Array.from(map.keys())

	return [union, intersection]
}

export const _mapArrays = <T>(...arrays: T[][]) => {
	const map = new Map()
	arrays.forEach(array => {
		array.forEach(item => {
			map.set(item, map.get(item) + 1 || 1)
		})
	})
	return map
}

export const partition = <T>(array: T[], predicate: (item: T) => boolean) => {
	return array.reduce(
		(acc: [T[], T[]], item) => {
			acc[+predicate(item)].push(item)
			return acc
		},
		[[], []],
	)
}
