import '@testing-library/jest-dom'
import { randomUUID as nodeRandomUUID } from 'crypto'
import { jest } from '@jest/globals'

// Polyfill crypto.randomUUID for Node test environment if missing
type MutableGlobalCrypto = { crypto?: Partial<Crypto> }
const g = globalThis as unknown as MutableGlobalCrypto

if (!g.crypto) {
	g.crypto = {}
}
if (typeof g.crypto.randomUUID !== 'function') {
	try {
		g.crypto.randomUUID = nodeRandomUUID as unknown as Crypto['randomUUID']
	} catch {
		g.crypto.randomUUID = (() =>
			'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
				const r = (Math.random() * 16) | 0
				const v = c === 'x' ? r : (r & 0x3) | 0x8
				return v.toString(16)
			})) as unknown as Crypto['randomUUID']
	}
}

// Mock Next.js app router for tests that call useRouter/usePathname etc.
jest.mock('next/navigation', () => {
	const push = jest.fn()
	const replace = jest.fn()
	const refresh = jest.fn()
	const back = jest.fn()
	return {
		useRouter: () => ({ push, replace, refresh, back, prefetch: jest.fn() }),
		useSearchParams: () => new URLSearchParams(),
		usePathname: () => '/',
		// export mocks in case tests want to assert
		__mocks: { push, replace, refresh, back },
	}
})

// Silence act() warnings from benign state updates in certain auth components during tests
const originalError = console.error
console.error = (...args: unknown[]) => {
	const msg = String(args[0] ?? '')
	if (msg.includes('not wrapped in act')) return
	;(originalError as (...a: unknown[]) => void)(...(args as unknown[]))
}

// Provide a Vitest-compatible global for tests written with vi APIs
;(globalThis as unknown as { vi?: unknown }).vi = jest

// Minimal Web API polyfills for tests that call route handlers directly
// Provide Headers and Response if not available in the JSDOM/Node test env
type GlobalWeb = typeof globalThis & { Headers?: typeof Headers; Response?: typeof Response }
const web = globalThis as GlobalWeb

if (typeof web.Headers === 'undefined') {
	class TestHeaders {
		private map = new Map<string, string>()
		constructor(init?: HeadersInit) {
			if (!init) return
			const ExistingHeaders = (globalThis as { Headers?: typeof Headers }).Headers
			if (ExistingHeaders && init instanceof ExistingHeaders) {
				;(init as Headers).forEach((v: string, k: string) => this.map.set(k.toLowerCase(), v))
			} else if (Array.isArray(init)) {
				for (const [k, v] of init) this.map.set(String(k).toLowerCase(), String(v))
			} else {
				for (const [k, v] of Object.entries(init)) this.map.set(k.toLowerCase(), String(v))
			}
		}
		get(name: string) {
			return this.map.get(name.toLowerCase()) ?? null
		}
		set(name: string, value: string) {
			this.map.set(name.toLowerCase(), String(value))
		}
		has(name: string) {
			return this.map.has(name.toLowerCase())
		}
		append(name: string, value: string) {
			const key = name.toLowerCase()
			const prev = this.map.get(key)
			this.map.set(key, prev ? prev + ', ' + String(value) : String(value))
		}
		forEach(cb: (value: string, key: string) => void) {
			for (const [k, v] of this.map.entries()) cb(v, k)
		}
	}
		;(globalThis as unknown as { Headers: unknown }).Headers = TestHeaders as unknown as typeof Headers
}

	if (typeof web.Response === 'undefined') {
		class TestResponse {
		status: number
		headers: Headers
		private _body: string
		constructor(body?: BodyInit | null, init?: ResponseInit) {
			this.status = init?.status ?? 200
				// Ensure Headers exists (we polyfill above if needed)
				const H = (globalThis as { Headers: typeof Headers }).Headers
				this.headers = new H(init?.headers)
			this._body = typeof body === 'string' ? body : body ? String(body) : ''
		}
		async json() {
			return this._body ? JSON.parse(this._body) : null
		}
		async text() {
			return this._body
		}
	}
		;(globalThis as unknown as { Response: unknown }).Response = TestResponse as unknown as typeof Response
}
