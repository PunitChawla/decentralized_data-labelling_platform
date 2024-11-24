"use client"
import { BACKEND_URL } from '@/config';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
        WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import axios from 'axios';
import { headers } from 'next/headers';
import { useEffect, useState } from 'react';
export const Appbar = ()=>{
    const {publicKey, signMessage} = useWallet();
    const [balance , setBalance] = useState(0);
    const connection = useConnection();
    async function signAndSend() {
        if(!publicKey)
        {
            return;
        }
        const message = new TextEncoder().encode("Sign in to mechanical turks as worker") // this messaage work as jwt key or jwt secret 
        const signature = await signMessage?.(message)
        console.log(signature);

        const response = await axios.post(`${BACKEND_URL}/v1/worker/signin`,{
            signature,
            publicKey : publicKey?.toString()
        })
        localStorage.setItem("token", response.data.token)
        setBalance(response.data.amount)
    }
    useEffect(()=>{
        signAndSend();    
    },[publicKey])

    async function makePayment() {
      const response = await axios.post(`${BACKEND_URL}/v1/worker/payout`,{
        headers: {
            "Authorization": localStorage.getItem("token")
        }
      });
      console.log(response.data);

    }
    return <div className="flex justify-between border-y-2 rounded bg-slate-100">
        <div className="text-3xl mt-3 ml-5 font-bold">
            Punit
        </div>
        <button className="text-2xl m-2 p-2 flex  justify-center">
        <button onClick={makePayment} className="mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
            Pay me out({ balance})         
            </button>
            {publicKey ?<WalletDisconnectButton/> :<WalletMultiButton/>}
        </button>
       </div>
}