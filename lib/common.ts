/*Copyright (c) 2019 XdevL. All rights reserved.

This work is licensed under the terms of the MIT license.
For a copy, see <https://opensource.org/licenses/MIT>.*/

import {Source} from "./source";

export enum ChunkType {
  NULL = 0x0000,
  STRING_POOL = 0x0001,
  TABLE = 0x0002,
  XML = 0x0003,
  XML_FIRST_CHUNK = 0x0100,
  XML_START_NAMESPACE = 0x0100,
  XML_END_NAMESPACE = 0x0101,
  XML_START_ELEMENT = 0x0102,
  XML_END_ELEMENT = 0x0103,
  XML_CDATA = 0x0104,
  XML_LAST_CHUNK = 0x017f,
  XML_RESOURCE_MAP = 0x0180,
  TABLE_PACKAGE = 0x0200,
  TABLE_TYPE = 0x0201,
  TABLE_TYPE_SPEC = 0x0202,
  TABLE_LIBRARY = 0x0203,
}

export class Chunk {

  public readonly type: number;
  public readonly headerSize: number;
  public readonly chunkSize: number;
  public readonly headerSource: Source;
  public readonly chunkSource: Source;

  constructor(source: Source, chunkType?: ChunkType) {
    this.type = source.readUShort();
    if (!chunkType || this.type === chunkType) {
      this.headerSize = source.readUShort();
      this.chunkSize = source.readUInt();
      this.headerSource = source.source(this.headerSize - 8);
      this.chunkSource = source.source(this.chunkSize - this.headerSize);
    } else {
      throw Error(`Found incorrect chunk type: ${this.type}, expected: ${chunkType}`);
    }
  }
}

export class StringPool {

  private static readUtf8String(source: Source): string {
    source.getCursorAndMove(1); // skip char length
    return source.readUtf8String(source.readUByte());
  }

  private static readUtf16String(source: Source): string {
      return source.readUtf16String(source.readUShort() * 2);
  }
  public readonly stringCount: number;
  public readonly styleCount: number;
  public readonly flags: number;
  public readonly stringsStart: number;
  public readonly stylesStart: number;
  public readonly values: string[];

  constructor(chunk: Chunk) {
    this.stringCount = chunk.headerSource.readUInt();
    this.styleCount = chunk.headerSource.readUInt();
    this.flags = chunk.headerSource.readUInt();
    this.stringsStart = chunk.headerSource.readUInt();
    this.stylesStart = chunk.headerSource.readUInt();
    this.values = [];

    const indexes: number[] = [];
    for (let i = 0; i < this.stringCount; ++i) {
      indexes.push(chunk.chunkSource.readUInt());
    }

    // TODO: make sure indexes are sorted
    for (const index of indexes) {
      chunk.chunkSource.moveAt(this.stringsStart - chunk.headerSize + index);
      if (this.flags & 256) {
        this.values.push(StringPool.readUtf8String(chunk.chunkSource));
      } else {
      this.values.push(StringPool.readUtf16String(chunk.chunkSource));
      }
    }
  }
}

enum ResourceType {
  NULL = 0x00,
  REFERENCE = 0x01,
  STRING = 0x03,
  INT_DEC = 0x10,
  INT_BOOLEAN = 0x12,
}

export function parseResourceValue(source: Source, stringPool: StringPool): any {
  source.getCursorAndMove(3); // size + res0
  const type = source.readUByte();
  switch (type) {
    case ResourceType.REFERENCE:
      return source.readInt();
    case ResourceType.STRING: {
      const index = source.readInt();
      return index >= 0 ? stringPool.values[index] : null;
    }
    case ResourceType.INT_DEC:
      return source.readInt();
    case ResourceType.INT_BOOLEAN:
      return source.readInt() === 0 ? false : true;
    default:
      return null;
  }
}