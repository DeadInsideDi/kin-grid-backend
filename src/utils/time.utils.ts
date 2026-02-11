export const getTimeDiff = (
	mainDate: Date,
	differDate: Date,
	divider: number = 1000,
) => Math.floor((mainDate.getTime() - differDate.getTime()) / divider)

const hourDivider = 1000 * 60 * 60
const dayDivider = hourDivider * 24
const yearDivider = dayDivider * 365

export const getTimeDiffInYears = (mainDate: Date, differDate: Date) =>
	getTimeDiff(mainDate, differDate, yearDivider)

export const getTimeDiffInDays = (mainDate: Date, differDate: Date) =>
	getTimeDiff(mainDate, differDate, dayDivider)
