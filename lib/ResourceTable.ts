import * as util from './utils';

export class ResourceTable {
  tableType: string;
  headerSize: number;
  fileSize: number;
  packageCount: number;
  stringPool: StringPool;
  package: Package; // 实际是数组

  constructor(buffer: ArrayBuffer) {
    this.tableType = util.uint8ArrayToHex(new Uint8Array(buffer, 0, 2));
    this.headerSize = util.uint8ArrayToShort(new Uint8Array(buffer, 2, 2));
    this.fileSize = util.uint8ArrayToInt(new Uint8Array(buffer, 4, 4));
    this.packageCount = util.uint8ArrayToInt(new Uint8Array(buffer, 8, 4));
    // console.log('tableType', this.tableType, 'headerSize', this.headerSize, 'fileSize', this.fileSize, 'packageCount', this.packageCount);

    let chunkOffset = 12;
    let chunkSize = util.uint8ArrayToInt(new Uint8Array(buffer, chunkOffset+4*1, 4));
    this.stringPool = new StringPool(new Uint8Array(buffer, chunkOffset, chunkSize));
    // console.log('stringPool', this.stringPool);

    chunkOffset += chunkSize;
    chunkSize = util.uint8ArrayToInt(new Uint8Array(buffer, chunkOffset+4*1, 4));
    this.package = new Package(new Uint8Array(buffer, chunkOffset, chunkSize));
    // console.log('package', this.package);

    // console.log('ResourceTable', this);
  }

  public getResource(resourceId: number): string {
    const packageId = (resourceId >> 24 & 0xff);
    const typeId = ((resourceId >> 16) & 0xff);
    const entryIndex =  (resourceId & 0xffff);
    // console.log('packageId', packageId, 'typeId', typeId, 'entryIndex', entryIndex);
    if (this.package.id !== packageId) {
      return '';
    }
    
    let type: Type;
    let value: string = '';
    for(let i=0; i<this.package.typeArray.length; i++) {
      type = this.package.typeArray[i];
      if (type && type.id === typeId && type.entryArray[entryIndex]) {
        value = this.stringPool.stringPool[type.entryArray[entryIndex].dataValue];
        if (value && value.length>0) {
          return value;
        }
      }
    }

    return '';
  }
}

class StringPool {
  static UTF8_FLAG: number = 1 << 8;

  chunkType: string;
  chunkHeaderSize: number;
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
    this.chunkType = util.uint8ArrayToHex(array.subarray(0, 2));
    this.chunkHeaderSize = util.uint8ArrayToShort(array.subarray(2, 4));
    this.chunkSize = util.uint8ArrayToInt(array.subarray(4*1, 4*2));
    this.stringCount = util.uint8ArrayToInt(array.subarray(4*2, 4*3));
    this.styleCount = util.uint8ArrayToInt(array.subarray(4*3, 4*4));
    this.flags = util.uint8ArrayToInt(array.subarray(4*4, 4*5));
    this.stringPoolOffset = util.uint8ArrayToInt(array.subarray(4*5, 4*6));
    this.stylePoolOffset = util.uint8ArrayToInt(array.subarray(4*6, 4*7));

    const utf8: boolean = (this.flags & StringPool.UTF8_FLAG) != 0;
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
    }

    // stylePool
    this.stylePool = [];
    // TODO
  }
}
class Package {
  static TYPE: string = '0201';
  static TYPE_SPEC: string = '0202';

  chunkType: string;
  chunkHeaderSize: number;
  chunkSize: number;
  id: number;
  name: string;
  typeOffset: number;
  lastType: number;
  keyOffset: number;
  lastKey: number;
  typePool: StringPool;
  keyPool: StringPool;
  typeSpecArray: TypeSpec[];
  typeArray: Type[];

  constructor(array: Uint8Array) {
    // super();
    this.chunkType = util.uint8ArrayToHex(array.subarray(0, 2));
    this.chunkHeaderSize = util.uint8ArrayToShort(array.subarray(2, 4));
    this.chunkSize = util.uint8ArrayToInt(array.subarray(4*1, 4*2));
    this.id = util.uint8ArrayToInt(array.subarray(4*2, 4*3));
    this.name = util.utf8ArrayToStr(array.subarray(4*3, 4*(3+256/4))); // 3+256/4 => 67
    this.typeOffset = util.uint8ArrayToInt(array.subarray(4*67, 4*68));
    this.lastType = util.uint8ArrayToInt(array.subarray(4*68, 4*69));
    this.keyOffset = util.uint8ArrayToInt(array.subarray(4*69, 4*70));
    this.lastKey = util.uint8ArrayToInt(array.subarray(4*70, 4*71));

    // typePool
    this.typePool = new StringPool(array.subarray(this.typeOffset));
    // console.log('typePool', this.typePool);

    // keyPool
    this.keyPool = new StringPool(array.subarray(this.keyOffset));
    // console.log('keyPool', this.keyPool);

    // typeSpecArray & typeArray
    this.typeSpecArray = [];
    this.typeArray = [];

    let chunkType = '';
    let chunkOffset = this.chunkHeaderSize + this.typePool.chunkSize + this.keyPool.chunkSize;
    let chunkSize = 0;
    for(;chunkOffset<this.chunkSize;) {
      chunkType = util.uint8ArrayToHex(array.subarray(chunkOffset, chunkOffset+2));
      chunkSize = util.uint8ArrayToInt(array.subarray(chunkOffset+4, chunkOffset+8));
      // console.log('chunkType', chunkType, 'chunkSize', chunkSize, 'chunkOffset', chunkOffset, 'max', this.chunkSize);
      if (chunkSize <= 0) {
        console.log('skip, chunkSize', chunkSize, 'chunkType', chunkType);
        break;
      }

      if (chunkType === Package.TYPE) {
        this.typeArray.push(new Type(array.subarray(chunkOffset, chunkOffset + chunkSize)));
      } else
      if (chunkType === Package.TYPE_SPEC) {
        this.typeSpecArray.push(new TypeSpec(array.subarray(chunkOffset, chunkOffset + chunkSize)));
      } else {
        console.log('not support type', chunkType);
      }

      // next loop
      chunkOffset += chunkSize;
    }

    // console.log('Package', this);
  }
}
class TypeSpec {
  chunkType: string;
  chunkHeaderSize: number;
  chunkSize: number;
  id: number;
  entryCount: number;
  entryArray: number[];

  constructor(array: Uint8Array) {
    // super();
    this.chunkType = util.uint8ArrayToHex(array.subarray(0, 2));
    this.chunkHeaderSize = util.uint8ArrayToShort(array.subarray(2, 4));
    this.chunkSize = util.uint8ArrayToInt(array.subarray(4*1, 4*2));

    const bytes = array.subarray(4*2, 4*3);
    this.id = bytes[0] & 0xFF;

    this.entryCount = util.uint8ArrayToInt(array.subarray(4*3, 4*4));

    let offset: number = this.chunkHeaderSize;
    // entryArray
    this.entryArray = [];
    for(let i=0; i<this.entryCount; i++) {
      offset = this.chunkHeaderSize + 4*i;
      this.entryArray.push(util.uint8ArrayToInt(array.subarray(offset, offset + 4)));
    }
  }
}
class Type {
  chunkType: string;
  chunkHeaderSize: number;
  chunkSize: number;
  id: number;
  entryCount: number;
  entryPoolOffset: number;
  entryOffsets: number[];
  entryArray: Entry[];

  constructor(array: Uint8Array) {
    // super();
    this.chunkType = util.uint8ArrayToHex(array.subarray(0, 2));
    this.chunkHeaderSize = util.uint8ArrayToShort(array.subarray(2, 4));
    this.chunkSize = util.uint8ArrayToInt(array.subarray(4*1, 4*2));

    const bytes = array.subarray(4*2, 4*3);
    this.id = bytes[0] & 0xFF;

    this.entryCount = util.uint8ArrayToInt(array.subarray(4*3, 4*4));
    this.entryPoolOffset = util.uint8ArrayToInt(array.subarray(4*4, 4*5));

    // Config
    // TODO size=48

    let offset: number = this.chunkHeaderSize;
    // entryOffsets
    this.entryOffsets = [];
    for(let i=0; i<this.entryCount; i++) {
      offset = this.chunkHeaderSize + 4*i;
      this.entryOffsets.push(util.uint8ArrayToInt(array.subarray(offset, offset + 4)));
    }

    // entryArray
    this.entryArray = [];
    let entry: Entry;
    for(let i=0; i<this.entryCount; i++) {
      offset = this.entryPoolOffset + this.entryOffsets[i];
      entry = new Entry(array.subarray(offset));
      if (entry.size === 8 || entry.size === 16) {
        this.entryArray.push(entry);
      } else {
        // console.log(entry, util.uint8ArrayToHex(array.subarray(offset, offset+16)))
      }
    }
  }
}
class Entry {
  static FLAG_COMPLEX: number = 0x0001;

  size: number;
  flags: number;
  index: number;
  dataSize: number;
  dataType: number;
  dataValue: number;

  constructor(array: Uint8Array) {
    // super();
    this.size = util.uint8ArrayToShort(array.subarray(0, 2));
    this.flags = util.uint8ArrayToShort(array.subarray(2, 4));
    this.index = util.uint8ArrayToShort(array.subarray(4*1, 4*2));

    let offset = 4*2;
    if ((this.flags & Entry.FLAG_COMPLEX) === 0) {
      this.dataSize = util.uint8ArrayToShort(array.subarray(offset+0, offset+2));
      this.dataType = array[offset+3] & 0xFF;
      this.dataValue = util.uint8ArrayToShort(array.subarray(offset+4, offset+8));
    } else {
      // TODO
      this.dataSize = -1;
      this.dataType = -1;
      this.dataValue = -1;
    }
  }
}