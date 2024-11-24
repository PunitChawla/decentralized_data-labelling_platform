import { PrismaClient } from "@prisma/client";
import { response, Router } from "express";

import jwt  from "jsonwebtoken";

import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { authMiddleware } from "../middleware";
import { createTaskInput, singninput } from "../types";
import { ACCESSKEYID, JWT_SECRET, SECRETACCESSKEY, TOTAL_DECIMAL } from "../config";
import nacl from "tweetnacl";
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection(process.env.RPC_URL ?? "https://api.devnet.solana.com");

const  PARENT_WALLET_ADDRESS = "5SF8rwapj5iuhyH3Lo26iFBTVTpLXChqMHskgQKy3sRp" 

const prismaClient = new PrismaClient();
const router = Router();

router.post("/signin", async (req,res)=>{

    const valid = singninput.safeParse(req.body);
    if( !valid) 
    {
            res.status(403).json({
                msg : "invalid input"
        })
    }
    const {publicKey , signature} = req.body;

    const signedString = "Sign in to mechanical turks";
    const message = new TextEncoder().encode("Sign in to mechanical turks");
    console.log(signature);
    console.log( new Uint8Array(signature?.data))
    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature?.data),
        new PublicKey(publicKey).toBytes()
    )
    console.log(result)
  
    // search if presnet and if not then create a new user = upsert you this one for better code

    const exitinguser = await prismaClient.user.findFirst({
        where:{
            address : publicKey
        }
    })

    if(exitinguser)
    {
        const token = jwt.sign({
            userId : exitinguser?.id
        }, JWT_SECRET);
        res.json({
            token
        })
    }
    else{
        const user = await prismaClient.user.create({
            data:{
                address : publicKey
            }
        })
        const token = jwt.sign({
            userId : user.id
        },JWT_SECRET);

        res.json({
            token
        })
    }
})



const s3Client = new S3Client({
    credentials:{
        accessKeyId : ACCESSKEYID,
        secretAccessKey : SECRETACCESSKEY
    },
    region :"ap-south-1"
});

//@ts-ignore
router.get("/presignedUrl", authMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.userId;

    const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: 'decentralizeddata',
        Key: `fiver/${userId}/${Math.random()}/image.jpg`,
        Conditions: [
          ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Expires: 3600
    })
    
    res.json({
        preSignedUrl: url,
        fields
    })
    
})

//@ts-ignore
router.post("/task", authMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.userId;
    const parseData = createTaskInput.safeParse(req.body);

    // Validate input
    if (!parseData.success) {
        return res.status(411).json({ msg: "please send a valid input" });
    }

    const user = await prismaClient.user.findFirst({
        where: { id: userId }
    });

    // Fetch transaction details and verify payment
    //@ts-ignore
    const transaction = await connection.getTransaction(parseData.data.signature, {
        maxSupportedTransactionVersion: 1
    });

    console.log(transaction);

    // Check if the amount sent is 1 SOL (1 * TOTAL_DECIMAL)
    const amountTransferred = (transaction?.meta?.postBalances[1] ?? 0) - (transaction?.meta?.preBalances[1] ?? 0);
    if (amountTransferred !== 1000000) {
        
        console.log("amountTransferred : ");
        console.log(amountTransferred);
        return res.status(411).json({ msg: "Transaction signature/amount incorrect" });
    }

    // Verify the recipient address
    if (transaction?.transaction.message.getAccountKeys().get(1)?.toString() !== PARENT_WALLET_ADDRESS) {
        return res.status(411).json({ message: "Transaction send to wrong address"});
    }
    if(transaction.transaction.message.getAccountKeys().get(0)?.toString() !== user?.address)
    {
        return res.status(411).json({message : "you are not the user which done this transaction "})
    }

    // Use $transaction to ensure atomicity when creating task and options
    const response = await prismaClient.$transaction(async (tx) => {
        const createdTask = await tx.task.create({
            data: {
                title: parseData.data?.title ?? "click the most clickable first",
                amount: 1 * TOTAL_DECIMAL,
                signature: parseData.data?.signature ?? "",
                user_id: userId
            }
        });

        await tx.option.createMany({
            data: parseData.data?.options.map((option) => ({
                image_url: option.imageUrl,
                task_id: createdTask.id
            }))
        });

        return createdTask;
    });

    res.json({ id: response.id });
});


//@ts-ignore
router.get("/task", authMiddleware, async(req,res)=>{

    //@ts-ignore
    const taskId : string = req.query.taskId;
    //@ts-ignore
    const userId : string = req.userId
    console.log(taskId , userId);
    const taskDetails = await prismaClient.task.findFirst({
        where:{
            user_id : Number(userId),
            id: Number(taskId)
        },
        include:{
            options : true
        }
    })
    if(!taskDetails)
    {
        return res.status(411).json({
            message : "you dont have access to this task"
        })
    }

    const response = await prismaClient.submission.findMany({
        where :{
            task_id : Number(taskId)
        },
        include:{
            option : true
        }
    });
    
    const result : Record<string, {count : number , task:{imageUrl : string}}> = {};
    
    taskDetails.options.forEach(option=>{
        result[option.id]={
            count : 0,
            task:{
                imageUrl : option.image_url
            }
        }
    })
    response.forEach(r=>{
            result[r.option_id].count++;
    })
    res.json({
        result,
        taskDetails
    })
})

export default router;