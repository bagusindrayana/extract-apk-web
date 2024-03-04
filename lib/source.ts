import {Readable} from "stream";

export class Source {

  public buffer: ArrayBuffer;
  public cursor = 0;
  public view: DataView;
  public decoder: TextDecoder;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.view = new DataView(this.buffer);
    this.decoder = new TextDecoder();
  }

  public readUByte(): number {
    return this.view.getUint8(this.getCursorAndMove(1));
  }

  public readUShort(): number {
    return this.view.getUint16(this.getCursorAndMove(2), true);
  }

  public readUInt(): number {
    return this.view.getUint32(this.getCursorAndMove(4), true);
  }

  public readInt(): number {
    return this.view.getInt32(this.getCursorAndMove(4), true);
  }

  public readUtf8String(size: number): string {
    return this.decoder.decode(this.buffer.slice(this.getCursorAndMove(size), this.cursor));
  }

  public readUtf16String(size: number): string {
    // this.decoder.encoding = "utf-16";
    return this.decoder.decode(this.buffer.slice(this.getCursorAndMove(size), this.cursor));
  }

  public source(size: number) {
    return new Source(this.buffer.slice(this.getCursorAndMove(size), this.cursor));
  }

  public getCursorAndMove(offset: number): number {
    this.cursor += offset;
    return this.cursor - offset;
  }

  public moveAt(position: number) {
    this.getCursorAndMove(position - this.cursor);
  }

  public stream(size: number): Readable {
    const readable = new Readable();
    readable._read = () => undefined;
    readable.push(this.buffer.slice(this.cursor, this.cursor + size));
    readable.push(null);
    return readable;
  }
}
