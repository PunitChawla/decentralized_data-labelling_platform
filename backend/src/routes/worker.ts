import { PrismaClient } from "@prisma/client";
import { Router } from "express";

import jwt, { decode } from 'jsonwebtoken';
import { workerMiddleware } from "../middleware";
import { PRIVATE_KEY, TOTAL_DECIMAL, WORKER_JWT_SECRET } from "../config";
import { getNextTask } from "../db";
import { createSubmissionInput } from "../types";
import nacl from "tweetnacl";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
// import { decode as bs58decode } from 'bs58';
import { Buffer } from 'buffer';

const router = Router();
const TOTAL_SUBMISSION = 100;

const connection = new Connection(process.env.RPC_URL ?? "https://api.devnet.solana.com");
const prismaClient =  new PrismaClient();

router.post("/signin",async (req,res)=>{

    const {publicKey , signature} = req.body;

    const signedString = "Sign in to mechanical turks as worker";
    const message = new TextEncoder().encode("Sign in to mechanical turks as worker");
    console.log(signature);
    console.log( new Uint8Array(signature?.data))
    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature?.data),
        new PublicKey(publicKey).toBytes()
    )
    console.log(result)

    const exitinguser = await prismaClient.worker.findFirst({
        where :{
            address : publicKey
        }
    }) 

    if(exitinguser)
    {
        const token = jwt.sign({
            userId : exitinguser.id
        }, WORKER_JWT_SECRET);
        res.json({
            token : token,
            amount : exitinguser.pending_amount/100000000
        })
    }
    else{
        const user = await prismaClient.worker.create({
            data:{
                address:publicKey,
                pending_amount :0,
                locked_amount  :0
            }
        })

        const token = jwt.sign({
            userId : user.id
        }, WORKER_JWT_SECRET);
        res.json({
            token : token,
            amount  : 0
        })

    }
})

//@ts-ignore
router.get("/NextTask" , workerMiddleware, async(req,res)=>{
    //@ts-ignore
    const userId = req.userId;
    const task =  await getNextTask(userId)
    if(!task){
        res.json({
            msg : "No more pending task"
        })
    }

    else{
        res.json({
            task
        })
    }
})

//@ts-ignore
router.post ("/submission", workerMiddleware, async (req,res)=>{

    ///@ts-ignore
    const userId = req.userId;
    const body = req.body;

    const parseBody = createSubmissionInput.safeParse(body);
    if(parseBody.success)
    {
        const task = await getNextTask(userId);
        if(!task || task.id!==Number(parseBody.data.taskId))
        {
            console.log("hy")
            return res.status(433).json({
                msg :"incorrect task id "
            })
        }
        else{
            try {
            const amount = (Number(task.amount)/TOTAL_SUBMISSION)
            const submission = await prismaClient.$transaction(async tx=>{
                console.log("here 1");
                const submission = await tx.submission.create({
                    data:{
                        option_id : Number(parseBody.data.selection),
                        worker_id : userId,
                        task_id : Number( parseBody.data.taskId),
                        amount 
                    }
                })
                console.log("here 2");
                console.log( "option id = "+Number(parseBody.data.selection))
                await tx.worker.update({
                    where:{
                        id : userId,
                    },
                    data:{
                        pending_amount:{
                            increment : Number(amount) 
                        }
                    }
                })
                console.log("here 2");
              return submission;  
            })
            const nextTask = await getNextTask(userId);
           return res.json({
                nextTask,
                amount
            })

        } catch (error) {
           return res.json({
                msg : "make sure your id and selection id is right",
                error
            })
        }

        }
    }
})

//@ts-ignore
router.get("/balance", workerMiddleware, async(req, res)=>{
    //@ts-ignore
    const userId : string = req.userId;
    const worker = await prismaClient.worker.findFirst({
        where:{
            id : Number(userId)
        }
    })

    res.json({
        pendingAmount : worker?.pending_amount,
        lockedAmount : worker?.locked_amount
    })
})

//@ts-ignore
router.post("/payout", async (req, res)=>{
    //@ts-ignore
    const userId = req.userId;
    const worker = await prismaClient.worker.findFirst({
        where:{
            id : userId
        }
    })

    if(!worker)
    {
        return res.status(403).json({
            msg : "worker not found"
        })
    }
    console.log(worker.address)
    console.log(PublicKey)
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey :new PublicKey("5SF8rwapj5iuhyH3Lo26iFBTVTpLXChqMHskgQKy3sRp"),
            toPubkey : new PublicKey(worker.address),
            lamports: 1000_000_000 * worker.pending_amount / TOTAL_DECIMAL,
        })
    )
    const address = worker.address;
    const txnId = transaction.signature;

    // const secretKey = bs58decode(PRIVATE_KEY);
    const secretKey = Buffer.from(PRIVATE_KEY, 'base64');
    console.log(secretKey)
    console.log(PRIVATE_KEY)
    if (!secretKey || secretKey.length === 0) {
        return res.status(500).json({
            message: "Invalid PRIVATE_KEY"
        });
    }
    //@ts-ignore
    const keypair = Keypair.fromSecretKey(secretKey);
    let signature = "";
    try {
        signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [keypair],
        );

     } catch(e) {
        return res.json({
            message: "Transaction failed"
        })
     }
    
    console.log(signature)
    await prismaClient.$transaction(async tx=>{
        await tx.worker.update({
            where:{
                id : Number(userId)
            },
            data:{
                pending_amount:{
                    decrement : worker.pending_amount
                },
                locked_amount:{
                    increment :worker.pending_amount
                }
            }
        })

        await tx.payouts.create({
            data:{
                user_id : userId,                                                              
                amount : worker.pending_amount,                                                              
                status : "Processing",                                                              
                signature : signature                                                              
            }                                                              
        })
    })
    res.json({
        msg : "payout processing",
        amount : worker.locked_amount
    })

})
export default router;