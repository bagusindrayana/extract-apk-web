import JSZip from "jszip";
// import { AndroidManifest } from './AndroidManifest';
import * as util from './utils';
import { Manifest } from "./Manifest";
import { XmlElement } from "./xml";
import { Source } from "./source";
import { ResourceTable } from "./ResourceTable";
import { ImageIcon } from "./AndroidImages";

export interface BufferList {
    name: string;
    buffer: ArrayBuffer;
}




export class ApkLoader {
    file: File;
    manifest: Manifest | undefined;
    resourceTable: ResourceTable | undefined;
    iconImagesBuffers : BufferList[] = [];
    classessBuffers : BufferList[] = [];

    constructor(file: File) {
        this.file = file;
    }

    public async load() {
        const zip = new JSZip();
        const buffer = await this.file.arrayBuffer();
        const zipFile = await zip.loadAsync(buffer);

        //loop files
        for (const [key, value] of Object.entries(zipFile.files)) {
            if (key.endsWith('.png') || key.endsWith('.webp')) {
                const imageBuffer = await value.async("arraybuffer");
                let bl : BufferList = {name: key, buffer: imageBuffer};
                this.iconImagesBuffers.push(bl);
            } else if(key.startsWith('classes')) {
                const classBuffer = await value.async("arraybuffer");
                let bl : BufferList = {name: key, buffer: classBuffer};
                this.classessBuffers.push(bl);
            }
        }

        const manifestBinary = await zipFile.file("AndroidManifest.xml");
        const manifestBuffer = await manifestBinary?.async("arraybuffer");

        if (manifestBuffer) {
            const xmlElement = new Manifest(new XmlElement(new Source(manifestBuffer)));
            this.manifest = xmlElement;
        }

        const resourcesBinary = await zipFile.file("resources.arsc");
        const resourcesBuffer = await resourcesBinary?.async("arraybuffer");
        if (resourcesBuffer !== undefined) {
            var r = new ResourceTable(resourcesBuffer);
            this.resourceTable = r;

        }

        //convert binary to original XML content
        // const manifestBuffer = await manifestBinary?.async("arraybuffer");
        // if (manifestBuffer !== undefined) {
        //     let magicNumber: string = util.uint8ArrayToHex(new Uint8Array(manifestBuffer, 0, 4));
        //     if (magicNumber === AndroidManifest.MAGIC_NUMBER) {
        //         var manifest = new AndroidManifest(manifestBuffer);
        //         this.androidManifest = manifest;
        //     }

        // }
    }

    public async getImages() : Promise<ImageIcon[]> {
        let iconSourceArray: ImageIcon[] = [];
        for (let i = 0; i < this.iconImagesBuffers.length; i++) {
            var r = await new Promise<string>((resolve, reject) => {
                let arrayBuffer = this.iconImagesBuffers[i];
                let blob = new Blob([arrayBuffer.buffer], { type: "image/png" });
                // let urlCreator = window.URL || window.webkitURL;
                // let imageUrl = urlCreator.createObjectURL(blob);
                // iconSourceArray.push(imageUrl);
                
                //convert to base64
                let reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = function() {
                    let base64data = reader.result;
                    resolve(base64data as string);
                }
            });
            const ii : ImageIcon = {name: this.iconImagesBuffers[i].name, source: r};
            iconSourceArray.push(ii);
            

        }
        return iconSourceArray;
    }

    public async getLinks() : Promise<string[]> {
        let linksArray: string[] = [];
        for (let i = 0; i < this.classessBuffers.length; i++) {
            var r = await new Promise<string>((resolve, reject) => {
                let arrayBuffer = this.classessBuffers[i];
                let blob = new Blob([arrayBuffer.buffer], { type: "text/plain" });
                let reader = new FileReader();
                reader.readAsText(blob);
                reader.onloadend = function() {
                    let base64data = reader.result;
                    resolve(base64data as string);
                }
            });
            //regex find all /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm
            const rex = new RegExp(/(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/g);
            const matches = r.matchAll(rex);
            // if (matches) {
            //     linksArray.push(matches[0]);
            // }
            if(matches){{
                for (const match of matches) {
                    linksArray.push(match[0]);
                }
            }}
            console.log(matches);
            
            

        }
        return linksArray;
    }

}