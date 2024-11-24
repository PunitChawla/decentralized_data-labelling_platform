"use client"
import { BACKEND_URL } from "@/config";
import axios from "axios";
import { useEffect, useRef, useState } from "react"

interface Task {
        id: number,
        title: string
        options: {
            id : number;
            image_url : string
            task_id : number
        }[]
        amount: number
    }

export const NextTask = ()=>{
    const [currentTask , setCurrentTask] = useState<Task | null>(null);
    const [loading , setLoading]  = useState(true);
    const [submiting ,setSubmitting] = useState(false);
    useEffect(()=>{
        axios.get(`${BACKEND_URL}/v1/worker/NextTask`,{
            headers:{
                "Authorization" : localStorage.getItem("token")
            }
        })
        .then((res)=>{
            setCurrentTask(res.data.task)
            setLoading(false)
        })
        .catch(e =>{
            setLoading(false);
            setCurrentTask(null)
        })
    },[])
    if(loading)
    {
        return <div className=" h-screen flex justify-center flex-col">
         <div className="flex justify-center text-3xl font-bold">
            Loading... 
        </div>
        </div>
    }
    if( !currentTask)
    {
        return <div className=" h-screen flex justify-center flex-col">
         <div className="flex justify-center text-3xl font-bold">
            Please check back in some time there are no pending task at the moment 
        </div>
        </div>
    }
    return  <div>
    <div className='text-2xl pt-20 flex justify-center'>
        {currentTask.title}
        {submiting && "submitting.."}
    </div>
    <div className="flex justify-center pt-8">
        {currentTask.options.map(option=> <Option onSelect={async()=>{
            setSubmitting(true);
            try {

                const response =await axios.post(`${BACKEND_URL}/v1/worker/submission`,{
                    taskId : currentTask.id.toString(),
                    selection : option.id.toString()
                },{
                    headers:{
                        "Authorization" : localStorage.getItem("token")
                    }
                });
                const nextTask = response.data.nextTask;
                if(nextTask)
                {
                    setCurrentTask(nextTask)
                }
                if(!nextTask)
                {
                    setCurrentTask(null)
                }
                setSubmitting(false)
                } catch (error) {
                    console.log(error)
                }
                setSubmitting(false)
        }}  image_url = {option.image_url}/>)}
    </div>
</div>
}

function Option({ image_url , onSelect}:{image_url : string , onSelect:()=>void})
{
    return <div>
        <img  onClick ={onSelect} className="p-2 w-96 rounded-md" src={image_url} />
    </div>
}

