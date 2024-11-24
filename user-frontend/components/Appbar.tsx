"use client"
import { BACKEND_URL } from '@/config';
import { useWallet } from '@solana/wallet-adapter-react';
import {
        WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import axios from 'axios';
import { useEffect } from 'react';
export const Appbar = ()=>{
    const {publicKey, signMessage} = useWallet();
    async function signAndSend() {
        if(!publicKey)
        {
            return;
        }
        const message = new TextEncoder().encode("Sign in to mechanical turks") // this messaage work as jwt key or jwt secret 
        const signature = await signMessage?.(message)
        console.log(signature);

        const response = await axios.post(`${BACKEND_URL}/v1/user/signin`,{
            signature,
            publicKey : publicKey?.toString()
        })
        localStorage.setItem("token", response.data.token)
    }
    useEffect(()=>{
        signAndSend();    
    },[publicKey])

    return <div className="flex justify-between border-y-2 rounded bg-slate-100">
        <div className="text-3xl mt-3 ml-5 font-bold">
            Punit
        </div>
        <button className="text-2xl m-2 p-2">
            {publicKey ?<WalletDisconnectButton/> :<WalletMultiButton/>}
        </button>
       </div>
}