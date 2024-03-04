/*
 * Copyright (c) 2019 XdevL. All rights reserved.
 *
 * This work is licensed under the terms of the MIT license.
 * For a copy, see <https://opensource.org/licenses/MIT>.
 */

import { Chunk, ChunkType, parseResourceValue, StringPool } from "./common";
import {Source} from "./source";

class XmlAttribute {

  public readonly name: string;
  public readonly value: any;

  constructor(source: Source, stringPool: StringPool) {
    source.getCursorAndMove(4); // nameSpace
    this.name = stringPool.values[source.readInt()];
    source.getCursorAndMove(4); // rawValue
    this.value = parseResourceValue(source, stringPool);
  }
}

export class XmlElement {

  private static parseChildren(parent: XmlElement, root: Chunk, stringPool: StringPool) {
    const maxOffset = root.chunkSize - root.headerSize;
    while (root.chunkSource.getCursorAndMove(0) < maxOffset) {
      const chunk = new Chunk(root.chunkSource);
      switch(chunk.type) {
        case ChunkType.XML_START_ELEMENT: {
          const child = new XmlElement(chunk.chunkSource, stringPool);
          parent.children[child.tag] = parent.children[child.tag] || [];
          parent.children[child.tag].push(child);
          XmlElement.parseChildren(child, root, stringPool);
          break;
        }
        case ChunkType.XML_START_NAMESPACE:
          XmlElement.parseChildren(parent, root, stringPool);
          break;

        case ChunkType.XML_END_ELEMENT:
        case ChunkType.XML_END_NAMESPACE:
          return;
      }
    }
  }

  public readonly tag: string;
  public readonly attributes: {[key: string]: any} = {};
  public readonly children: {[key: string]: XmlElement[]} = {};

  constructor(source: Source, stringPool?: StringPool) {
    if (stringPool) {
      source.getCursorAndMove(4); // namespace
      this.tag = stringPool.values[source.readInt()].replace(/\s+/g, "").replace(/\u0000/g, "");

      const attributeStart = source.readUShort();
      const attributeSize = source.readUShort();
      const attributeCount = source.readUShort();

      source.moveAt(attributeStart);
      for (let i = 0; i < attributeCount; ++i ) {
        const attr = new XmlAttribute(source.source(attributeSize), stringPool);
        let value = attr.value;
        if(value != undefined && typeof value === "string"){
          value = value.replace(/\u0000/g, "")
        }
        let attrName = attr.name.replace(/\s+/g, "").replace(/\u0000/g, "");
        if(attrName == ""){
          if(this.tag == "uses-permission"){
            attrName = "name";
          } else {
            attrName = "undefined"+i.toString();
          }
          
        }
        this.attributes[attrName] = value;
      }
    } else {
      const chunk = new Chunk(source, ChunkType.XML)
      stringPool = new StringPool(new Chunk(chunk.chunkSource, ChunkType.STRING_POOL));
      this.tag = "xml";
      XmlElement.parseChildren(this, chunk, stringPool);
    }
  }

  public toString(): string {
    return JSON.stringify(this, null, 4);
  }

  public originalXml(): string {
    if (this.tag === "xml") {
      let xml = '';
      for (const key in this.children) {
        for (const child of this.children[key]) {
          xml += child.originalXml();
        }
      }
      return xml;
    }
    let xml = `<${this.tag}`;
    for (const key in this.attributes) {
      xml += ` ${key}="${this.attributes[key]}"`;
    }
    xml += ">\r\n";
    for (const key in this.children) {
      for (const child of this.children[key]) {
        xml += child.originalXml();
      }
    }
    xml += `\r\n</${this.tag}>`;

    //remove \u0000
    xml = xml.replace(/\u0000/g, "");



    return xml;
  }
}