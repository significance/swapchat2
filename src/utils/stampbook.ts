const BEGIN = '-----BEGIN BOOK OF STAMPS-----'
const END = '-----END BOOK OF STAMPS-----'

export interface StampBook {
  version: number
  batchId: string
  owner: string
  depth: number
  bucketDepth: number
  amount: bigint
  privateKey: Uint8Array
  usage: string
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

function wrapBase64(b64: string, width: number): string {
  const lines: string[] = []
  for (let i = 0; i < b64.length; i += width) {
    lines.push(b64.slice(i, i + width))
  }
  return lines.join('\n')
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

export function serializeStampBook(book: StampBook): string {
  const totalSlots = 1 << book.depth
  const body = uint8ToBase64(book.privateKey)

  return [
    BEGIN,
    `Version: ${book.version}`,
    `Batch-Id: ${book.batchId}`,
    `Owner: ${book.owner}`,
    `Depth: ${book.depth}`,
    `Bucket-Depth: ${book.bucketDepth}`,
    `Amount: ${book.amount}`,
    `Usage: ${book.usage || `0/${totalSlots}`}`,
    '',
    wrapBase64(body, 64),
    END,
    '',
  ].join('\n')
}

export function deserializeStampBook(text: string): StampBook {
  const lines = text.split('\n')

  const beginIdx = lines.indexOf(BEGIN)
  const endIdx = lines.indexOf(END)
  if (beginIdx === -1 || endIdx === -1 || endIdx <= beginIdx) {
    throw new Error('invalid book of stamps: missing delimiters')
  }

  const content = lines.slice(beginIdx + 1, endIdx)

  const headers = new Map<string, string>()
  let blankIdx = -1
  for (let i = 0; i < content.length; i++) {
    const line = content[i]
    if (line === '') {
      blankIdx = i
      break
    }
    const colon = line.indexOf(': ')
    if (colon === -1) throw new Error(`invalid header line: ${line}`)
    headers.set(line.slice(0, colon), line.slice(colon + 2))
  }

  if (blankIdx === -1) throw new Error('invalid book of stamps: no body separator')

  const bodyLines = content.slice(blankIdx + 1).filter(l => l.length > 0)
  const body = bodyLines.join('')
  const privateKey = base64ToUint8(body)

  const required = ['Version', 'Batch-Id', 'Owner', 'Depth', 'Bucket-Depth', 'Amount']
  for (const key of required) {
    if (!headers.has(key)) throw new Error(`missing header: ${key}`)
  }

  return {
    version: Number(headers.get('Version')),
    batchId: headers.get('Batch-Id')!,
    owner: headers.get('Owner')!,
    depth: Number(headers.get('Depth')),
    bucketDepth: Number(headers.get('Bucket-Depth')),
    amount: BigInt(headers.get('Amount')!),
    privateKey,
    usage: headers.get('Usage') || `0/${1 << Number(headers.get('Depth'))}`,
  }
}
