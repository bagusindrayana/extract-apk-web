'use client'
import { Button } from "@/components/ui/button"
import { JSX, SVGProps } from "react"
import { FcAndroidOs } from "react-icons/fc";
import { useState } from "react";
import { ApkLoader } from '../lib/ApkLoader';
// import { TagAttribute } from '../lib/AndroidManifest';
// import { Source } from "../lib/source";
// import { XmlElement } from "../lib/xml";
// import JSZip from "jszip";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
const XmlBeautify = require('xml-beautify');

const dataPermission = require("../lib/data/permission_en.json");

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ImageIcon } from "@/lib/AndroidImages";
import Image from "next/image";


export default function Home() {
  //make state for file
  const [selectedFile, setSelectedFile] = useState<File | null>();
  const [packageName, setPackageName] = useState<string>('');
  const [labelName, setLabelName] = useState<string>('');
  const [version, setVersion] = useState<string>('');
  const [xmlContent, setXmlContent] = useState<string>('');
  const [iconSourceArray, setIconSourceArray] = useState<ImageIcon[]>([]);
  const [linkArray, setLinkArray] = useState<string[]>([]);
  const [permissinArray, setPermissionArray] = useState<string[]>([]);
  const [size, setSize] = useState<number>(0);



  function findPermission(name: string) {
    if (name == "" || name == null || name == undefined) {
      return { name: "No name", description: "No description", misuse: "No misuse" };
    }
    const permission = dataPermission.permissions.find((item: any) => item.name === name.replace("android.permission.", ""));
    if (permission) {
      return permission;
    } else {
      return { name: name, description: "No description", misuse: "No misuse" };
    }
  }

  //make handleFileChange function, accept APK file only, and max 5mb
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("File too large, max 20mb");
      } else if (file.type !== "application/vnd.android.package-archive") {
        alert("Invalid file type, only APK file allowed");
      } else {
        setSelectedFile(file);
        setSize(file.size);
        loadApk(file);
      }
    }
  };

  //load apk file with jszip, find AndroidManifest.xml, and parse it
  const loadApk = async (file: File) => {

    const apkLoader = new ApkLoader(file);
    await apkLoader.load();
    if (apkLoader.manifest) {
      const rawXml = apkLoader.manifest.raw.originalXml();
      var beautifiedXmlText = new XmlBeautify().beautify(rawXml,
        {
          indent: "  ",  //indent pattern like white spaces
          useSelfClosingElement: true //true:use self-closing element when empty element.
        });
      setXmlContent(beautifiedXmlText);
      setPackageName(apkLoader.manifest.package);

      if (typeof apkLoader.manifest.applicationLabel === 'string') {
        setLabelName(apkLoader.manifest.applicationLabel);
      } else {
        setLabelName(apkLoader.resourceTable?.getResource(apkLoader.manifest.applicationLabel) || '');
      }

      setVersion(apkLoader.manifest.versionName);
      const images = await apkLoader.getImages();
      setIconSourceArray(images);
      const links = await apkLoader.getLinks();
      setLinkArray(links);

      const listPermissions = Array.from(await apkLoader.manifest.permissions);
      setPermissionArray(listPermissions);

    }
    

  };

  return (
    <div className="w-full py-12">
      <div className="container flex flex-col gap-4 px-4 md:px-6">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold">Extract Data</h1>
          <p className="max-w-[800px] text-gray-500 md:text-base/relaxed dark:text-gray-400">
            Upload APK file to extract the data. all process is done in client side, no data will be sent to server.
          </p>
          <p>
            please be aware of the file size,max file size is 20mb, but recomended file size is less than 10mb or your browser will freeze or crash.
          </p>
        </div>
        <div className="grid gap-4">
          <label className="border-2 border-dashed rounded-lg grid h-[200px] items-center w-full border-gray-200 dark:border-gray-800">
            <input onChange={handleFileChange} type="file" className="cursor-pointer relative hidden opacity-0 w-full h-full p-20 z-50" />
            <div className="flex flex-col gap-1.5 items-center justify-center text-center">
              {(selectedFile === null || selectedFile === undefined) ? (
                <>
                  <UploadIcon className="w-10 h-10" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Drag and drop your file here or
                    <Button size="sm" className="mx-2">Browse</Button>
                  </p>
                </>
              ) : (
                <>
                  <FcAndroidOs className="w-10 h-10" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedFile?.name}
                  </p>
                </>
              )}
            </div>
          </label>

        </div>
        <div className="border rounded-lg border-gray-200 dark:border-gray-800">

          {
            xmlContent === '' ? (
              ""
            ) : (
              <>

                <div className="grid gap-2 p-4">
                  <h3 className="text-lg font-bold">Extracted Data</h3>
                  <div className="grid gap-2">
                    <div className="grid md:grid-cols-2 gap-2">
                      <div className="font-bold">Label Name</div>
                      <div>{labelName}</div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2">
                      <div className="font-bold">Package Name</div>
                      <div>{packageName}</div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2">
                      <div className="font-bold">Version</div>
                      <div>{version}</div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2">
                      <div className="font-bold">File Size</div>
                      <div>{size} bytes / { (size / 1000000).toFixed(2) } MB</div>
                    </div>
                  </div>
                </div>
                <div className="w-100 p-4">
                  <Tabs defaultValue="permission" >
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto" >
                      <TabsTrigger value="permission">Permission</TabsTrigger>
                      <TabsTrigger value="androidmanifest">AndroidManifest.xml</TabsTrigger>
                      <TabsTrigger value="icon_image">Icon & Image</TabsTrigger>
                      <TabsTrigger value="link_url">Link & Url</TabsTrigger>
                    </TabsList>
                    <TabsContent value="permission">
                      <div className="grid gap-2 w-full overflow-x-auto">
                        {
                          permissinArray.map((permission, index) => {
                            const permissionData = findPermission(permission);
                            return (
                              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 border rounded-lg border-gray-200 dark:border-gray-800">
                                <div className="flex flex-col">
                                  <div className="font-bold">Name</div>
                                  <div className="text-wrap">{permissionData.name}</div>
                                </div>
                                <div className="flex flex-col">
                                  <div className="font-bold">Description</div>
                                  <div className="text-wrap">{permissionData.description}</div>
                                  <div className="font-bold">Misuse</div>
                                  <div className="text-wrap">{permissionData.misuse}</div>
                                </div>
                              </div>
                            )
                          })
                        }
                      </div>
                    </TabsContent>
                    <TabsContent value="androidmanifest">
                      <SyntaxHighlighter language="xml" style={docco}>
                        {xmlContent}
                      </SyntaxHighlighter>
                    </TabsContent>
                    <TabsContent value="icon_image">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {
                          iconSourceArray.map((icon, index) => {
                            return (
                              <div key={index} className="flex flex-col items-center justify-center w-full p-2">
                                <Image src={icon.source} alt="icon" height={48} width={48} className="w-12 h-12" />
                                <small className="text-center">{icon.name}</small>
                              </div>
                            )
                          })
                        }
                      </div>
                    </TabsContent>
                    <TabsContent value="link_url">
                      <div className="grid gap-2 w-full overflow-x-auto">
                        {
                          linkArray.map((link, index) => {
                            return (
                              <a key={index} href={link} target="_blank" rel="noreferrer" className="text-blue-500 dark:text-blue-400">{link}</a>
                            )
                          })
                        }
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

              </>
            )
          }


        </div>
      </div>
    </div>
  )
}

function UploadIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  )
}
