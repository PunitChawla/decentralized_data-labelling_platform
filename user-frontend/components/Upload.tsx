"use client"
import { useState } from "react"
import { UploadImage } from "./UploadImage";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { useRouter } from "next/navigation";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

export const Upload = ()=>{
    
    const router = useRouter();
    const [images , setImages] = useState<string[]>([]);
    const [title , setTitle] = useState("");
    const[ txsignature , sendTxsignature] = useState("");
    const{ publicKey , sendTransaction } = useWallet();
    const {connection} = useConnection();
    async function Onsumbit() {
        const response = await axios.post(`${BACKEND_URL}/v1/user/task`,{
            options: images.map(image =>({
            imageUrl : image    
          })),
          title,
          signature : txsignature
        },{
            headers:{
                "Authorization" : localStorage.getItem("token")
            }
        })
       router.push(`/task/${response.data.id}`);
    }

    
    async function makePayment() {
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                //@ts-ignore
                fromPubkey : publicKey,
                toPubkey : new PublicKey("5SF8rwapj5iuhyH3Lo26iFBTVTpLXChqMHskgQKy3sRp"),
                lamports : 1000000  // amount 10 ^ 7 = 0.01 sol 
            })
        )

        const{
            context : {slot : minContextSlot },
            value : {blockhash , lastValidBlockHeight }
        } = await connection.getLatestBlockhashAndContext();

        const signature = await sendTransaction(transaction , connection, { minContextSlot});

        await connection.confirmTransaction({blockhash, lastValidBlockHeight, signature});
        sendTxsignature(signature);
    }
    
    
    return <div className=" flex justify-center ">
        <div className="max-w-screen-lg w-full">
            <div className="text-2xl text-left pt-20 w-full ">
                Create a task 
            </div>
           <div className="mb-6 mt-2">
            <label  className="block mb-2text-sm font-medium text-gray-900 ">Task Details</label>
            <input onChange={(e)=>{
                setTitle(e.target.value);
            }} type="Text"  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 " placeholder="What is your task" required />
          </div>
          <label className=" block mt-8 text-md font-medium text-grey-900 text-black">Add image</label>
          
          <div className="flex justify-center pt-4 max-w-screen-lg ">
                {images.map(image => <UploadImage image={image} onImageAdded={(imageUrl) => {
                    setImages(i => [...i, imageUrl]);
                }} />)}
            </div>

            <div className="ml-4 pt-2 flex justify-center">
            <UploadImage onImageAdded={(imageUrl) => {
                setImages(i => [...i, imageUrl]);
            }} />
        </div>

        <div className="flex justify-center">
            <button onClick={ txsignature ? Onsumbit :makePayment  } type="button" className="mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
                { txsignature ? "Submit task" : "Pay : 0.001 Sol" }
            </button>
        </div>
          </div>
    </div>
}