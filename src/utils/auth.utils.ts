export const isEmail = (email: string) => {
	return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/.test(
		email,
	)
}

export const isPhone = (phone: string) => {
	return /^\+?[0-9-. ()]{4,}$/.test(phone)
}
