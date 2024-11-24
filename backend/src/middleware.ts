import { NextFunction , Request, Response } from "express";

import jwt from "jsonwebtoken"
import { JWT_SECRET, WORKER_JWT_SECRET } from "./config";


export   function authMiddleware(req : Request, res : Response , next : NextFunction){

    const authheader = req.headers["authorization"] ?? "";
    try {
        
    const decoded = jwt.verify(authheader, JWT_SECRET);
    //@ts-ignore
    if(decoded.userId)
    {
        //@ts-ignore
        req.userId =  decoded.userId;
       return next();
    }
    else{
            return res.status(403).json({
                mes :"You are not logged in",
            })
        }
    } catch (error) {
        return res.status(403).json({
                    mes :"You are not logged in",
                    errror : error
                })
    }
}

export   function workerMiddleware(req : Request, res : Response , next : NextFunction){

    const authheader = req.headers["authorization"] ?? "";
    try {   
        
    const decoded = jwt.verify(authheader, WORKER_JWT_SECRET);
    //@ts-ignore
    if(decoded.userId)
    {
        //@ts-ignore
        req.userId =  decoded.userId;
       return next();
    }
    else{
            return res.status(403).json({
                mes :"You are not logged in",
            })
        }
    } catch (error) {
        return res.status(403).json({
                    mes :"You are not logged in",
                    errror : error
                })
    }
}

