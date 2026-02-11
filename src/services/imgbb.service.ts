import {
	BadRequestException,
	Injectable,
	ServiceUnavailableException,
} from '@nestjs/common'

type SuccessResponse = {
	message: string
	code: number
	affected?: number
}

type ErrorResponse = {
	message: string
	code: number
}

type ImageMedia = {
	filename: string
	name: string
	mime: string
	extension: string
	url: string
	size?: number
}

type DeletingMedia = {
	id: string
	type: string
	url: string
	privacy: string
	parent_url: string
	hash: string
}

type Image = {
	name: string
	extension: number
	width: number
	height: number
	size: number
	time: number
	expiration: number
	likes: number
	extension_name: string
	description?: string
	is_animated: number
	is_360: number
	nsfw: number
	id_encoded: string
	size_formatted: string
	filename: string
	url: string
	url_viewer: string
	url_viewer_preview: string
	url_viewer_thumb: string
	image: ImageMedia
	thumb: ImageMedia
	display_url: string
	display_width: number
	display_height: number
	delete_url: string
	views_label: string
	likes_label: string
	how_long_ago: string
	date_fixed_peer: string
	title: string
	title_truncated: string
	title_truncated_html: string
	is_use_loader: number
	medium?: ImageMedia
}

type UploadRequest = {
	type: string
	action: string
	timestamp: string
	auth_token?: string
	title?: string
	width?: string
	height?: string
	description?: string
	pathname?: string
	delete?: string
	from?: string
	owner?: string
	deleting?: DeletingMedia
}

type SuccessUploadResponse = {
	status_code: 200
	status_txt: 'OK'
	request: UploadRequest
	image: Image
	success: SuccessResponse
}

type ErrorUploadResponse = {
	status_code: number
	status_txt: string
	error: ErrorResponse
}

type UploadResponse = SuccessUploadResponse | ErrorUploadResponse

const MAX_FILE_SIZE = 32_000_000 // ~30.5MB
const TOKEN_EXPIRATION = 10 * 60 * 1000 // 10 minutes

@Injectable()
export class ImgbbService {
	private readonly headers: Record<string, string> = {
		'accept-encoding': 'gzip',
		'user-agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
	}
	private token: string
	private tokenExpiration: number

	constructor() {
		this.updateAuthToken()
	}

	private isSuccessResponse(res: UploadResponse): res is SuccessUploadResponse {
		return 'success' in res
	}

	private async updateAuthToken() {
		const page = await fetch('https://imgbb.com', {
			headers: this.headers,
		}).then(response => response.text())

		const token = page.match(/token=\W([a-z0-9]+)\W/)?.[1]
		if (!token) throw new ServiceUnavailableException('Token not found')

		this.token = token
		this.tokenExpiration = Date.now() + TOKEN_EXPIRATION
	}

	async uploadFile(file: Express.Multer.File) {
		this.validateFile(file)

		try {
			const body = this.getFormData(file)
			const imageUrl = await this.getImageUrl(body)
			return imageUrl
		} catch (error) {
			console.log(error)
			return null
		}
	}

	private validateFile(file: Express.Multer.File): void {
		if (!file.mimetype?.startsWith('image/'))
			throw new BadRequestException('Invalid file type')
		if (file.size > MAX_FILE_SIZE)
			throw new BadRequestException('File is too large')
	}

	private getFormData(file: Express.Multer.File) {
		const formData = new FormData()
		formData.append('type', 'file')
		formData.append('action', 'upload')
		formData.append('timestamp', Date.now().toString())
		formData.append('auth_token', this.token)
		formData.append(
			'source',
			new Blob([file.buffer as BlobPart], { type: file.mimetype }),
			file.originalname,
		)

		return formData
	}

	private async getImageUrl(body: FormData) {
		const response: UploadResponse = await fetch('https://imgbb.com/json', {
			method: 'POST',
			headers: this.headers,
			body,
		}).then(response => response.json())

		if (!this.isSuccessResponse(response)) {
			throw new BadRequestException(response)
		}

		if (this.tokenExpiration < Date.now()) {
			// Refresh the token in the background for subsequent requests.
			this.updateAuthToken()
		}

		return response.image.url
	}
}
