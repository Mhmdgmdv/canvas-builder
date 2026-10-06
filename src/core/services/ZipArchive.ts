type ArchiveEntry = {
  name: Uint8Array<ArrayBuffer>
  contents: Uint8Array<ArrayBuffer>
  checksum: number
  offset: number
}

function copyBytes(bytes: Uint8Array<ArrayBufferLike>): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy
}

function crc32(bytes: Uint8Array<ArrayBufferLike>): number {
  let crc = 0xffffffff

  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}

function createHeader(size: number, signature: number): DataView<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(size))
  const view = new DataView(bytes.buffer)
  view.setUint32(0, signature, true)
  return view
}

export class ZipArchive {
  private readonly encoder = new TextEncoder()
  private readonly files: {
    name: string
    contents: Uint8Array<ArrayBuffer>
  }[] = []

  addFile(name: string, contents: string): void {
    this.files.push({
      name: name.replaceAll('\\', '/'),
      contents: copyBytes(this.encoder.encode(contents)),
    })
  }

  toBlob(): Blob {
    const localFileParts: Uint8Array<ArrayBuffer>[] = []
    const centralDirectoryParts: Uint8Array<ArrayBuffer>[] = []
    const entries: ArchiveEntry[] = []
    let localOffset = 0

    for (const file of this.files) {
      const name = copyBytes(this.encoder.encode(file.name))
      const checksum = crc32(file.contents)
      const localHeader = createHeader(30, 0x04034b50)
      localHeader.setUint16(4, 20, true)
      localHeader.setUint32(14, checksum, true)
      localHeader.setUint32(18, file.contents.length, true)
      localHeader.setUint32(22, file.contents.length, true)
      localHeader.setUint16(26, name.length, true)

      localFileParts.push(
        copyBytes(new Uint8Array(localHeader.buffer)),
        name,
        file.contents,
      )
      entries.push({
        name,
        contents: file.contents,
        checksum,
        offset: localOffset,
      })
      localOffset += 30 + name.length + file.contents.length
    }

    const centralDirectoryOffset = localOffset

    for (const entry of entries) {
      const centralHeader = createHeader(46, 0x02014b50)
      centralHeader.setUint16(4, 20, true)
      centralHeader.setUint16(6, 20, true)
      centralHeader.setUint32(16, entry.checksum, true)
      centralHeader.setUint32(20, entry.contents.length, true)
      centralHeader.setUint32(24, entry.contents.length, true)
      centralHeader.setUint16(28, entry.name.length, true)
      centralHeader.setUint32(42, entry.offset, true)
      centralDirectoryParts.push(
        copyBytes(new Uint8Array(centralHeader.buffer)),
        entry.name,
      )
      localOffset += 46 + entry.name.length
    }

    const centralDirectorySize = localOffset - centralDirectoryOffset
    const endRecord = createHeader(22, 0x06054b50)
    endRecord.setUint16(8, entries.length, true)
    endRecord.setUint16(10, entries.length, true)
    endRecord.setUint32(12, centralDirectorySize, true)
    endRecord.setUint32(16, centralDirectoryOffset, true)

    return new Blob(
      [
        ...localFileParts,
        ...centralDirectoryParts,
        copyBytes(new Uint8Array(endRecord.buffer)),
      ],
      { type: 'application/zip' },
    )
  }
}
