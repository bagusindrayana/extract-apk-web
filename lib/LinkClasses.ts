import { BufferList } from "./ApkLoader";

export class LinkClasses {
    classessBuffers : BufferList[] = [];
    

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
            //regex (http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])
            const rex = new RegExp(/(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/);
            const matches = r.match(rex);
            if (matches) {
                linksArray.push(matches[0]);
            }

        }
        return linksArray;
    }
}