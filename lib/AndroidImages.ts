import { ImageIcon } from "lucide-react";
import { BufferList } from "./ApkLoader";

export interface ImageIcon {
    name: string;
    source: string;
}

export class AndroidImages {
    iconImagesBuffers : BufferList[] = [];

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
    
}