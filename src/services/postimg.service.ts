import { BadRequestException, Injectable } from '@nestjs/common'

@Injectable()
export class PostimgService {
	private readonly apiHeaders: Record<string, string>
	private readonly apiFormData: FormData

	constructor() {
		this.apiHeaders = {
			accept: 'application/json',
			'accept-encoding': 'gzip, deflate, br, zstd',
			'accept-language': 'en-US,en;q=0.9,ru;q=0.8,fr;q=0.7',
			origin: 'https://postimages.org',
			referer: 'https://postimages.org',
			'X-Requested-With': 'XMLHttpRequest',
			'user-agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
		}

		this.apiFormData = new FormData()
		Object.entries({
			gallery: '',
			optsize: '0',
			expire: '0',
			upload_session: this.generateSessionId(),
			numfiles: '1',
		}).forEach(([key, value]) => {
			this.apiFormData.append(key, value)
		})
	}

	async uploadFile(file: Express.Multer.File) {
		this.validateFile(file)

		try {
			const body = this.getFormData(file)
			const imagePageUrl = await this.sendImage(body)
			const imageUrl = await this.getImageUrl(imagePageUrl)
			return imageUrl
		} catch (error) {
			return null
		}
	}

	private validateFile(file: Express.Multer.File): void {
		if (!file.mimetype?.startsWith('image/'))
			throw new BadRequestException('Invalid file type')
	}

	private getFormData(file: Express.Multer.File) {
		const newFormData = new FormData()

		for (const [key, value] of this.apiFormData.entries())
			newFormData.append(key, value)

		newFormData.append(
			'file',
			new Blob([file.buffer as BlobPart], { type: file.mimetype }),
			file.originalname,
		)

		return newFormData
	}

	private async sendImage(body: FormData) {
		const sendImageResponse = await fetch('https://postimages.org/json/rr', {
			method: 'POST',
			headers: this.apiHeaders,
			body,
		})

		if (!sendImageResponse.ok) throw new Error(await sendImageResponse.text())

		const pageUrl: string = (await sendImageResponse.json())['url']

		const imagePageUrl = pageUrl.slice(0, pageUrl.lastIndexOf('/'))
		return imagePageUrl
	}

	private async getImageUrl(imagePageUrl: string) {
		const pageResponse = await fetch(imagePageUrl)
		const reponseText = await pageResponse.text()

		if (
			!pageResponse.ok ||
			!reponseText.includes('<a href="https://i.postimg.cc')
		)
			throw new Error(reponseText)

		const indexOfStartUrl =
			reponseText.indexOf('<a href="https://i.postimg.cc') + '<a href="'.length

		const indexOfEndUrl = reponseText.indexOf('"', indexOfStartUrl)
		const imageUrl = reponseText.slice(indexOfStartUrl, indexOfEndUrl)
		return imageUrl
	}

	private generateSessionId(): string {
		return Array.from(
			{ length: 15 },
			() => ~~(Math.random() * 10).toString(),
		).join('')
	}
}
