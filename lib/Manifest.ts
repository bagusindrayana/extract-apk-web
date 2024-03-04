
import {XmlElement} from "./xml";
export class Manifest {

  private readonly xml: XmlElement;

  constructor(xml: XmlElement) {
    this.xml = xml.children.manifest[0];
  }

  get raw(): XmlElement {
    return this.xml;
  }

  get versionCode(): number {
    return Number(this.xml.attributes.versionCode);
  }

  get versionName(): string {
    return this.xml.attributes.versionName;
  }

  get package(): string {
    return this.xml.attributes.package;
  }

  get applicationLabel(): string | number {
    return this.xml.children.application[0].attributes.label;
  }

  get applicationIcon(): number {
    return this.xml.children.application[0].attributes.icon;
  }

  get permissions(): Iterable<string> {
    const permissions = this.xml.children["uses-permission"] || [];
    return (function*() {
      for (const permission of permissions) {
        yield permission.attributes.name;
      }
    })();
  }

}