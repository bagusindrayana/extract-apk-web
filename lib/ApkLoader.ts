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
            if (key.endsWith('.png') || key.endsWith('.webp') || key.endsWith('.jpg') || key.endsWith('.jpeg') || key.endsWith('.gif') || key.endsWith('.bmp') || key.endsWith('.wbmp') || key.endsWith('.ico') || key.endsWith('.svg')){
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
    }

    public async getImages() : Promise<ImageIcon[]> {
        let iconSourceArray: ImageIcon[] = [];
        for (let i = 0; i < this.iconImagesBuffers.length; i++) {
            var r = await new Promise<string>((resolve, reject) => {
                let arrayBuffer = this.iconImagesBuffers[i];
                let blob = new Blob([arrayBuffer.buffer], { type: this.getExtensionImage(arrayBuffer.name) });
                
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

    private getExtensionImage(filename: string) : string {
        const ext = filename.split('.').pop();
        switch (ext) {
            case "png":
                return "image/png";
                break;
            case "webp":
                return "image/webp";
                break;
            case "jpg":
                return "image/jpeg";
                break;
            case "jpeg":
                return "image/jpeg";
                break;
            case "gif":
                return "image/gif";
                break;
            case "bmp":
                return "image/bmp";
                break;
            case "wbmp":
                return "image/vnd.wap.wbmp";
                break;
            case "ico":
                return "image/vnd.microsoft.icon";
                break;
            case "svg":
                return "image/svg+xml";
                break;
            default:
                return "image/png";
                break;
        }
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

            if(matches){
                for (const match of matches) {
                    linksArray.push(match[0]);
                }
            }
            
            

        }
        return linksArray;
    }

}