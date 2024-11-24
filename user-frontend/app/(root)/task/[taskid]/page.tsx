"use client"
import { Appbar } from "@/components/Appbar"
import { BACKEND_URL } from "@/config"
import axios from "axios"
import { useEffect, useState } from "react"

async function getDetails(taskId:string) {
    const response = await axios.get(`${BACKEND_URL}/v1/user/task?taskId=${taskId}`,{
        headers:{
            "Authorization" : localStorage.getItem("token")
        }
    })
    // console.log(response.data)

    return response.data
}

export default function Page({params: { 
    taskid 
}}: {params: { taskid: string }}){

    const [result, setResult] = useState<Record<string, {
        count: number;
        task: {
            imageUrl: string
        }
    }>>({});
    const [taskDetails, setTaskDetails] = useState<{title ?:string}>({});

    useEffect(()=>{
     getDetails(taskid)
         .then((data)=>{
            setResult(data.result);
            setTaskDetails(data.taskDetails)
         })
    },[taskid])

    
    return <div>
        <Appbar/>
        <div className='text-2xl pt-20 flex justify-center'>
            {taskDetails.title}
        </div>
        <div className="flex justify-center pt-8">
         
        {Object.keys(result || {}).map(taskId => <GetImage imageUrl={result[taskId].task.imageUrl} votes={result[taskId].count} />)}
        </div>
    </div>
}

function GetImage({imageUrl, votes}:{
    imageUrl : string,
    votes : number;
}){
    return <div>
        <img className="p-2 w-96 rounded-ml" src={imageUrl} />
        <div className="flex justify-center">
            {votes}
        </div>
    </div>
}