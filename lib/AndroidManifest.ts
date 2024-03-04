import * as util from './utils';


export class AndroidManifest {
  static MAGIC_NUMBER = '00080003';
  static CHUNK_TYPE_STRING = '001c0001';
  static CHUNK_TYPE_RESOURCE_ID = '00080180';
  static CHUNK_TYPE_START_NAMESPACE = '00100100';
  static CHUNK_TYPE_END_NAMESPACE = '00100101';
  static CHUNK_TYPE_START_TAG = '00100102';
  static CHUNK_TYPE_END_TAG = '00100103';
  static CHUNK_TYPE_TEXT = '00100104';

  magicNumber: string;
  fileSize: number;
  stringChunk: StringChunk;
  resourceIdChunk: ResourceIdChunk;
  xmlContentChunk: XmlContentChunk;
  
  attributes: TagAttribute[];
  label: TagAttribute | undefined;

  constructor(buffer: ArrayBuffer) {
    this.magicNumber = util.uint8ArrayToHex(new Uint8Array(buffer, 0, 4));
    this.fileSize = util.uint8ArrayToInt(new Uint8Array(buffer, 4, 4));
    // console.log(`magicNumber: ${this.magicNumber}, fileSize: ${this.fileSize}`);

    let chunkOffset = 8;
    let chunkSize = util.uint8ArrayToInt(new Uint8Array(buffer, chunkOffset+4*1, 4));
    this.stringChunk = new StringChunk(new Uint8Array(buffer, chunkOffset, chunkSize));
    // console.log('stringChunk', this.stringChunk);

    chunkOffset += chunkSize;
    chunkSize = util.uint8ArrayToInt(new Uint8Array(buffer, chunkOffset+4*1, 4));
    this.resourceIdChunk = new ResourceIdChunk(new Uint8Array(buffer, chunkOffset, chunkSize));
    // console.log('resourceIdChunk', this.resourceIdChunk);

    let chunkType = '';
    chunkOffset += chunkSize;
    const chunks: Chunk[] = [];
    let startTagChunk: StartTagChunk | null = null;
    this.attributes = [];
    for(;chunkOffset<this.fileSize;) {
      chunkType = util.uint8ArrayToHex(new Uint8Array(buffer, chunkOffset+4*0, 4));
      chunkSize = util.uint8ArrayToInt(new Uint8Array(buffer, chunkOffset+4*1, 4));
      if (chunkSize <= 0) {
        break;
      }
      
      if (chunkType === AndroidManifest.CHUNK_TYPE_START_NAMESPACE) {
        chunks.push(new StartNamespaceChunk(new Uint8Array(buffer, chunkOffset, chunkSize)));
      } else
      if (chunkType === AndroidManifest.CHUNK_TYPE_END_NAMESPACE) {
        chunks.push(new EndNamespaceChunk(new Uint8Array(buffer, chunkOffset, chunkSize)));
      } else
      if (chunkType === AndroidManifest.CHUNK_TYPE_START_TAG) {
        startTagChunk = new StartTagChunk(new Uint8Array(buffer, chunkOffset, chunkSize));
        chunks.push(startTagChunk);
        this.attributes.push(...startTagChunk.attributes);
        if (this.stringChunk.stringPool[startTagChunk.name] === 'application') {
          const attribute = startTagChunk.attributes.find(e => this.stringChunk.stringPool[e.name] === 'label');
          // console.log('atrribute', attribute)
          this.label = attribute;
        }
      } else
      if (chunkType === AndroidManifest.CHUNK_TYPE_END_TAG) {
        chunks.push(new EndTagChunk(new Uint8Array(buffer, chunkOffset, chunkSize)));
      } else
      if (chunkType === AndroidManifest.CHUNK_TYPE_TEXT) {
        chunks.push(new TextChunk(new Uint8Array(buffer, chunkOffset, chunkSize)));
      }

      // next loop
      chunkOffset += chunkSize;
    }
    this.xmlContentChunk = new XmlContentChunk();
    this.xmlContentChunk.chunks = chunks;

    // console.log(this);
  }

  public getStringValue(index: number): string {
    return this.stringChunk.stringPool[index];
  }
  public getTagAttribute(name: string): TagAttribute | undefined{
    return this.attributes.find(e => this.stringChunk.stringPool[e.name] === name && e.valueString > 0);
  }
  public getTagAttributeValue(name: string): string {
    const atrribute = this.getTagAttribute(name);
    return atrribute ? this.stringChunk.stringPool[atrribute.valueString] : '';
  }
  public getLabelAttribute(): TagAttribute| undefined {
    return this.label;
  }

  public getOriginalXML(): string {
    //get xml structure as string
    let result = '';
    let indent = 0;
    let startTagLineNo = -2;
    for (let chunk of this.xmlContentChunk.chunks as Chunk[]) {
      if (chunk instanceof StartTagChunk) {
        startTagLineNo = chunk.lineNumber;
        let sb = '';
        for (let attribute of chunk.attributes) {
          let attrName = this.stringChunk.stringPool[attribute.name];
          let attrValue = attribute.valueString > 0 ? this.stringChunk.stringPool[attribute.valueString] : attribute.valueString.toString();
          sb += ` ${attrName}="${attrValue}"`;
        }
        result += `${'  '.repeat(indent)}<${this.stringChunk.stringPool[chunk.name]}${sb}>\r\n`;
        indent++;
      } else if (chunk instanceof EndTagChunk) {
        indent--;
        result += `${'  '.repeat(indent)}</${this.stringChunk.stringPool[chunk.name]}>\r\n`;
      }
    }
    return result;
  }

  public getAllPermissions(): string[] {
    const permissions: string[] = [];
    for (let chunk of this.xmlContentChunk.chunks as Chunk[]) {
      if (chunk instanceof StartTagChunk) {
        if (this.stringChunk.stringPool[chunk.name] === 'uses-permission') {
          const permission = this.stringChunk.stringPool[chunk.attributes[0].valueString];
          permissions.push(permission);
        }
      }
    }
    return permissions;  
  }

}



abstract class Chunk {
  chunkType: string | undefined;
  chunkSize: number | undefined;
}
class StringChunk {
  static UTF8_FLAG: number = 1 << 8;

  chunkType: string;
  chunkSize: number;
  stringCount: number;
  styleCount: number;
  flags: number;
  stringPoolOffset: number;
  stylePoolOffset: number;
  stringOffsets: number[];
  styleOffsets:number [];
  stringPool: string[];
  stylePool: string[];

  constructor(array: Uint8Array) {
    // super();
    this.chunkType = util.uint8ArrayToHex(array.subarray(4*0, 4*1));
    this.chunkSize = util.uint8ArrayToInt(array.subarray(4*1, 4*2));
    this.stringCount = util.uint8ArrayToInt(array.subarray(4*2, 4*3));
    this.styleCount = util.uint8ArrayToInt(array.subarray(4*3, 4*4));
    this.flags = util.uint8ArrayToInt(array.subarray(4*4, 4*5));
    this.stringPoolOffset = util.uint8ArrayToInt(array.subarray(4*5, 4*6));
    this.stylePoolOffset = util.uint8ArrayToInt(array.subarray(4*6, 4*7));

    const utf8: boolean = (this.flags & StringChunk.UTF8_FLAG) != 0;
    // console.log('flags', this.flags, 'utf8', utf8);

    // stringOffsets
    this.stringOffsets = [];
    let offset = 0;
    for(let i=0; i<this.stringCount; i++) {
      offset = util.uint8ArrayToInt(array.subarray(4*(7+i), 4*(8+i)));
      this.stringOffsets.push(offset);
    }

    // styleOffsets
    this.styleOffsets = [];
    // TODO

    // stringPool
    this.stringPool = [];
    let str = '';
    let length = 0;
    // offset = this.stringPoolOffset;
    for(let i=0; i < this.stringCount; i++) {
      offset = this.stringPoolOffset + this.stringOffsets[i];
      if (utf8) {
        length = array[offset+1] & 0x7F; // 头2位的最后1个字节表示字符串长度
      } else {
        length = util.uint8ArrayToShort(array.subarray(offset, offset+2))*2; // 头2位表示字符串长度，并且一个字符占2个字节
      }
      str = util.uint8ArrayToStr(array.subarray(offset+2, offset+2+length), utf8);
      // console.log('index=',i,'length=',length,'str=',str);

      this.stringPool.push(str);

      // offset += length + 4;
    }

    // stylePool
    this.stylePool = [];
    // TODO
  }
}
class ResourceIdChunk {
  chunkType: string;
  chunkSize: number;
  resourceIds: number[];
  constructor(array: Uint8Array) {
    // super();
    this.chunkType = util.uint8ArrayToHex(array.subarray(4*0, 4*1));
    this.chunkSize = util.uint8ArrayToInt(array.subarray(4*1, 4*2));

    // resourceIds
    this.resourceIds = [];
    let offset = 0;
    let id = 0;
    const size = this.chunkSize/4 - 2;
    for(let i=0; i < size; i++) {
      offset = 4*2 + 4*i;
      id = util.uint8ArrayToInt(array.subarray(offset, offset+4));
      // console.log('index=',i,'id=',id);
      this.resourceIds.push(id);
    }
  }
}
class XmlContentChunk {
  chunks: Chunk[] | undefined;
}
class StartNamespaceChunk {
  chunkType: string;
  chunkSize: number;
  lineNumber: number;
  unknown: string;
  prefix: number;
  uri: number;
  constructor(array: Uint8Array) {
    // super();
    this.chunkType = util.uint8ArrayToHex(array.subarray(4*0, 4*1));
    this.chunkSize = util.uint8ArrayToInt(array.subarray(4*1, 4*2));
    this.lineNumber = util.uint8ArrayToInt(array.subarray(4*2, 4*3));
    this.unknown = util.uint8ArrayToHex(array.subarray(4*3, 4*4));
    this.prefix = util.uint8ArrayToInt(array.subarray(4*4, 4*5));
    this.uri = util.uint8ArrayToInt(array.subarray(4*5, 4*6));
  }
}
class EndNamespaceChunk {
  chunkType: string;
  chunkSize: number;
  lineNumber: number;
  unknown: string;
  prefix: number;
  uri: number;
  constructor(array: Uint8Array) {
    // super();
    this.chunkType = util.uint8ArrayToHex(array.subarray(4*0, 4*1));
    this.chunkSize = util.uint8ArrayToInt(array.subarray(4*1, 4*2));
    this.lineNumber = util.uint8ArrayToInt(array.subarray(4*2, 4*3));
    this.unknown = util.uint8ArrayToHex(array.subarray(4*3, 4*4));
    this.prefix = util.uint8ArrayToInt(array.subarray(4*4, 4*5));
    this.uri = util.uint8ArrayToInt(array.subarray(4*5, 4*6));
  }
}
class StartTagChunk {
  chunkType: string;
  chunkSize: number;
  lineNumber: number;
  unknown: string;
  namespaceUri: number;
  name: number;
  flags: string;
  attributeCount: number;
  classAtrribute: string;
  attributes: TagAttribute[];
  constructor(array: Uint8Array) {
    // super();
    this.chunkType = util.uint8ArrayToHex(array.subarray(4*0, 4*1));
    this.chunkSize = util.uint8ArrayToInt(array.subarray(4*1, 4*2));
    this.lineNumber = util.uint8ArrayToInt(array.subarray(4*2, 4*3));
    this.unknown = util.uint8ArrayToHex(array.subarray(4*3, 4*4));
    this.namespaceUri = util.uint8ArrayToInt(array.subarray(4*4, 4*5));
    this.name = util.uint8ArrayToInt(array.subarray(4*5, 4*6));
    this.flags = util.uint8ArrayToHex(array.subarray(4*6, 4*7));
    this.attributeCount = util.uint8ArrayToInt(array.subarray(4*7, 4*8));
    this.classAtrribute = util.uint8ArrayToHex(array.subarray(4*8, 4*9));

    // atrributes
    this.attributes = [];
    let offset = 0;
    for(let i=0; i < this.attributeCount; i++) {
      offset = 4*9 + 4*5*i;
      this.attributes.push(new TagAttribute(array.subarray(offset+4*0, offset+4*5)));
      // console.log('index=',i,'atrribute=',this.atrributes[i]);
    }
  }
}
class EndTagChunk {
  chunkType: string;
  chunkSize: number;
  lineNumber: number;
  unknown: string;
  namespaceUri: number;
  name: number;
  constructor(array: Uint8Array) {
    // super();
    this.chunkType = util.uint8ArrayToHex(array.subarray(4*0, 4*1));
    this.chunkSize = util.uint8ArrayToInt(array.subarray(4*1, 4*2));
    this.lineNumber = util.uint8ArrayToInt(array.subarray(4*2, 4*3));
    this.unknown = util.uint8ArrayToHex(array.subarray(4*3, 4*4));
    this.namespaceUri = util.uint8ArrayToInt(array.subarray(4*4, 4*5));
    this.name = util.uint8ArrayToInt(array.subarray(4*5, 4*6));
  }
}
class TextChunk {
  chunkType: string;
  chunkSize: number;
  lineNumber: number;
  unknown1: string;
  name: number;
  unknown2: string;
  unknown3: string;
  constructor(array: Uint8Array) {
    // super();
    this.chunkType = util.uint8ArrayToHex(array.subarray(4*0, 4*1));
    this.chunkSize = util.uint8ArrayToInt(array.subarray(4*1, 4*2));
    this.lineNumber = util.uint8ArrayToInt(array.subarray(4*2, 4*3));
    this.unknown1 = util.uint8ArrayToHex(array.subarray(4*3, 4*4));
    this.name = util.uint8ArrayToInt(array.subarray(4*4, 4*5));
    this.unknown2 = util.uint8ArrayToHex(array.subarray(4*5, 4*6));
    this.unknown3 = util.uint8ArrayToHex(array.subarray(4*6, 4*7));
  }
}
export class TagAttribute {
  static ATTR_REFERENCE: number 	= 1;
	static ATTR_ATTRIBUTE: number 	= 2;
  static ATTR_STRING: number 	= 3;
  
  namespaceUri: number;
  name: number;
  valueString: number;
  type : number;
  data: number;

  constructor(array: Uint8Array) {
    this.namespaceUri = util.uint8ArrayToInt(array.subarray(4*0, 4*1));
    this.name = util.uint8ArrayToInt(array.subarray(4*1, 4*2));
    this.valueString = util.uint8ArrayToInt(array.subarray(4*2, 4*3));
    this.type = util.uint8ArrayToInt(array.subarray(4*3, 4*4)) >> 24; // 在获取到type值的时候需要右移24位
    this.data = util.uint8ArrayToInt(array.subarray(4*4, 4*5));
  }
}