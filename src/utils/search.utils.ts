export const search = (text: string, searchTerm: string, caseIgnore = true) => {
	if (caseIgnore) {
		searchTerm = searchTerm.toLowerCase()
		text = text.toLowerCase()
	}
	const searchTermArray = searchTerm.trim().split('')
	const textLength = text.length
	const intersections: boolean[] = Array(textLength).fill(false)

	for (let i = 0; i < textLength; i++) {
		const index = searchTermArray.indexOf(text[i])
		if (index === -1) continue
		searchTermArray.splice(index, 1)
		intersections[i] = true
	}
	const value = intersections.reduce((acc, cur, ci) => acc + +cur / (ci + 1), 0)
	return value === 0 ? [] : intersections
}
