'use client'
import { Button } from "@/components/ui/button"
import { JSX, SVGProps, useEffect } from "react"
import { FcAndroidOs } from "react-icons/fc";
import { useState } from "react";
import { ApkLoader } from '../lib/ApkLoader';
// import { TagAttribute } from '../lib/AndroidManifest';
// import { Source } from "../lib/source";
// import { XmlElement } from "../lib/xml";
// import JSZip from "jszip";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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
  const [apkLoader, setApkLoader] = useState<ApkLoader | null>();

  const [selectedFile, setSelectedFile] = useState<File | null>();
  const [packageName, setPackageName] = useState<string>('');
  const [labelName, setLabelName] = useState<string>('');
  const [version, setVersion] = useState<string>('');
  const [xmlContent, setXmlContent] = useState<string>('');
  const [iconSourceArray, setIconSourceArray] = useState<ImageIcon[]>([]);
  const [linkArray, setLinkArray] = useState<string[]>([]);
  const [permissinArray, setPermissionArray] = useState<string[]>([]);
  const [size, setSize] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);

  const [searchResults, setSearchResults] = useState<string[]>([]);

  useEffect(() => {
    if(apkLoader) {
      loadApk();
    }
  }, [apkLoader]);



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

  const handleDrag = function (e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // triggers when file is dropped
  const handleDrop = function (e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleFile = function (file: File) {
    if (file) {
      const ext = file.name.split('.').pop();
      if (file.size > 50 * 1024 * 1024) {
        alert("File too large, max 50mb");
      } else if (file.type.toLowerCase() == "application/vnd.android.package-archive" || ext?.toLowerCase() == "apk") {
        setSelectedFile(file);
        setSize(file.size);
        try {
          const n = new ApkLoader(file);
          setApkLoader(n);
          
        } catch (error) {
          //console.error(error);
          alert("Failed to load APK file");
        }
      } else {
        alert("Invalid file type, only APK file allowed, your file is " + file.type);
      }
    }
  }

  //load apk file with jszip, find AndroidManifest.xml, and parse it
  const loadApk = async () => {
    
    if (!apkLoader) {
      alert("Failed to load APK file");
      return;
    }
    await apkLoader.load();
    if (apkLoader.manifest) {
      try {
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

        const listPermissions = Array.from(await apkLoader.manifest.permissions);
        setPermissionArray(listPermissions);
      } catch (error) {
        //console.error(error);
        alert("Failed to load XML data");
      }

      try {
        const images = await apkLoader.getImages();
        setIconSourceArray(images);
      } catch (error) {
        //console.error(error);
        alert("Failed to load image data");
      }

      try {
        const links = await apkLoader.getLinks();
        setLinkArray(links);
      } catch (error) {
        //console.error(error);
        alert("Failed to load link data");
      }

    } else {
      alert("Failed to load data inside APK file");
    }
  };

    const stringToRegex = (str:string) => {
      const mainMatch = str.match(/\/(.+)\/.*/);
      const main = mainMatch ? mainMatch[1] : '';
      return main
  }

  //custom search
  const handleSearch =  async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    //search input
    const search = (document.getElementById('search-input') as HTMLInputElement).value;
    if(search === "") {
      alert("Search input is empty");
      return;
    };
    //regex search
    const useRegex = (document.getElementById('regex-search') as HTMLButtonElement).getAttribute('aria-checked');
    //console.log(useRegex);
    if (useRegex == "true") {
      //validate regex
      try {
        const r = new RegExp(search, "gm");
        //console.log(r);
        const results = await apkLoader?.customSearch(r);
        //console.log(results);
        if(results){
          setSearchResults(results);
        }
      } catch (e) {
        //console.error(e);
        alert("Invalid regex pattern");
        return;
      }

    } else {
      const results = await apkLoader?.customSearch(search);
      //console.log(results);
      if(results){
        setSearchResults(results);
      }
    }

  }

  return (
    <div className="w-full py-12 height-content">
      <div className="container flex flex-col gap-4 px-4 md:px-6">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold">Extract Data</h1>
          <p className="max-w-[800px] text-gray-500 md:text-base/relaxed dark:text-gray-400">
            Upload APK file to extract the data. all process is done in client side, no data will be sent to server.
          </p>
          <p>
            please be aware of the file size,max file size is 50MB, but recomended file size is less than 20MB or your browser will freeze or crash.
          </p>
        </div>
        <div className="grid gap-4">
          <label onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className="border-2 border-dashed rounded-lg grid h-[200px] items-center w-full border-gray-200 dark:border-gray-800">
            <input onChange={handleFileChange} accept="application/vnd.android.package-archive,.apk" type="file" className="cursor-pointer relative hidden opacity-0 w-full h-full p-20 z-50" />
            <div className="flex flex-col gap-1.5 items-center justify-center text-center">
              {(selectedFile === null || selectedFile === undefined) ? (
                <>
                  <UploadIcon className="w-10 h-10" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Drag and drop your file here or
                    <Button size="sm" className="mx-2" onClick={
                      () => {
                        (document.querySelector('input[type="file"]') as HTMLInputElement)?.click();
                      }
                    }>Browse</Button>
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
                      <div>{size} bytes / {(size / 1000000).toFixed(2)} MB</div>
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
                      <TabsTrigger value="custom_search">Custom Search</TabsTrigger>
                    </TabsList>
                    <TabsContent value="permission">
                      <div className="grid gap-2 overflow-x-auto">
                        {
                          permissinArray.map((permission, index) => {
                            const permissionData = findPermission(permission);
                            return (
                              <div key={index} className="w-full grid grid-cols-1 md:grid-cols-2 gap-2 p-2 border rounded-lg border-gray-200 dark:border-gray-800">
                                <div className="flex flex-col mb-1">
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
                    <TabsContent value="custom_search" className="min-h-56">
                      <Card className="w-full mb-4">
                        <CardHeader>
                          <CardTitle>Custom Search Through Dex and Resources</CardTitle>
                          <div className="flex items-center space-x-2">
                            <Switch id="regex-search" />
                            <label htmlFor="regex-search">Regex</label>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleSearch}>
                            <div className="grid w-full items-center gap-4">
                              <div className="flex w-full items-center space-x-2">
                                <Input type="text" id="search-input" placeholder="Search.." />
                                <Button type="submit">Search</Button>
                              </div>

                            </div>
                          </form>
                        </CardContent>

                      </Card>
                      <div className="grid gap-2 w-full overflow-x-auto">
                        {
                          searchResults.map((result, index) => {
                            return (
                              <div key={index} className="p-2 border rounded-lg border-gray-200 dark:border-gray-800">
                                {result}
                              </div>
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
