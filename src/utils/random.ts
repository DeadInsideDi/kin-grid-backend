export const randomDigit = () => ~~(Math.random() * 10)

export const randomDigits = (length: number) =>
	Array.from({ length }, randomDigit).join('')
