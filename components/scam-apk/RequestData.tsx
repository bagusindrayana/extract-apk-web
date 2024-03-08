'use client'

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"



export default class RequestData {
    Url: string;
    Title: string;
    loading: boolean = false;
    data: any = null;

    constructor(Url: string, Title?: string) {
        this.Url = Url;
        this.Title = Title ?? "Data";
        this.loading = false;
        this.data = null;

    }

    public async req() {
        await new Promise(resolve => setTimeout(resolve,1000));
        this.loading = true;
        const url = this.Url;
        const response = await fetch(url);
        const data = await response.json();
        if (response.ok) {
            this.data = data;
        } else {
            this.data = {
                "error": "Failed to get information from Telegram API. Bot Description : " + data.description
            }
        }
        this.loading = false;
    }

}



//   export default function RequestData({ Url,Title,load,waitLoadFunc }: { Url: string, Title?: string, load?: boolean,waitLoadFunc?: Function}) {
//     const [loading, setLoading] = useState(false);
//     const [data, setData] = useState<any>(null);
//     const requestData = async () => {
//         setLoading(true);
//         //https://api.telegram.org/botToken/getMe
//         const url = Url;
//         const response = await fetch(url);
//         const data = await response.json();
//         if (response.ok) {
//             setData(data);
//         } else {
//             setData({
//                 "error": "Failed to get information from Telegram API. Bot Description : " + data.description
//             })
//         }
//         setLoading(false);
//     }

//     //on componetn load
//     if(load){
//         requestData()
//     }

//     const generateTableFromJson = (json: any) => {
//         return (
//             <Table>
//                 <TableCaption>{Title??"Data"}</TableCaption>
//                 <TableHead>
//                     <TableRow>
//                         <TableHeader>Key</TableHeader>
//                         <TableHeader>Value</TableHeader>
//                     </TableRow>
//                 </TableHead>
//                 <TableBody>
//                     {Object.keys(json).map((key, index) => {
//                         return (
//                             <TableRow key={index}>
//                                 <TableCell>{key}</TableCell>
//                                 <TableCell>{json[key]}</TableCell>
//                             </TableRow>
//                         )
//                     })}
//                 </TableBody>
//             </Table>
//         )
//     }

//     return (
//         <div>
//             {loading && (
//                     <div className="loader-2 w-full"></div>
//                 )}
//             {data && generateTableFromJson(data)}
//         </div>
//     )
//   }